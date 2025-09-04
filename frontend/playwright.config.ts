import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/visual',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 2 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['line']
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.FRONTEND_URL || 'http://localhost:3001',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshot on failure for debugging */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers and viewports */
  projects: [
    {
      name: 'chromium-desktop-1920',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    {
      name: 'chromium-desktop-1366',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 },
      },
    },

    {
      name: 'firefox-desktop',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    {
      name: 'webkit-desktop',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    /* Test against tablet viewports. */
    {
      name: 'tablet-768x1024',
      use: {
        ...devices['iPad Pro'],
        viewport: { width: 768, height: 1024 },
      },
    },

    {
      name: 'tablet-1024x768',
      use: {
        ...devices['iPad Pro landscape'],
        viewport: { width: 1024, height: 768 },
      },
    },

    /* Test against mobile viewports. */
    {
      name: 'mobile-chrome-375',
      use: { 
        ...devices['iPhone SE'],
        viewport: { width: 375, height: 667 },
      },
    },

    {
      name: 'mobile-chrome-414',
      use: { 
        ...devices['iPhone 12 Pro Max'],
        viewport: { width: 414, height: 896 },
      },
    },

    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 },
      },
    },

    /* Test against branded testing project. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3001',
  //   reuseExistingServer: true,
  //   timeout: 120 * 1000,
  // },

  /* Global test timeout */
  timeout: 30 * 1000,

  /* Global setup timeout */
  globalTimeout: 60 * 1000 * 5, // 5 minutes

  /* Expect timeout */
  expect: {
    /* Maximum time expect() should wait for the condition to be met */
    timeout: 5000,
    /* Threshold for screenshot comparison */
    toHaveScreenshot: { threshold: 0.2 },
    /* Configure toMatchSnapshot for visual diffs */
    toMatchSnapshot: { threshold: 0.2 },
  },
});