import { checkNuxtCollections } from './check-nuxt-collections.mjs'
import { checkNuxtPlatforms } from './check-nuxt-platforms.mjs'
import { checkNuxtConfigurator } from './check-nuxt-configurator.mjs'
import { checkNuxtVisuals } from './check-nuxt-visuals.mjs'
import { checkNuxtOrchestration } from './check-nuxt-orchestration.mjs'
import { checkNuxtWorkflows } from './check-nuxt-workflows.mjs'
import { checkNuxtMotion } from './check-nuxt-motion.mjs'
import { checkNuxtDates } from './check-nuxt-dates.mjs'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createServer } from 'node:http'
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve, extname, sep } from 'node:path'
import { chromium, webkit, expect } from '@playwright/test'

const { directory } = JSON.parse(readFileSync('artifacts/ssr/nuxt.json', 'utf8'))
execFileSync('npm', ['run', 'generate'], {
  cwd: directory,
  stdio: 'inherit',
  env: { ...process.env, NUXT_TELEMETRY_DISABLED: '1' },
})
const root = resolve(directory, '.output/public')
function inspect(folder) {
  for (const name of readdirSync(folder)) {
    const file = join(folder, name)
    if (statSync(file).isDirectory()) inspect(file)
    else if (/\.(?:js|json|html)$/.test(file)) {
      const content = readFileSync(file, 'utf8')
      assert(!content.includes('mavis-server-only-fixture'), `Private configuration in ${file}`)
      assert(!/@nativescript\/core|nativescript-vue/.test(content), `Native renderer in ${file}`)
    }
  }
}
inspect(root)
const html = readFileSync(join(root, 'static/index.html'), 'utf8')
assert(html.includes('Studio’s notebook'))
assert(html.includes('value="Studio"'))
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
}
const server = createServer((request, response) => {
  try {
    let file = resolve(
      root,
      `.${decodeURIComponent(new URL(request.url, 'http://localhost').pathname)}`,
    )
    if (!file.startsWith(root + sep)) throw new Error('Invalid path')
    if (statSync(file).isDirectory()) file = join(file, 'index.html')
    response.setHeader('content-type', types[extname(file)] ?? 'application/octet-stream')
    response.end(readFileSync(file))
  } catch {
    response.writeHead(404)
    response.end('Not found')
  }
})
await new Promise((resolve) => server.listen(4199, '127.0.0.1', resolve))
const results = []
try {
  for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
    const browser = await launcher.launch()
    try {
      const context = await browser.newContext({ colorScheme: 'dark' })
      await context.addCookies([
        { name: 'appearance', value: 'dark', url: 'http://127.0.0.1:4199' },
      ])
      const page = await context.newPage()
      const errors = [],
        requests = []
      page.on('pageerror', (e) => errors.push(e.message))
      page.on('console', (m) => {
        if (/hydration|\[Vue warn\]/i.test(m.text())) errors.push(m.text())
      })
      page.on('request', (r) => {
        if (new URL(r.url()).pathname.startsWith('/api/')) requests.push(r.url())
      })
      await page.goto('http://127.0.0.1:4199/static/')
      await page.locator('[data-appearance="dark"] form[data-hydrated="true"]').waitFor()
      await page.getByLabel('Name', { exact: true }).fill('Static reader')
      await page.getByRole('button', { name: 'Save preferences', exact: true }).click()
      await expect(page.locator('[data-save-count]')).toHaveAttribute('data-save-count', '1')
      await page.getByRole('button', { name: 'Preview', exact: true }).click()
      await page.getByRole('dialog', { name: 'Your next chapter' }).waitFor()
      assert.deepEqual(requests, [], 'Static route must not depend on a live API')
      assert.deepEqual(errors, [], `${engine}: static hydration`)
      results.push({
        engine,
        staticHTML: true,
        hydrated: true,
        apiRequests: 0,
        privateConfigAbsent: true,
      })
    } finally {
      await browser.close()
    }
  }
  results.push(...(await checkNuxtDates('http://127.0.0.1:4199', 'ssg')))
  results.push(...(await checkNuxtWorkflows('http://127.0.0.1:4199', 'ssg')))
  results.push(...(await checkNuxtCollections('http://127.0.0.1:4199', 'ssg')))
  results.push(...(await checkNuxtConfigurator('http://127.0.0.1:4199', 'ssg')))
  results.push(...(await checkNuxtOrchestration('http://127.0.0.1:4199', 'ssg')))
  results.push(...(await checkNuxtVisuals('http://127.0.0.1:4199', 'ssg')))
  results.push(...(await checkNuxtPlatforms('http://127.0.0.1:4199', 'ssg')))
  results.push(...(await checkNuxtMotion('http://127.0.0.1:4199', 'ssg')))
  console.log(JSON.stringify(results, null, 2))
} finally {
  await new Promise((resolve) => server.close(resolve))
  writeFileSync('artifacts/ssr/nuxt-static.json', JSON.stringify(results, null, 2))
}
