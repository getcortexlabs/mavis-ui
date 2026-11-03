import { checkNuxtConfigurator } from './check-nuxt-configurator.mjs'
import { checkNuxtVisuals } from './check-nuxt-visuals.mjs'
import { checkNuxtOrchestration } from './check-nuxt-orchestration.mjs'
import { checkNuxtWorkflows } from './check-nuxt-workflows.mjs'
import { checkNuxtMotion } from './check-nuxt-motion.mjs'
import { checkNuxtDates } from './check-nuxt-dates.mjs'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium, webkit, expect } from '@playwright/test'
import { mavis } from '@getcortexlabs/mavis-core'

const { directory } = JSON.parse(readFileSync('artifacts/ssr/nuxt.json', 'utf8'))
const origin = 'http://127.0.0.1:4198'
const server = spawn(process.execPath, ['.output/server/index.mjs'], {
  cwd: directory,
  env: { ...process.env, HOST: '127.0.0.1', PORT: '4198' },
  stdio: 'pipe',
})
let output = ''
server.stdout.on('data', (chunk) => {
  output += chunk
})
server.stderr.on('data', (chunk) => {
  output += chunk
})
const results = []
try {
  for (let attempt = 0; ; attempt++) {
    if (server.exitCode !== null) throw new Error(output)
    try {
      if ((await fetch(origin)).ok) break
    } catch {}
    if (attempt === 100) throw new Error('Nuxt server did not start')
    await delay(100)
  }
  const responses = await Promise.all(
    Array.from({ length: 8 }, async (_, index) => {
      const name = index % 2 ? 'Marina' : 'Rafa'
      const appearance = index % 2 ? 'dark' : 'light'
      const response = await fetch(`${origin}/?name=${name}`, {
        headers: { cookie: `appearance=${appearance}` },
      })
      assert.equal(response.status, 200)
      const html = await response.text()
      assert(html.includes(`${name}’s notebook`), 'Response must contain useful initial HTML')
      assert(html.includes(`data-appearance="${appearance}"`), 'Request theme')
      assert(html.includes(`value="${name}"`), 'Request input')
      assert(!html.includes('mavis-server-only-fixture'), 'Private configuration in HTTP response')
      return { name, appearance }
    }),
  )
  results.push({ test: 'concurrent server requests', passed: responses.length })
  assert.equal((await fetch(`${origin}/failure`)).status, 503)
  const abort = new AbortController()
  const pending = fetch(`${origin}/pending`, { signal: abort.signal }).catch((error) => {
    assert.equal(error.name, 'AbortError')
  })
  await delay(20)
  abort.abort()
  await pending
  await delay(120)
  const after = await (await fetch(origin, { headers: { cookie: 'appearance=light' } })).text()
  assert(after.includes('data-appearance="light"'))
  assert(!after.includes('Pending request only'))
  assert(!after.includes('This failed request'))
  results.push({ test: 'failed and abandoned request isolation', passed: true })
  for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
    const browser = await launcher.launch()
    try {
      const context = await browser.newContext({
        colorScheme: 'dark',
        viewport: { width: 1280, height: 960 },
      })
      context.setDefaultTimeout(15000)
      await context.addCookies([{ name: 'appearance', value: 'light', url: origin }])
      const page = await context.newPage()
      const errors = []
      const requests = []
      page.on('request', (request) => {
        if (new URL(request.url()).pathname === '/api/profile') requests.push(request.url())
      })
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('console', (message) => {
        if (/hydration|\[Vue warn\]/i.test(message.text())) errors.push(message.text())
      })
      await page.goto(origin)
      await page.locator('form[data-hydrated="true"]').waitFor()
      assert.deepEqual(requests, [], 'Hydration must reuse the Nuxt data payload')
      await page.getByLabel('Name', { exact: true }).fill('Ada')
      await page.getByRole('button', { name: 'Save preferences', exact: true }).click()
      await page.locator('[data-save-count="1"]').waitFor()
      await page.getByRole('button', { name: 'Preview', exact: true }).click()
      await page.locator('dialog[open]').waitFor()
      await page.getByLabel('Preview notes', { exact: true }).fill('Shared draft')
      await page.getByRole('button', { name: 'Back to notebook', exact: true }).click()
      await page.locator('dialog[open]').waitFor({ state: 'hidden' })
      assert.equal(await page.getByLabel('Notes', { exact: true }).inputValue(), 'Shared draft')
      await page.locator('.m-select-trigger').click()
      await page.getByRole('option', { name: 'Português', exact: true }).click()
      await expect(page.locator('.m-select-trigger')).toContainText('Português')
      await page.getByRole('tab', { name: 'Rituals', exact: true }).click()
      await page.getByText('Start with five quiet minutes.', { exact: true }).waitFor()
      await page.getByRole('button', { name: 'Who can see my notebook?', exact: true }).click()
      await page.getByText('Your notebook belongs to you.', { exact: true }).waitFor()
      await page.getByRole('button', { name: 'Discard changes', exact: true }).click()
      await page.getByRole('dialog', { name: 'Discard these changes?' }).waitFor()
      await page.getByRole('button', { name: 'Cancel', exact: true }).click()
      await page.getByRole('button', { name: 'A small reminder', exact: true }).click()
      await page.getByText('You do not have to do everything today.', { exact: true }).waitFor()
      const motion = page.getByRole('button', { name: 'Take a breath', exact: true })
      await motion.hover()
      await page.mouse.down()
      await expect
        .poll(() =>
          motion.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).a),
        )
        .toBeCloseTo(mavis.motion.pressScale, 2)
      await page.emulateMedia({ reducedMotion: 'reduce' })
      // Reduced motion settles the current press endpoint; release restores the base.
      await expect.poll(() => motion.evaluate((el) => el.getAnimations().length)).toBe(0)
      await page.mouse.up()
      await expect
        .poll(() =>
          motion.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).a),
        )
        .toBeCloseTo(1, 2)
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await expect.poll(() => page.evaluate(() => window.__mavisProbe.mounts)).toBe(1)
      await page.getByRole('button', { name: 'Notify me', exact: true }).click()
      await page.getByText('Your notebook is ready.', { exact: true }).waitFor()
      await page.evaluate(() => {
        window.__mavisPrevious = window.__mavisProbe
      })
      await page.getByRole('link', { name: 'Your sessions', exact: true }).click()
      await page.getByRole('heading', { name: 'A little room to focus.' }).waitFor()
      await expect
        .poll(() =>
          page.evaluate(() => ({
            available: window.__mavisPrevious.surface.available,
            scrolling: window.__mavisPrevious.scroll.available,
            valueDisposed: window.__mavisPrevious.value.disposed,
            linkDisposed: window.__mavisPrevious.link.disposed,
            releases: window.__mavisPrevious.releases,
          })),
        )
        .toEqual({
          available: false,
          scrolling: false,
          valueDisposed: true,
          linkDisposed: true,
          releases: 1,
        })
      await page.getByText('Your notebook is ready.', { exact: true }).waitFor()
      await page.goBack()
      await page.locator('form[data-hydrated="true"]').waitFor()
      await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Rafa')
      assert.equal(await page.evaluate(() => window.__mavisProbe.mounts), 1)
      assert.deepEqual(errors, [], `${engine}: hydration/runtime errors`)
      results.push({ engine, test: 'forms, overlay and navigation', passed: true })
      await page.getByRole('button', { name: 'Dismiss notification', exact: true }).click()
      await page.getByText('Your notebook is ready.', { exact: true }).waitFor({ state: 'hidden' })
      await page.screenshot({
        path: `artifacts/ssr/notebook-${engine}-desktop.png`,
        fullPage: true,
      })
      await page.setViewportSize({ width: 390, height: 844 })
      await page.screenshot({ path: `artifacts/ssr/notebook-${engine}-mobile.png`, fullPage: true })
      await page.close()

      const delayed = await context.newPage()
      const delayedErrors = []
      delayed.on('pageerror', (e) => delayedErrors.push(e.message))
      delayed.on('console', (m) => {
        if (/hydration|\[Vue warn\]/i.test(m.text())) delayedErrors.push(m.text())
      })
      let release
      const ready = new Promise((resolve) => {
        release = resolve
      })
      await delayed.route('**/_nuxt/**', async (route) => {
        if (new URL(route.request().url()).pathname.endsWith('.js')) await ready
        await route.continue()
      })
      let name
      try {
        await delayed.goto(origin, { waitUntil: 'commit' })
        name = delayed.getByLabel('Name', { exact: true })
        await name.waitFor()
        await delayed.evaluate(() => {
          window.__mavisInput = document.querySelector('input[name="name"]')
          window.__mavisIds = [...document.querySelectorAll('[id]')].map((el) => el.id)
        })
        await name.fill('Before hydration')
        await delayed.getByLabel('Notes', { exact: true }).fill('A typed draft')
        await delayed
          .getByRole('checkbox', { name: 'Send me the weekly note', exact: true })
          .check()
        await delayed.getByRole('radio', { name: 'Quiet', exact: true }).check()
        const slider = delayed.getByRole('slider', { name: 'Session length', exact: true })
        await slider.focus()
        await slider.press('ArrowRight')
        await name.focus()
        await name.evaluate((el) => el.setSelectionRange(3, 9))
      } finally {
        release()
      }
      await delayed.locator('form[data-hydrated="true"]').waitFor()
      assert.equal(await name.inputValue(), 'Before hydration', `${engine}: pre-hydration text`)
      assert.equal(await delayed.getByLabel('Notes', { exact: true }).inputValue(), 'A typed draft')
      assert(
        await delayed
          .getByRole('checkbox', { name: 'Send me the weekly note', exact: true })
          .isChecked(),
      )
      assert(await delayed.getByRole('radio', { name: 'Quiet', exact: true }).isChecked())
      assert.equal(
        await delayed.locator('[data-testid="model"]').textContent(),
        'Before hydration / A typed draft / true / quiet / 35',
      )
      assert(
        await name.evaluate((el) => el === window.__mavisInput),
        'Hydration must retain the editor DOM',
      )
      assert.deepEqual(await name.evaluate((el) => [el.selectionStart, el.selectionEnd]), [3, 9])
      assert.deepEqual(
        await delayed.evaluate(() => [...document.querySelectorAll('[id]')].map((el) => el.id)),
        await delayed.evaluate(() => window.__mavisIds),
      )
      await delayed.getByRole('button', { name: 'Reset name', exact: true }).click()
      assert.equal(await name.inputValue(), 'Updated by parent')
      assert.deepEqual(delayedErrors, [], `${engine}: delayed hydration errors`)
      results.push({ engine, test: 'pre-hydration edits and identity', passed: true })
      await delayed.close()

      const initialHTML = await (await fetch(`${origin}/?preview=1`)).text()
      assert(
        !/<dialog[^>]*\sopen(?:\s|>)/.test(initialHTML),
        'Server must defer modal presentation',
      )
      const initialOverlay = await context.newPage()
      const overlayErrors = []
      initialOverlay.on('pageerror', (e) => overlayErrors.push(e.message))
      initialOverlay.on('console', (m) => {
        if (/hydration|\[Vue warn\]/i.test(m.text())) overlayErrors.push(m.text())
      })
      await initialOverlay.goto(`${origin}/?preview=1`)
      const initialDialog = initialOverlay.getByRole('dialog', { name: 'Your next chapter' })
      await initialDialog.waitFor()
      await expect
        .poll(() => initialDialog.evaluate((el) => el.contains(document.activeElement)))
        .toBe(true)
      await initialOverlay.getByRole('button', { name: 'Back to notebook', exact: true }).click()
      await expect(initialDialog).not.toBeVisible()
      assert.deepEqual(overlayErrors, [], `${engine}: initial overlay`)
      results.push({ engine, test: 'deferred initial overlay and focus', passed: true })
      await initialOverlay.close()

      const controls = await context.newPage()
      const controlErrors = []
      controls.on('pageerror', (e) => controlErrors.push(e.message))
      controls.on('console', (m) => {
        if (/hydration|\[Vue warn\]/i.test(m.text())) controlErrors.push(m.text())
      })
      let hydrateControls
      const controlGate = new Promise((resolve) => {
        hydrateControls = resolve
      })
      await controls.route('**/_nuxt/**', async (route) => {
        if (new URL(route.request().url()).pathname.endsWith('.js')) await controlGate
        await route.continue()
      })
      try {
        await controls.goto(`${origin}/controls`, { waitUntil: 'commit' })
        await controls.getByLabel('Owned text', { exact: true }).fill('User edit')
        await controls.getByRole('checkbox', { name: 'Owned checkbox' }).focus()
        await controls.getByRole('checkbox', { name: 'Owned checkbox' }).press('Space')
        await controls.getByRole('radio', { name: 'Zero', exact: true }).focus()
        await controls.getByRole('radio', { name: 'Zero', exact: true }).press('Space')
        await controls.getByRole('slider', { name: 'Owned range' }).press('ArrowRight')
        await expect(controls.getByLabel('Read only', { exact: true })).not.toBeEditable()
        await expect(controls.getByLabel('Disabled', { exact: true })).toBeDisabled()
      } finally {
        hydrateControls()
      }
      await controls.locator('[data-ready="true"]').waitFor()
      await expect(controls.getByLabel('Owned text', { exact: true })).toHaveValue('Parent')
      await expect(controls.getByRole('checkbox', { name: 'Owned checkbox' })).not.toBeChecked()
      await expect(controls.getByRole('radio', { name: 'Zero', exact: true })).not.toBeChecked()
      await expect(controls.getByRole('slider', { name: 'Owned range' })).toHaveValue('5')
      await expect(controls.locator('[data-testid="attempts"]')).toHaveText('4')
      const composition = controls.getByLabel('Composition', { exact: true })
      await composition.focus()
      await composition.dispatchEvent('compositionstart', { data: '' })
      await composition.evaluate((el) => {
        el.value = '日本'
        el.dispatchEvent(
          new InputEvent('input', { bubbles: true, data: '日本', isComposing: true }),
        )
        el.dispatchEvent(
          new KeyboardEvent('keydown', { bubbles: true, key: 'Enter', isComposing: true }),
        )
      })
      await expect(controls.locator('[data-testid="submits"]')).toHaveText('0')
      await composition.dispatchEvent('compositionend', { data: '日本' })
      await composition.press('Enter')
      await expect(controls.locator('[data-testid="composition"]')).toHaveText('日本')
      await expect(controls.locator('[data-testid="submits"]')).toHaveText('1')
      assert.deepEqual(controlErrors, [], `${engine}: controlled and IME errors`)
      results.push({
        engine,
        test: 'controlled rejection, nullable numeric choices and composition events',
        passed: true,
      })
      await controls.close()

      const components = await context.newPage()
      const componentErrors = []
      components.on('pageerror', (e) => componentErrors.push(e.message))
      components.on('console', (m) => {
        if (/hydration|\[Vue warn\]/i.test(m.text())) componentErrors.push(m.text())
      })
      await components.goto(`${origin}/components`)
      await components.locator('[data-ready="true"]').waitFor()
      await components.getByRole('switch', { name: 'Daily reminders' }).click()
      await expect(components.getByRole('switch', { name: 'Daily reminders' })).toHaveAttribute(
        'aria-checked',
        'false',
      )
      await components.getByRole('button', { name: 'Creative work', exact: true }).click()
      await expect(
        components.getByRole('button', { name: 'Creative work', exact: true }),
      ).toHaveAttribute('aria-pressed', 'true')
      await components.getByRole('radio', { name: 'Month', exact: true }).click()
      await expect(components.getByRole('radio', { name: 'Month', exact: true })).toHaveAttribute(
        'aria-checked',
        'true',
      )
      assert.deepEqual(componentErrors, [], `${engine}: component hydration errors`)
      results.push({
        engine,
        test: 'remaining component initial HTML and client controls',
        passed: true,
      })
      await components.close()

      await context.clearCookies()
      const system = await context.newPage()
      const themeErrors = []
      system.on('console', (m) => {
        if (/hydration|\[Vue warn\]/i.test(m.text())) themeErrors.push(m.text())
      })
      await system.goto(origin)
      await system.locator('[data-appearance="dark"] form[data-hydrated="true"]').waitFor()
      const scopedColor = await system
        .locator('[data-testid="theme-scope"]')
        .evaluate((el) => getComputedStyle(el).backgroundColor)
      await system.emulateMedia({ colorScheme: 'light' })
      await system.locator('[data-appearance="light"] form[data-hydrated="true"]').waitFor()
      assert.equal(
        await system
          .locator('[data-testid="theme-scope"]')
          .evaluate((el) => getComputedStyle(el).backgroundColor),
        scopedColor,
      )
      assert.deepEqual(themeErrors, [], `${engine}: system theme hydration`)
      results.push({ engine, test: 'system appearance after hydration', passed: true })
      await context.close()
    } finally {
      await browser.close()
    }
  }
  results.push(...(await checkNuxtDates(origin, 'ssr')))
  results.push(...(await checkNuxtWorkflows(origin, 'ssr')))
  results.push(...(await checkNuxtConfigurator(origin, 'ssr')))
  results.push(...(await checkNuxtOrchestration(origin, 'ssr')))
  results.push(...(await checkNuxtVisuals(origin, 'ssr')))
  results.push(...(await checkNuxtMotion(origin, 'ssr')))
  console.log(JSON.stringify(results, null, 2))
} finally {
  server.kill('SIGTERM')
  writeFileSync('artifacts/ssr/nuxt-server.log', output)
  writeFileSync('artifacts/ssr/nuxt-browser.json', JSON.stringify(results, null, 2))
}
