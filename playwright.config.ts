import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './test/browser',
  testMatch: '**/*.browser.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: 'list',
  outputDir: 'artifacts/browser',
  use: {
    baseURL: 'http://127.0.0.1:4174',
    viewport: { width: 390, height: 844 },
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  webServer: [
    {
      command: 'npm run preview --workspace mavis-catalog-web',
      url: 'http://127.0.0.1:4174/playground/',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run docs:preview -- --host 127.0.0.1 --port 4173',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: !process.env.CI,
    },
  ],
})
