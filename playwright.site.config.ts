import { defineConfig } from '@playwright/test'

// The same smoke test also runs in the PR browser suite. Deploy never reruns the
// whole library suite or relies on assertions hidden inside workflow YAML.
export default defineConfig({
  testDir: './test/browser',
  testMatch: 'docs-smoke.browser.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  reporter: 'list',
  outputDir: 'artifacts/site-review',
  use: { browserName: 'chromium', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run docs:preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
})
