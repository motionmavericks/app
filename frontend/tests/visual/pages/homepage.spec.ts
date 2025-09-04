import { test, expect, Page } from '@playwright/test';
import { VisualTestBase } from '../utils/visual-test-base';
import { VisualTestHelper } from '../utils/test-helpers';

class HomepageVisualTest extends VisualTestBase {
  async run(): Promise<void> {
    // Required abstract method implementation
    await this.testHomepageLayout();
  }

  async setupTest(page: Page, testName: string): Promise<void> {
    this.page = page;
    this.testName = testName;
    await this.setup();
  }

  async waitForElement(selector: string, timeout: number): Promise<void> {
    await this.page.waitForSelector(selector, { timeout });
  }

  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async waitForStableDOM(): Promise<void> {
    await VisualTestHelper.waitForStableDOM(this.page);
  }

  async compareVisual(testId: string): Promise<void> {
    await this.takeScreenshot(testId);
  }

  async enableLightMode(): Promise<void> {
    await this.page.evaluate(() => {
      document.documentElement.classList.remove('dark');
    });
  }

  async enableDarkMode(): Promise<void> {
    await this.page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
  }

  async testHomepageLayout(): Promise<void> {
    // Navigate to homepage
    await this.page.goto('/');
    
    // Wait for page to load completely
    await this.waitForElement('main', 10000);
    await this.waitForNetworkIdle();
    
    // Capture full page screenshot
    await this.compareVisual('homepage-full-page');
  }

  async testHomepageResponsive(): Promise<void> {
    await this.page.goto('/');
    await this.waitForElement('main', 10000);
    await this.waitForNetworkIdle();
    
    // Test different viewport sizes
    const viewports = [
      { width: 375, height: 667, name: 'mobile-portrait' },
      { width: 414, height: 896, name: 'mobile-large' },
      { width: 768, height: 1024, name: 'tablet-portrait' },
      { width: 1024, height: 768, name: 'tablet-landscape' },
      { width: 1366, height: 768, name: 'desktop-small' },
      { width: 1920, height: 1080, name: 'desktop-large' }
    ];

    for (const viewport of viewports) {
      await this.page.setViewportSize(viewport);
      await this.waitForStableDOM();
      await this.compareVisual(`homepage-${viewport.name}`);
    }
  }

  async testThemeToggle(): Promise<void> {
    await this.page.goto('/');
    await this.waitForElement('main', 10000);
    
    // Test light mode (default)
    await this.enableLightMode();
    await this.waitForStableDOM();
    await this.compareVisual('homepage-light-mode');
    
    // Test dark mode
    await this.enableDarkMode();
    await this.waitForStableDOM();
    await this.compareVisual('homepage-dark-mode');
  }
}

test.describe('Homepage Visual Tests', () => {
  test('homepage layout and structure', async ({ page }) => {
    const visualTest = new HomepageVisualTest();
    await visualTest.setupTest(page, 'homepage-layout');
    await visualTest.testHomepageLayout();
  });

  test('homepage responsive design', async ({ page }) => {
    const visualTest = new HomepageVisualTest();
    await visualTest.setupTest(page, 'homepage-responsive');
    await visualTest.testHomepageResponsive();
  });

  test('homepage theme variations', async ({ page }) => {
    const visualTest = new HomepageVisualTest();
    await visualTest.setupTest(page, 'homepage-themes');
    await visualTest.testThemeToggle();
  });
});