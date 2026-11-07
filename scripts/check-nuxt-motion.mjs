import assert from 'node:assert/strict'
import { chromium, webkit, expect } from '@playwright/test'

export async function checkNuxtMotion(origin, mode) {
  const route = mode === 'ssg' ? '/motion-static/' : '/motion/'
  const html = await (await fetch(`${origin}${route}`)).text()
  for (const text of ['Stay for the light.', 'A softer kind of night.', 'The doors open.'])
    assert(html.includes(text), `${mode}: readable initial motion content`)
  assert(!html.includes('motionregion="[object Object]"'), 'No runtime identities in SSR attributes')
  const results = []
  for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
    const browser = await launcher.launch()
    try {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
      const errors = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('console', (message) => {
        if (/hydration/i.test(message.text())) errors.push(message.text())
      })
      await page.route('**/images/mavis.webp', (request) => request.fulfill({ path: 'docs/public/images/mavis.webp', contentType: 'image/webp' }))
      await page.goto(`${origin}${route}`)
      const edition = page.locator('#afterglow-edition')
      await expect(edition).toBeVisible()
      for (let index = 0; index < 2; index++) {
        await page.getByRole('button', { name: 'Explore the edition', exact: true }).click()
        await expect(edition.getByText('An open studio.', { exact: false })).toBeVisible()
        await page.getByRole('button', { name: 'Back to the edition', exact: true }).click()
      }
      await page.getByRole('button', { name: 'Plan your evening', exact: true }).click()
      await page.getByRole('textbox', { name: 'A note for the host' }).fill('Nuxt keeps the input')
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).not.toBeVisible()
      await page.getByRole('button', { name: /Your arrival/ }).click()
      await page.getByRole('option', { name: 'After hours · 20:30' }).click()
      await expect(page.getByRole('dialog')).not.toBeVisible()
      if (mode === 'ssr') {
        await page.getByRole('button', { name: 'Read snapshot', exact: true }).click()
        let state = JSON.parse(await page.locator('#afterglow-snapshot').textContent())
        assert.equal(state.resources.pointerFollowers, 1)
        // Jolt RC.12.1 owns x/y/presence inputs and two spring outputs; the app owns scale.
        assert.equal(state.resources.values, 6)
        await page.getByRole('button', { name: 'Deactivate scene', exact: true }).click()
        await page.getByRole('button', { name: 'Activate scene', exact: true }).click()
        await page.getByRole('button', { name: 'Read snapshot', exact: true }).click()
        state = JSON.parse(await page.locator('#afterglow-snapshot').textContent())
        assert.equal(state.resources.pointerFollowers, 1)
        assert.equal(state.resources.values, 6)
        await page.getByRole('link', { name: 'Leave motion' }).click()
        await expect(page.locator('#afterglow-edition')).toHaveCount(0)
        await page.goBack()
        await expect(page.locator('#afterglow-edition')).toBeVisible()
      }
      assert.deepEqual(errors, [], `${engine} ${mode}: motion hydration and lifecycle`)
      results.push({ engine, mode, test: 'motion regions, shared identities, top-layer overlays and lifecycle', passed: true })
    } finally { await browser.close() }
  }
  return results
}
