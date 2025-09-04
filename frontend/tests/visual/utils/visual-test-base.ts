import { Page } from '@playwright/test';
import { VisualTestHelper, VisualTestOptions } from './test-helpers';

export interface TestConfig {
  threshold: number;
  fullPage: boolean;
  animations: 'allow' | 'disabled';
  viewport: {
    width: number;
    height: number;
  };
  stabilizeDOM: boolean;
  hideVolatileElements: boolean;
}

export abstract class VisualTestBase {
  protected page!: Page;
  protected testName!: string;
  protected config!: TestConfig;

  protected defaultConfig: TestConfig = {
    threshold: 0.2,
    fullPage: true,
    animations: 'disabled',
    viewport: { width: 1920, height: 1080 },
    stabilizeDOM: true,
    hideVolatileElements: true
  };

  constructor(page?: Page, testName?: string, config?: Partial<TestConfig>) {
    if (page) this.page = page;
    if (testName) this.testName = testName;
    this.config = { ...this.defaultConfig, ...config };
  }

  async setup(): Promise<void> {
    await VisualTestHelper.setViewport(this.page, 'desktop');
    await VisualTestHelper.mockApiResponses(this.page);
    
    if (this.config.hideVolatileElements) {
      await VisualTestHelper.hideVolatileElements(this.page);
    }
  }

  async takeScreenshot(testId: string, options?: VisualTestOptions): Promise<void> {
    const fullTestName = `${this.testName}-${testId}`;
    const testOptions = { ...this.config, ...options };
    
    await VisualTestHelper.compareVisuals(this.page, fullTestName, testOptions);
  }

  async prepareForTest(): Promise<void> {
    await VisualTestHelper.preparePageForVisualTest(this.page, this.config);
    
    if (this.config.stabilizeDOM) {
      await VisualTestHelper.waitForStableDOM(this.page);
    }
  }

  abstract run(): Promise<void>;
}