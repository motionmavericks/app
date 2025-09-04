import fs from 'fs';
import path from 'path';
import { CodexAnalyzer } from '../utils/codex-analyzer';

interface TestResult {
  status: string;
  testName: string;
  browserName: string;
  error?: string;
}

interface DifferenceInfo {
  testName: string;
  browserName: string;
  error: string;
}

/**
 * Analyzes Playwright test results and generates comprehensive reports
 */
export class ResultsAnalyzer {
  private resultsPath: string;
  private codexAnalyzer: CodexAnalyzer;

  constructor(resultsPath: string = './test-results') {
    this.resultsPath = resultsPath;
    this.codexAnalyzer = new CodexAnalyzer();
  }

  /**
   * Analyzes test results and generates reports
   */
  async analyzeResults(): Promise<void> {
    console.log('\n🔍 Analyzing Playwright test results...');

    try {
      const differences = await this.extractDifferences();
      
      if (differences.length === 0) {
        console.log('✅ No visual differences found!');
        return;
      }

      console.log(`📊 Found ${differences.length} visual differences`);
      
      // Analyze patterns with Codex
      const analysis = await this.codexAnalyzer.analyzePatterns(differences);
      console.log('\n🧠 Pattern Analysis:', analysis);

      // Generate detailed report
      await this.generateReport(differences);
      
      // Provide actionable recommendations
      await this.generateRecommendations(differences);
      
    } catch (error) {
      console.error('❌ Error analyzing results:', error);
      throw error;
    }
  }

  /**
   * Extracts differences from test results
   */
  private async extractDifferences(): Promise<DifferenceInfo[]> {
    const differences: DifferenceInfo[] = [];
    
    // Check for results.json file
    const resultsFile = path.join(this.resultsPath, 'results.json');
    
    if (fs.existsSync(resultsFile)) {
      const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
      
      // Extract failed tests
      for (const suite of results.suites || []) {
        for (const test of suite.tests || []) {
          for (const result of test.results || []) {
            if (result.status === 'failed') {
              differences.push({
                testName: test.title,
                browserName: suite.title || 'unknown',
                error: result.error?.message || 'Visual difference detected'
              });
            }
          }
        }
      }
    }

    // Also scan for test result directories
    if (fs.existsSync(this.resultsPath)) {
      const testDirs = fs.readdirSync(this.resultsPath)
        .filter(dir => fs.statSync(path.join(this.resultsPath, dir)).isDirectory());

      for (const dir of testDirs) {
        const dirPath = path.join(this.resultsPath, dir);
        const files = fs.readdirSync(dirPath);
        
        // Check for failed test artifacts
        if (files.some(f => f.includes('test-failed'))) {
          differences.push({
            testName: this.extractTestName(dir),
            browserName: this.extractBrowserName(dir),
            error: 'Visual regression detected'
          });
        }
      }
    }

    return differences;
  }

  /**
   * Generates comprehensive test failure report
   */
  private async generateReport(differences: DifferenceInfo[]): Promise<void> {
    console.log('\n📄 Generating comprehensive report...');
    const testResultsData = differences.map(diff => ({
      status: 'failed',
      testName: diff.testName,
      browserName: diff.browserName,
      error: diff.error
    }));

    const report = {
      timestamp: new Date().toISOString(),
      totalDifferences: differences.length,
      results: testResultsData,
      summary: {
        browserBreakdown: this.getBrowserBreakdown(differences),
        commonErrors: this.getCommonErrors(differences)
      }
    };

    const reportPath = path.join(this.resultsPath, 'analysis-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📝 Report saved to: ${reportPath}`);
  }

  /**
   * Generates actionable recommendations
   */
  private async generateRecommendations(differences: DifferenceInfo[]): Promise<void> {
    console.log('\n💡 Generating recommendations...');
    
    const recommendations = await this.codexAnalyzer.generateRecommendations(differences);
    
    console.log('\n🎯 Recommendations:');
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });

    // Save recommendations to file
    const recPath = path.join(this.resultsPath, 'recommendations.md');
    const content = `# Visual Test Analysis Recommendations\n\n${recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}`;
    fs.writeFileSync(recPath, content);
  }

  /**
   * Extract test name from directory path
   */
  private extractTestName(dirPath: string): string {
    return dirPath.split('-').slice(0, 3).join(' ');
  }

  /**
   * Extract browser name from directory path
   */
  private extractBrowserName(dirPath: string): string {
    if (dirPath.includes('chromium')) return 'chromium';
    if (dirPath.includes('firefox')) return 'firefox';
    if (dirPath.includes('webkit')) return 'webkit';
    return 'unknown';
  }

  /**
   * Get browser breakdown statistics
   */
  private getBrowserBreakdown(differences: DifferenceInfo[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    for (const diff of differences) {
      breakdown[diff.browserName] = (breakdown[diff.browserName] || 0) + 1;
    }
    
    return breakdown;
  }

  /**
   * Get common error patterns
   */
  private getCommonErrors(differences: DifferenceInfo[]): Record<string, number> {
    const errors: Record<string, number> = {};
    
    for (const diff of differences) {
      errors[diff.error] = (errors[diff.error] || 0) + 1;
    }
    
    return errors;
  }
}

// Main execution
if (require.main === module) {
  const analyzer = new ResultsAnalyzer();
  analyzer.analyzeResults().catch(console.error);
}