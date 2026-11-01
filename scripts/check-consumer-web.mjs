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
      await page.getByRole('radio', { name: 'Daily', exact: true }).click()
      await expect(page.getByRole('radio', { name: 'Daily', exact: true })).toHaveAttribute('aria-checked', 'true')
      await page.getByRole('button', { name: 'Package help', exact: true }).click()
      await expect(page.getByText('Answer help', { exact: true })).toBeVisible()
      await page.getByRole('button', { name: 'Package help', exact: true }).click()
      await expect(page.getByText('Answer help', { exact: true })).toBeHidden()
      const topic = page.getByRole('button', { name: 'Package topic', exact: true })
      await topic.click()
      await expect(topic).toHaveAttribute('aria-pressed', 'true')
      await page.getByRole('button', { name: 'Remove installed tag', exact: true }).click()
      await expect(page.getByRole('heading', { name: 'No installed tags', exact: true })).toBeVisible()
      await page.getByRole('button', { name: 'Continue without tags', exact: true }).click()
      await expect(page.getByText('Tag recovery complete', { exact: true })).toBeVisible()
      await expect(topic).toHaveAttribute('aria-pressed', 'true')
      const save = page.getByRole('button', { name: 'Save', exact: true })
      await expect(save).toHaveCSS('background-color', 'rgb(184, 54, 112)')
      await page.getByRole('button', { name: 'Clear installed name', exact: true }).click()
      await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue('')
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
      await page.goto('http://127.0.0.1:4186/#forms')
      await page.reload()
      const email = page.getByLabel('Form email', { exact: true })
      const password = page.getByLabel('Form password', { exact: true })
      await password.focus()
      await password.evaluate((el) => el.setSelectionRange(2, 5))
      await page.getByRole('button', { name: 'Show form password', exact: true }).click()
      await expect(password).toBeFocused()
      await expect(password).toHaveAttribute('type', 'text')
      expect(await password.evaluate((el) => [el.selectionStart, el.selectionEnd])).toEqual([2, 5])
      const formState = () => page.locator('#form-state').evaluate((el) => JSON.parse(el.textContent))
      await expect(email).toHaveAttribute('name', 'email')
      await expect(email).toHaveAttribute('autocomplete', 'email')
      await expect(email).toHaveAttribute('required', '')
      await page.locator('#form-save').click()
      expect(await formState()).toMatchObject({ submits: 0, invalid: 1 })
      await email.fill('installed@example.com')
      await page.locator('#form-save').click()
      await email.press('Enter')
      expect(await formState()).toMatchObject({ submits: 2, data: { email: 'installed@example.com', bio: 'Initial bio', intent: 'save' } })
      await page.getByRole('button', { name: 'Toggle component submit' }).click()
      await email.press('Enter')
      expect(await formState()).toMatchObject({ submits: 2, actions: 1 })
      await page.getByRole('button', { name: 'Toggle form loading' }).click()
      await page.locator('#form-save').evaluate((el) => el.click())
      expect(await formState()).toMatchObject({ submits: 2 })
      await page.getByRole('button', { name: 'Toggle form loading' }).click()
      await page.locator('#form-reset').click()
      await expect(email).toHaveValue('')
      expect(await formState()).toMatchObject({ email: '', bio: 'Initial bio', resets: 1 })
      await page.getByRole('button', { name: 'Focus form email' }).click()
      await expect(email).toBeFocused()
      await page.getByRole('button', { name: 'Blur form email' }).click()
      await expect(email).not.toBeFocused()
      await page.getByRole('button', { name: 'Toggle editor disabled' }).click()
      await page.getByRole('button', { name: 'Focus form email' }).click()
      await expect(email).not.toBeFocused()
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
