import assert from 'node:assert/strict'
import { chromium, webkit, expect } from '@playwright/test'

export async function checkNuxtMotion(origin, mode) {
  const route = mode === 'ssg' ? '/motion-static/' : '/motion/'
  const html = await (await fetch(`${origin}${route}`)).text()
  for (const text of ['Stay for the light.', 'A softer kind of night.', 'The doors open.'])
    assert(html.includes(text), `${mode}: readable initial motion content`)
  assert(
    !html.includes('motionregion="[object Object]"'),
    'No runtime identities in SSR attributes',
  )
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
      await page.route('**/images/mavis.webp', (request) =>
        request.fulfill({ path: 'docs/public/images/mavis.webp', contentType: 'image/webp' }),
      )
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
        // Jolt owns x/y/presence inputs and two spring outputs; the app owns scale and the
        // lean it maps from presence.
        assert.equal(state.resources.values, 7)
        // After hydration the input exists and rests: no pointer has entered the region.
        const pointer = JSON.parse(await page.locator('#afterglow-pointer').textContent())
        assert.deepEqual(
          {
            available: pointer.available,
            execution: pointer.execution,
            presence: pointer.presence,
          },
          { available: true, execution: 'hover', presence: 0 },
        )
        await page.getByRole('button', { name: 'Deactivate scene', exact: true }).click()
        await page.getByRole('button', { name: 'Activate scene', exact: true }).click()
        await page.getByRole('button', { name: 'Read snapshot', exact: true }).click()
        state = JSON.parse(await page.locator('#afterglow-snapshot').textContent())
        assert.equal(state.resources.pointerFollowers, 1)
        assert.equal(state.resources.values, 7)
        await page.getByRole('link', { name: 'Leave motion' }).click()
        await expect(page.locator('#afterglow-edition')).toHaveCount(0)
        await page.goBack()
        await expect(page.locator('#afterglow-edition')).toBeVisible()
      }
      assert.deepEqual(errors, [], `${engine} ${mode}: motion hydration and lifecycle`)
      results.push({
        engine,
        mode,
        test: 'motion regions, shared identities, top-layer overlays and lifecycle',
        passed: true,
      })
    } finally {
      await browser.close()
    }
  }
  results.push(...(await checkNuxtDepth(origin, mode)))
  return results
}

async function checkNuxtDepth(origin, mode) {
  const route = mode === 'ssg' ? '/depth-static/' : '/depth/'
  const html = await (await fetch(`${origin}${route}`)).text()
  for (const text of ['Paths, depth and shadows', 'Waiting at the start', 'A card that lifts'])
    assert(html.includes(text), `${mode}: readable initial depth content`)
  assert(/perspective:\s*640px/.test(html), `${mode}: the parent box declares its perspective`)
  assert(!html.includes('[object Object]'), `${mode}: no runtime identities in depth attributes`)
  const results = []
  for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
    const browser = await launcher.launch()
    try {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
      const errors = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('console', (message) => {
        if (message.type() === 'error' || /hydration/i.test(message.text()))
          errors.push(message.text())
      })
      await page.goto(`${origin}${route}`)
      const pose = (id) =>
        page.locator(id).evaluate((el) => {
          const matrix = new DOMMatrixReadOnly(getComputedStyle(el).transform)
          return { x: matrix.e, y: matrix.f, flat: matrix.is2D }
        })
      const press = (name) =>
        page.getByRole('button', { name, exact: true }).evaluate((el) => el.click())
      await expect(page.locator('#depth-shadow')).toHaveText('The shadow follows the card.')
      await press('Send')
      await expect(page.locator('#depth-route')).toHaveText('Delivered')
      assert(Math.abs((await pose('#depth-courier')).x - 196) < 0.5, 'The path ends where declared')
      await press('Tilt')
      await expect.poll(async () => (await pose('#depth-panel')).flat).toBe(false)
      await press('Lift')
      await expect.poll(async () => (await pose('#depth-card')).y).toBeCloseTo(-8, 1)
      await expect
        .poll(() => page.locator('#depth-card').evaluate((el) => getComputedStyle(el).boxShadow))
        .toContain('16px 40px')
      await press('Unmount')
      await expect(page.locator('#depth-courier')).toHaveCount(0)
      await press('Mount')
      assert(Math.abs((await pose('#depth-courier')).x) < 0.5, 'A remounted path starts at rest')
      if (mode === 'ssr') {
        // Deactivated by KeepAlive with a path in flight: the playback ends, the screen keeps
        // its state and the reactivated surface takes a new request.
        await press('Send')
        await expect(page.locator('#depth-route')).toHaveText('On the way')
        await press('Deactivate depth')
        await expect(page.locator('#depth-courier')).toHaveCount(0)
        await press('Activate depth')
        await expect(page.locator('#depth-route')).toHaveText('Stopped on the way')
        await press('Send')
        await expect(page.locator('#depth-route')).toHaveText('Delivered')
        assert(Math.abs((await pose('#depth-courier')).x - 196) < 0.5, 'A reactivated path ends')
      }
      assert.deepEqual(errors, [], `${engine} ${mode}: depth hydration and lifecycle`)
      results.push({
        engine,
        mode,
        test: 'paths, axis rotation under parent perspective and theme shadows',
        passed: true,
      })
    } finally {
      await browser.close()
    }
  }
  return results
}
