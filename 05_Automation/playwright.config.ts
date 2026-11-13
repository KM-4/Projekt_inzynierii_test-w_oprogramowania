import { defineConfig } from 'playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 45000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  outputDir: 'reports/artifacts',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['json', { outputFile: 'reports/results.json' }],
    ['junit', { outputFile: 'reports/junit.xml' }],
    ['./helpers/result-reporter.ts'],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://automationintesting.online',
    actionTimeout: 10000,
    navigationTimeout: 30000,
    viewport: { width: 1440, height: 1000 },
    timezoneId: process.env.TEST_TIMEZONE || 'Europe/Warsaw',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'api', testMatch: 'api.spec.ts', use: { trace: 'off' } },
    { name: 'ui-chrome', testMatch: 'ui.spec.ts', use: { channel: process.env.BROWSER_CHANNEL || 'chrome', trace: 'retain-on-failure' } },
  ],
});
