import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './test/browser',
  testMatch: [
    'expressive.browser.ts',
    'combobox.browser.ts',
    'date.browser.ts',
    'feedback.browser.ts',
    'chip-empty-state.browser.ts',
    'avatar-badge.browser.ts',
    'files.browser.ts',
    'dialog.browser.ts',
    'toast.browser.ts',
    'discovery.browser.ts',
    'wayfinding.browser.ts',
    'navigation-collections.browser.ts',
    'tabs.browser.ts',
    'disclosure.browser.ts',
    'configurator.browser.ts',
    'workflows.browser.ts',
  ],
  workers: 2,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'artifacts/expressive/browser.json' }]],
  outputDir: 'artifacts/expressive/browser',
  use: {
    baseURL: 'http://127.0.0.1:4183',
    viewport: { width: 390, height: 844 },
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
})
