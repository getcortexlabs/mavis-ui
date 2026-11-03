import { defineConfig } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export function sharingConfig(preset: string) {
  const report = JSON.parse(
    readFileSync(resolve(`artifacts/creator/${preset}-directory/result.json`), 'utf8'),
  )
  const web =
    report.web ?? resolve(report.directory, report.config.target === 'both' ? 'apps/web' : '.')
  const nuxt = report.config.web === 'nuxt'
  // Paths are passed as arguments using shell quoting, including temporary directories with spaces.
  const quote = (value: string) => `'${value.replaceAll("'", "'\\''")}'`
  const node = quote(process.execPath)
  return defineConfig({
    testDir: './test/sharing',
    testMatch: '*.browser.ts',
    workers: 2,
    retries: 0,
    reporter: 'list',
    outputDir: `artifacts/sharing/${preset}`,
    projects: ['chromium', 'webkit'].flatMap((browser) =>
      (nuxt ? ['ssr', 'ssg'] : ['spa']).map((mode) => ({
        name: `${browser}-${mode}`,
        metadata: { mode },
        use: {
          browserName: browser as 'chromium' | 'webkit',
          baseURL: `http://127.0.0.1:${mode === 'ssg' ? 4204 : 4203}`,
          viewport: { width: 390, height: 844 },
          trace: 'retain-on-failure' as const,
        },
      })),
    ),
    webServer: nuxt
      ? [
          {
            command: `${node} ${quote(resolve(web, '.output-ssr/server/index.mjs'))}`,
            env: { NITRO_HOST: '127.0.0.1', NITRO_PORT: '4203' },
            url: 'http://127.0.0.1:4203',
          },
          {
            command: `${node} scripts/serve-sharing-static.mjs ${quote(resolve(web, '.output/public'))} 4204`,
            url: 'http://127.0.0.1:4204',
          },
        ]
      : {
          command: `${node} ${quote(resolve('node_modules/vite/bin/vite.js'))} preview --host 127.0.0.1 --port 4203 --strictPort`,
          cwd: web,
          url: 'http://127.0.0.1:4203',
        },
  })
}
