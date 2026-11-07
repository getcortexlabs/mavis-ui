import assert from 'node:assert/strict'
import { chromium, webkit, expect } from '@playwright/test'
export async function checkNuxtAdvanced(origin, mode) {
  const path = mode === 'ssg' ? '/advanced-static/' : '/advanced/',
    response = await fetch(origin + path)
  assert.equal(response.status, 200)
  const html = await response.text()
  for (const value of [
    'Fern',
    'A shared story',
    'Retained editor',
    '2026-11-07: 0',
    'Studio meeting',
    'A shared message',
  ])
    assert(html.includes(value), `SSR contains ${value}`)
  const results = []
  for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
    const browser = await launcher.launch()
    try {
      const page = await browser.newPage({ reducedMotion: 'reduce' }),
        errors = []
      page.on('pageerror', (e) => errors.push(e.message))
      page.on('console', (m) => {
        if (/hydration|\[Vue warn\]/i.test(m.text())) errors.push(m.text())
      })
      await page.goto(origin + path)
      await expect(page.locator('#advanced-ready')).toHaveText('ready')
      await expect(page.locator('#advanced-image-status')).toHaveText('loaded')
      await page.getByRole('button', { name: 'Fern', exact: true }).click()
      await page.getByRole('button', { name: 'Moss', exact: true }).click()
      await page.getByRole('textbox', { name: 'Retained editor' }).fill('Still here')
      await page.getByRole('button', { name: '2026-11-07: 0', exact: true }).click()
      await page
        .getByRole('button', { name: 'Mark as read: A shared message', exact: true })
        .click()
      await expect(page.getByRole('button', { name: 'Export image', exact: true })).toBeEnabled()
      await page.getByRole('button', { name: 'Export image', exact: true }).click()
      await expect(page.locator('#advanced-state')).toHaveText('moss|2026-11-07|Still here|true|16')
      assert.deepEqual(errors, [])
      results.push({
        mode,
        engine,
        test: 'advanced components SSR, hydration, controlled state and image export',
        passed: true,
      })
    } finally {
      await browser.close()
    }
  }
  return results
}
