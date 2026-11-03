import assert from 'node:assert/strict'
import { chromium, webkit, expect } from '@playwright/test'

export async function checkNuxtVisuals(origin, mode) {
  const route = mode === 'ssg' ? '/visuals-static/' : '/visuals/'
  const html = await (await fetch(origin + route)).text()
  assert(
    html.includes('A different light.') && html.includes('1,298'),
    'Readable server text before visual setup',
  )
  assert(!html.includes('motionsurface="[object Object]"'))
  const results = []
  for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
    const browser = await launcher.launch()
    try {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
      const errors = []
      page.on('pageerror', (error) => {
        errors.push(error.message)
        console.error('Visual page error:', error.stack)
      })
      page.on('console', (message) => {
        if (message.type() === 'error' || /hydration|\[Vue warn\]/i.test(message.text()))
          errors.push(message.text())
      })
      await page.goto(origin + route)
      const paint = page.locator('#lustre-paint'),
        amount = page.locator('#lustre-amount')
      await expect
        .poll(() => paint.evaluate((el) => getComputedStyle(el).backgroundImage))
        .toContain('linear-gradient')
      await page.locator('#lustre-roll').click()
      await expect(amount).toHaveText('5,585')
      await page.locator('#lustre-conic').click()
      await page.locator('#lustre-circle-toggle').click()
      await expect(page.locator('#lustre-circle')).toHaveAttribute('inert', '')
      await page.locator('#visual-active').click()
      await expect(paint).toHaveCount(0)
      await page.locator('#visual-active').click()
      await expect(amount).toHaveText('5,585')
      await expect
        .poll(() => paint.evaluate((el) => getComputedStyle(el).backgroundImage))
        .toContain('conic-gradient')
      await expect(page.locator('#lustre-circle')).not.toHaveAttribute('inert', '')
      await expect(page.locator('#lustre-circle-toggle')).toBeEnabled()
      await expect(page.locator('#lustre-loading-limit')).toHaveCount(0)
      await page.locator('#visual-scene').click()
      await expect(page.locator('#current-status')).toContainText('ready')
      await page.locator('#current-jump').click()
      const anchor = page.locator('#current-note-8'),
        before = (await anchor.boundingBox()).y
      await page.locator('#current-insert').click()
      await expect(page.locator('#current-new-1')).toHaveCount(1)
      await expect
        .poll(async () => Math.abs((await anchor.boundingBox()).y - before))
        .toBeLessThan(3)
      await page.locator('#current-refresh').click()
      await page.locator('#visual-active').click()
      await page.waitForTimeout(1100)
      await page.locator('#visual-active').click()
      await expect(page.locator('#current-status')).toContainText('0 refreshes')
      await expect(page.locator('[data-jolt-header-spacer]')).toHaveCount(1)
      await page.locator('#current-refresh').click()
      await expect(page.locator('#current-status')).toContainText('1 refreshes')
      if (mode === 'ssr') {
        await page.getByRole('link', { name: 'Leave visuals' }).click()
        await expect(page.locator('#current-header')).toHaveCount(0)
      }
      assert.deepEqual(errors, [], `${engine} ${mode} visual hydration and KeepAlive`)
      results.push({
        engine,
        mode,
        test: 'visual effects and retained collections hydrate, resume and cancel stale refresh',
        passed: true,
      })
    } finally {
      await browser.close()
    }
  }
  return results
}
