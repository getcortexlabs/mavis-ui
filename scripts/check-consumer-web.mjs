import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium, webkit, expect } from '@playwright/test'

const source = process.argv[2] ?? 'tarballs'
if (!['tarballs', 'registry'].includes(source)) throw Error('Expected tarballs or registry')
const report = JSON.parse(readFileSync(`artifacts/release/consumers-${source}.json`, 'utf8'))
const cwd = join(report.directory, 'web')
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '4186',
    '--strictPort',
  ],
  { cwd, stdio: 'pipe' },
)
let output = ''
server.stdout.on('data', (data) => {
  output += data
})
server.stderr.on('data', (data) => {
  output += data
})
const results = []

try {
  let ready = false
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw Error(output)
    try {
      ready = (await fetch('http://127.0.0.1:4186/')).ok
    } catch {}
    if (ready) break
    await new Promise((done) => setTimeout(done, 100))
  }
  if (!ready) throw Error(`Consumer server failed to start: ${output}`)
  for (const [name, browserType] of Object.entries({ chromium, webkit })) {
    const browser = await browserType.launch()
    try {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
      const errors = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.goto('http://127.0.0.1:4186/')
      await expect(page.getByText('Installed Mavis', { exact: true })).toBeVisible()
      const save = page.getByRole('button', { name: 'Save', exact: true })
      await expect(save).toHaveCSS('background-color', 'rgb(184, 54, 112)')
      await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Consumer')
      await expect(page.getByText('Hello, Consumer', { exact: true })).toBeVisible()
      const slider = page.getByRole('slider', { name: 'Volume', exact: true })
      await slider.focus()
      await slider.press('ArrowRight')
      await expect(page.getByText('Volume: 31', { exact: true })).toBeVisible()
      await save.click()
      await expect(page.getByRole('button', { name: 'Loading…', exact: true })).toBeDisabled()
      await expect(page.getByText('Saved Consumer', { exact: true })).toBeVisible()
      await page.getByRole('button', { name: 'Details', exact: true }).click()
      await expect(page.getByText('Installed from a package', { exact: true })).toBeVisible()
      await page.getByRole('button', { name: 'Change theme', exact: true }).click()
      await expect(save).toHaveCSS('background-color', 'rgb(242, 169, 200)')
      await expect(
        page.getByText('Installed from a package', { exact: true }).locator('..'),
      ).toHaveCSS('opacity', '1')
      await page.screenshot({
        path: resolve(`artifacts/release/${source}-${name}.png`),
        fullPage: true,
      })
      await page.getByRole('button', { name: 'Details', exact: true }).click()
      await expect(page.getByText('Installed from a package', { exact: true })).toBeHidden()
      expect(errors).toEqual([])
      results.push({ browser: name, passed: true, errors })
    } finally {
      await browser.close()
    }
  }
  writeFileSync(`artifacts/release/browser-${source}.json`, `${JSON.stringify(results, null, 2)}\n`)
  console.log(JSON.stringify(results, null, 2))
} finally {
  server.kill()
}
