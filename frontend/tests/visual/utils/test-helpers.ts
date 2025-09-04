import { Page, expect } from '@playwright/test';

export interface VisualTestOptions {
  threshold?: number;
  animations?: 'allow' | 'disabled';
  clip?: { x: number; y: number; width: number; height: number };
  fullPage?: boolean;
  timeout?: number;
}

export interface VisualDifference {
  screenshotPath: string;
  baselinePath: string;
  diffPath: string;
  diffPercentage: number;
  testName: string;
  browserName: string;
  viewport: { width: number; height: number };
  error?: string;
}

export class VisualTestHelper {
  static async preparePageForVisualTest(
    page: Page, 
    options: VisualTestOptions = {}
  ): Promise<void> {
    const { animations = 'disabled', timeout = 30000 } = options;

    if (animations === 'disabled') {
      // Disable CSS animations and transitions
      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
            scroll-behavior: auto !important;
          }
        `
      });
    }

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Wait for any remaining async operations
    await page.waitForTimeout(100);

    // Wait for fonts to load
    await page.evaluate(() => document.fonts.ready);

    // Wait for images to load
    await page.waitForFunction(() => {
      const images = Array.from(document.images);
      return images.every(img => img.complete);
    }, { timeout });
  }

  static async waitForStableDOM(page: Page, timeout = 5000): Promise<void> {
    let lastHeight = 0;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const currentHeight = await page.evaluate(() => document.body.scrollHeight);
      
      if (currentHeight === lastHeight) {
        await page.waitForTimeout(100);
        const finalHeight = await page.evaluate(() => document.body.scrollHeight);
        
        if (finalHeight === currentHeight) {
          break; // DOM is stable
        }
      }
      
      lastHeight = currentHeight;
      await page.waitForTimeout(50);
    }
  }

  static async hideVolatileElements(page: Page): Promise<void> {
    // Hide elements that commonly cause flaky visual tests
    await page.addStyleTag({
      content: `
        /* Hide scrollbars */
        ::-webkit-scrollbar {
          width: 0px !important;
          height: 0px !important;
        }
        
        /* Hide cursor/caret */
        * {
          caret-color: transparent !important;
        }
        
        /* Hide focus outlines */
        *:focus {
          outline: none !important;
          box-shadow: none !important;
        }
        
        /* Common volatile elements */
        [data-testid*="timestamp"],
        [data-testid*="time"],
        [class*="timestamp"],
        [class*="time-"],
        .loading-spinner,
        .progress-bar,
        .tooltip,
        [title]:hover::after {
          visibility: hidden !important;
        }
      `
    });
  }

  static async stabilizeAnimations(page: Page): Promise<void> {
    // Wait for CSS animations to complete
    await page.evaluate(() => {
      return Promise.all([
        ...document.getAnimations()
      ].map(animation => animation.finished));
    });
  }

  static async captureVisualTest(
    page: Page,
    testName: string,
    options: VisualTestOptions = {}
  ): Promise<Buffer> {
    await this.preparePageForVisualTest(page, options);
    
    if (options.animations === 'disabled') {
      await this.stabilizeAnimations(page);
    }

    const screenshotOptions = {
      fullPage: options.fullPage ?? true,
      clip: options.clip,
      threshold: options.threshold ?? 0.2,
      animations: options.animations === 'disabled' ? 'disabled' as const : 'allow' as const
    };

    return await page.screenshot(screenshotOptions);
  }

  static async compareVisuals(
    page: Page,
    testName: string,
    options: VisualTestOptions = {}
  ): Promise<void> {
    await this.preparePageForVisualTest(page, options);
    
    const screenshotOptions = {
      threshold: options.threshold ?? 0.2,
      fullPage: options.fullPage ?? true,
      clip: options.clip,
      animations: options.animations === 'disabled' ? 'disabled' as const : 'allow' as const
    };

    await page.waitForTimeout(100); // Final stabilization
    await expect(page).toHaveScreenshot(`${testName}.png`, screenshotOptions);
  }

  static generateTestId(component: string, variant?: string, state?: string): string {
    const parts = [component];
    if (variant) parts.push(variant);
    if (state) parts.push(state);
    return parts.join('-').toLowerCase().replace(/\s+/g, '-');
  }

  static async mockApiResponses(page: Page): Promise<void> {
    // Mock common API endpoints to prevent network flakiness
    await page.route('**/api/assets*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          assets: [
            {
              id: 'test-asset-1',
              name: 'Test Video.mp4',
              type: 'video',
              size: 1024000,
              duration: 120,
              thumbnail: '/test-thumbnail.jpg',
              createdAt: '2024-01-01T00:00:00Z'
            }
          ],
          total: 1,
          page: 1,
          limit: 10
        })
      });
    });

    await page.route('**/api/collections*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          collections: [
            {
              id: 'test-collection-1',
              name: 'Test Collection',
              description: 'A test collection for visual testing',
              assetCount: 5,
              createdAt: '2024-01-01T00:00:00Z'
            }
          ]
        })
      });
    });
  }

  static async setViewport(
    page: Page, 
    preset: 'mobile' | 'tablet' | 'desktop' | 'wide'
  ): Promise<void> {
    const viewports = {
      mobile: { width: 375, height: 667 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1920, height: 1080 },
      wide: { width: 2560, height: 1440 }
    };

    await page.setViewportSize(viewports[preset]);
  }

  static async fillFormStably(
    page: Page,
    selector: string,
    value: string
  ): Promise<void> {
    await page.waitForSelector(selector);
    await page.click(selector);
    await page.fill(selector, ''); // Clear first
    await page.type(selector, value, { delay: 10 }); // Slow typing for stability
    await page.waitForTimeout(100); // Let UI update
  }

  static async clickStably(
    page: Page,
    selector: string,
    options: { timeout?: number } = {}
  ): Promise<void> {
    await page.waitForSelector(selector, { timeout: options.timeout });
    await page.hover(selector); // Ensure element is interactive
    await page.waitForTimeout(50); // Brief pause
    await page.click(selector);
    await page.waitForTimeout(100); // Let UI update
  }

  static getDifferenceFromError(error: Error & { message: string }): VisualDifference | null {
    if (!error?.message?.includes('Screenshot comparison failed')) {
      return null;
    }

    // Extract paths from Playwright error message
    const diffMatch = error.message.match(/Expected: (.+?\.png)/);
    const actualMatch = error.message.match(/Received: (.+?\.png)/);
    const diffImageMatch = error.message.match(/Diff: (.+?\.png)/);

    if (!diffMatch || !actualMatch || !diffImageMatch) {
      return null;
    }

    return {
      screenshotPath: actualMatch[1],
      baselinePath: diffMatch[1],
      diffPath: diffImageMatch[1],
      diffPercentage: this.extractDiffPercentage(error.message),
      testName: 'unknown',
      browserName: 'unknown',
      viewport: { width: 0, height: 0 },
      error: error.message
    };
  }

  private static extractDiffPercentage(errorMessage: string): number {
    const match = errorMessage.match(/(\d+\.?\d*)% diff/);
    return match ? parseFloat(match[1]) : 0;
  }

  static createMockVisualDifference(testName: string, diffPercentage = 2.5): VisualDifference {
    return {
      screenshotPath: `/test-results/${testName}-actual.png`,
      baselinePath: `/test-results/${testName}-expected.png`, 
      diffPath: `/test-results/${testName}-diff.png`,
      diffPercentage,
      testName,
      browserName: 'chromium',
      viewport: { width: 1920, height: 1080 }
    };
  }
}

// Export expect for convenience
export { expect } from '@playwright/test';