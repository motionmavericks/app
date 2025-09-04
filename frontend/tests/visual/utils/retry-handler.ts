import { TestInfo } from '@playwright/test';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: Error) => boolean;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalDuration: number;
}

export class RetryHandler {
  private static readonly DEFAULT_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    retryCondition: (error: Error) => {
      // Retry on common flaky test errors
      const retryableErrors = [
        'timeout',
        'network',
        'screenshot',
        'locator',
        'navigation',
        'waiting for',
        'page.goto',
        'page.waitFor'
      ];
      
      return retryableErrors.some(pattern => 
        error.message.toLowerCase().includes(pattern)
      );
    }
  };

  constructor(private config: Partial<RetryConfig> = {}) {
    this.config = { ...RetryHandler.DEFAULT_CONFIG, ...this.config };
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    testInfo?: TestInfo,
    operationName?: string
  ): Promise<RetryResult<T>> {
    const config = this.config as Required<RetryConfig>;
    const startTime = Date.now();
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
      try {
        const result = await operation();
        const totalDuration = Date.now() - startTime;
        
        if (attempt > 1) {
          console.log(`✅ ${operationName || 'Operation'} succeeded on attempt ${attempt}/${config.maxRetries + 1}`);
          if (testInfo) {
            testInfo.annotations.push({
              type: 'retry-success',
              description: `${operationName || 'Operation'} succeeded on attempt ${attempt} after ${totalDuration}ms`
            });
          }
        }
        
        return {
          success: true,
          result,
          attempts: attempt,
          totalDuration
        };
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === config.maxRetries + 1) {
          // Final attempt failed
          break;
        }
        
        // Check if we should retry this error
        if (!config.retryCondition(lastError)) {
          console.log(`❌ ${operationName || 'Operation'} failed with non-retryable error: ${lastError.message}`);
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
          config.maxDelay
        );
        
        console.log(`🔄 ${operationName || 'Operation'} failed on attempt ${attempt}/${config.maxRetries + 1}: ${lastError.message}`);
        console.log(`   Retrying in ${delay}ms...`);
        
        if (testInfo) {
          testInfo.annotations.push({
            type: 'retry-attempt',
            description: `Attempt ${attempt} failed: ${lastError.message}. Retrying in ${delay}ms`
          });
        }
        
        await this.sleep(delay);
      }
    }
    
    const totalDuration = Date.now() - startTime;
    console.log(`❌ ${operationName || 'Operation'} failed after ${config.maxRetries + 1} attempts in ${totalDuration}ms`);
    
    if (testInfo) {
      testInfo.annotations.push({
        type: 'retry-exhausted',
        description: `Failed after ${config.maxRetries + 1} attempts in ${totalDuration}ms: ${lastError?.message}`
      });
    }
    
    return {
      success: false,
      error: lastError,
      attempts: config.maxRetries + 1,
      totalDuration
    };
  }

  // Specific retry methods for common visual testing operations
  async retryScreenshot<T>(
    operation: () => Promise<T>,
    testInfo?: TestInfo,
    screenshotName?: string
  ): Promise<RetryResult<T>> {
    return this.executeWithRetry(
      operation,
      testInfo,
      `Screenshot ${screenshotName || 'capture'}`
    );
  }

  async retryNavigation<T>(
    operation: () => Promise<T>,
    testInfo?: TestInfo,
    url?: string
  ): Promise<RetryResult<T>> {
    return this.executeWithRetry(
      operation,
      testInfo,
      `Navigation ${url ? `to ${url}` : ''}`
    );
  }

  async retryElementWait<T>(
    operation: () => Promise<T>,
    testInfo?: TestInfo,
    selector?: string
  ): Promise<RetryResult<T>> {
    return this.executeWithRetry(
      operation,
      testInfo,
      `Element wait ${selector ? `for '${selector}'` : ''}`
    );
  }

  async retryStabilityCheck<T>(
    operation: () => Promise<T>,
    testInfo?: TestInfo
  ): Promise<RetryResult<T>> {
    return this.executeWithRetry(
      operation,
      testInfo,
      'DOM stability check'
    );
  }

  // Static utility methods
  static createForScreenshots(maxRetries = 2, baseDelay = 2000): RetryHandler {
    return new RetryHandler({
      maxRetries,
      baseDelay,
      maxDelay: 8000,
      backoffFactor: 2,
      retryCondition: (error) => {
        const screenshotErrors = [
          'screenshot',
          'image',
          'visual',
          'timeout',
          'locator'
        ];
        return screenshotErrors.some(pattern => 
          error.message.toLowerCase().includes(pattern)
        );
      }
    });
  }

  static createForNetworkOperations(maxRetries = 3, baseDelay = 1000): RetryHandler {
    return new RetryHandler({
      maxRetries,
      baseDelay,
      maxDelay: 5000,
      backoffFactor: 1.5,
      retryCondition: (error) => {
        const networkErrors = [
          'network',
          'timeout',
          'connection',
          'refused',
          'reset',
          'navigation'
        ];
        return networkErrors.some(pattern => 
          error.message.toLowerCase().includes(pattern)
        );
      }
    });
  }

  static createForStabilityChecks(maxRetries = 3, baseDelay = 500): RetryHandler {
    return new RetryHandler({
      maxRetries,
      baseDelay,
      maxDelay: 2000,
      backoffFactor: 1.5,
      retryCondition: (error) => {
        const stabilityErrors = [
          'waiting for',
          'locator',
          'element',
          'visible',
          'hidden',
          'timeout'
        ];
        return stabilityErrors.some(pattern => 
          error.message.toLowerCase().includes(pattern)
        );
      }
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Utility method to check if an error is considered flaky
  static isFlaky(error: Error): boolean {
    const flakyIndicators = [
      'timeout',
      'screenshot comparison failed',
      'locator not found',
      'page.goto: timeout',
      'waiting for selector',
      'network error',
      'connection refused',
      'intermittent',
      'flaky',
      'unstable'
    ];
    
    return flakyIndicators.some(indicator => 
      error.message.toLowerCase().includes(indicator)
    );
  }

  // Create summary for test reports
  static summarizeRetryAttempts(testInfo: TestInfo): string {
    const retryAnnotations = testInfo.annotations.filter(
      a => a.type.startsWith('retry-')
    );
    
    if (retryAnnotations.length === 0) {
      return 'No retry attempts needed';
    }
    
    const attempts = retryAnnotations.filter(a => a.type === 'retry-attempt').length;
    const successes = retryAnnotations.filter(a => a.type === 'retry-success').length;
    const exhausted = retryAnnotations.filter(a => a.type === 'retry-exhausted').length;
    
    return `Retry Summary: ${attempts} attempts, ${successes} recoveries, ${exhausted} failures`;
  }
}