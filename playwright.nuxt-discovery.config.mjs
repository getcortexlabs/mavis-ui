import { defineConfig } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
const { directory } = JSON.parse(readFileSync('artifacts/ssr/nuxt.json', 'utf8'))
const quote = (value) => "'" + value.replaceAll("'", "'\\''") + "'"
export default defineConfig({
  testDir: './test/ssr',
  testMatch: 'discovery.browser.mjs',
  workers: 1,
  reporter: 'list',
  outputDir: 'artifacts/ssr/discovery-browser',
  webServer: {
    command: `${quote(process.execPath)} ${quote(join(directory, '.output/server/index.mjs'))}`,
    url: 'http://127.0.0.1:4198/discovery/',
    env: { HOST: '127.0.0.1', PORT: '4198' },
  },
})
