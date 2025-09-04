import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

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

export interface AnalysisResult {
  summary: string;
  classifications: {
    critical: VisualDifference[];
    minor: VisualDifference[];
    cosmetic: VisualDifference[];
  };
  recommendations: {
    testName: string;
    priority: 'high' | 'medium' | 'low';
    action: string;
    reasoning: string;
  }[];
  trends: string[];
}

interface ParsedRecommendation {
  testName: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
  reasoning: string;
}

interface ParsedAnalysis {
  summary?: string;
  classifications?: {
    critical?: string[];
    minor?: string[];
    cosmetic?: string[];
  };
  recommendations?: ParsedRecommendation[];
  trends?: string[];
}

export class CodexAnalyzer {
  private codexScriptPath: string;

  constructor() {
    this.codexScriptPath = path.resolve(__dirname, '../../../../.claude/scripts/codex_sync.sh');
  }

  async analyzeVisualDifferences(differences: VisualDifference[]): Promise<AnalysisResult> {
    if (differences.length === 0) {
      return this.createEmptyResult();
    }

    try {
      const prompt = this.buildAnalysisPrompt(differences);
      const analysis = await this.callCodex(prompt);
      return this.parseAnalysisResult(analysis, differences);
    } catch (error) {
      console.error('Codex analysis failed:', error);
      return this.createFallbackResult(differences);
    }
  }

  private buildAnalysisPrompt(differences: VisualDifference[]): string {
    const differencesJson = JSON.stringify(differences, null, 2);
    
    return `Analyze these visual test differences and provide structured feedback:

${differencesJson}

Return a JSON response with this exact structure:
{
  "summary": "Brief overview of the visual changes found",
  "classifications": {
    "critical": ["testName1", "testName2"], 
    "minor": ["testName3"],
    "cosmetic": ["testName4"]
  },
  "recommendations": [
    {
      "testName": "exact test name",
      "priority": "high|medium|low",
      "action": "specific action to take",
      "reasoning": "why this action is recommended"
    }
  ],
  "trends": ["pattern1", "pattern2"]
}

Focus on:
1. Classifying changes by impact (critical = breaks functionality, minor = affects UX, cosmetic = visual only)
2. Providing actionable recommendations with clear reasoning
3. Identifying patterns across multiple test failures
4. Being concise but thorough in explanations`;
  }

  private async callCodex(prompt: string): Promise<string> {
    if (!existsSync(this.codexScriptPath)) {
      throw new Error(`Codex script not found: ${this.codexScriptPath}`);
    }

    try {
      const result = execSync(`bash "${this.codexScriptPath}" "${prompt.replace(/"/g, '\\"')}"`, {
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        timeout: 60000 // 1 minute timeout
      });
      
      return result.trim();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Codex execution failed: ${error.message}`);
      }
      throw error;
    }
  }

  private parseAnalysisResult(analysis: string, differences: VisualDifference[]): AnalysisResult {
    try {
      // Try to extract JSON from the response (handle cases where Codex adds extra text)
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : analysis;
      
      const parsed = JSON.parse(jsonString) as ParsedAnalysis;
      
      return this.validateAndTransformResult(parsed, differences);
    } catch (error) {
      console.warn('Failed to parse Codex response as JSON, creating fallback result:', error);
      return this.createFallbackResult(differences);
    }
  }

  private validateAndTransformResult(parsed: ParsedAnalysis, differences: VisualDifference[]): AnalysisResult {
    const result: AnalysisResult = {
      summary: typeof parsed.summary === 'string' ? parsed.summary : 'Analysis completed',
      classifications: {
        critical: [],
        minor: [],
        cosmetic: []
      },
      recommendations: [],
      trends: Array.isArray(parsed.trends) ? parsed.trends.filter((t): t is string => typeof t === 'string') : []
    };

    // Create a map for quick lookup
    const diffMap = new Map(differences.map(diff => [diff.testName, diff]));

    // Transform classifications from test names to actual VisualDifference objects
    if (parsed.classifications && typeof parsed.classifications === 'object') {
      Object.keys(result.classifications).forEach(category => {
        if (Array.isArray(parsed.classifications?.[category as keyof typeof parsed.classifications])) {
          result.classifications[category as keyof typeof result.classifications] = 
            (parsed.classifications[category as keyof typeof parsed.classifications] as string[])
              .map((testName: string) => diffMap.get(testName))
              .filter((diff): diff is VisualDifference => diff !== undefined);
        }
      });
    }

    // Validate recommendations structure
    if (Array.isArray(parsed.recommendations)) {
      result.recommendations = parsed.recommendations.filter((rec): rec is ParsedRecommendation => 
        rec && typeof rec.testName === 'string' && typeof rec.action === 'string'
      );
    }

    return result;
  }

  private createEmptyResult(): AnalysisResult {
    return {
      summary: 'No visual differences found - all tests passed!',
      classifications: {
        critical: [],
        minor: [],
        cosmetic: []
      },
      recommendations: [],
      trends: []
    };
  }

  private createFallbackResult(differences: VisualDifference[]): AnalysisResult {
    return {
      summary: `Found ${differences.length} visual difference${differences.length === 1 ? '' : 's'} that need review`,
      classifications: {
        critical: differences.filter(d => d.diffPercentage > 5),
        minor: differences.filter(d => d.diffPercentage > 1 && d.diffPercentage <= 5),
        cosmetic: differences.filter(d => d.diffPercentage <= 1)
      },
      recommendations: differences.map(diff => ({
        testName: diff.testName,
        priority: diff.diffPercentage > 5 ? 'high' as const : diff.diffPercentage > 1 ? 'medium' as const : 'low' as const,
        action: 'Review visual difference and update baseline if intentional',
        reasoning: `${diff.diffPercentage.toFixed(2)}% visual difference detected`
      })),
      trends: ['Automated analysis unavailable - manual review recommended']
    };
  }

  async generateTestReport(results: { status: string }[], analysis: AnalysisResult): Promise<string> {
    const reportPrompt = `
Generate a comprehensive visual testing report for the Media Asset Management frontend.

Test Results Summary:
- Total tests: ${results.length}
- Passed: ${results.filter(r => r.status === 'passed').length}
- Failed: ${results.filter(r => r.status === 'failed').length}

Visual Analysis:
${JSON.stringify(analysis, null, 2)}

Create a markdown report with:
1. Executive Summary
2. Test Results Overview 
3. Visual Differences Analysis
4. Recommended Actions
5. Next Steps

Focus on actionable insights for developers and QA team.
    `.trim();

    try {
      return await this.callCodex(reportPrompt);
    } catch {
      return this.generateFallbackReport(results, analysis);
    }
  }

  private generateFallbackReport(results: { status: string }[], analysis: AnalysisResult): string {
    return `
# Visual Testing Report

## Summary
${analysis.summary}

## Test Results
- **Total Tests**: ${results.length}
- **Passed**: ${results.filter(r => r.status === 'passed').length}
- **Failed**: ${results.filter(r => r.status === 'failed').length}

## Classifications
- **Critical Issues**: ${analysis.classifications.critical.length}
- **Minor Issues**: ${analysis.classifications.minor.length}  
- **Cosmetic Issues**: ${analysis.classifications.cosmetic.length}

## Recommendations
${analysis.recommendations.map(rec => 
  `- **${rec.testName}** (${rec.priority}): ${rec.action}`
).join('\n')}

## Trends
${analysis.trends.map(trend => `- ${trend}`).join('\n')}
    `.trim();
  }
}