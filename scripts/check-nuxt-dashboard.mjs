import assert from 'node:assert/strict'
import { chromium, webkit, expect } from '@playwright/test'
export async function checkNuxtDashboard(origin, mode) {
  const path = mode === 'ssg' ? '/dashboard-static/' : '/dashboard/'
  const response = await fetch(origin + path)
  assert.equal(response.status, 200)
  const html = await response.text()
  for (const value of [
    'A shared project',
    'Design · 75 · 75%',
    'Activity',
    'A retained editor',
    'A retained particle slot',
    'Celebrate',
  ])
    assert(html.includes(value), `SSR contains ${value}`)
  const results = []
  for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
    const browser = await launcher.launch()
    try {
      const page = await browser.newPage({ reducedMotion: 'reduce' }),
        errors = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('console', (message) => {
        if (/hydration|\[Vue warn\]/i.test(message.text())) errors.push(message.text())
      })
      await page.goto(origin + path)
      await expect(page.locator('#dashboard-ready')).toHaveText('ready')
      await page.getByRole('button', { name: 'Move card', exact: true }).click()
      await page.getByRole('menuitem', { name: 'Published', exact: true }).click()
      await page.getByRole('button', { name: 'Design · 75 · 75%', exact: true }).click()
      await page.getByRole('textbox', { name: 'A retained editor' }).fill('Still here')
      await page.getByRole('button', { name: 'Celebrate', exact: true }).click()
      await expect(page.locator('#dashboard-state')).toHaveText('done|a|1|Still here')
      await expect(page.locator('canvas')).toHaveCount(0)
      assert.deepEqual(errors, [])
      results.push({
        mode,
        engine,
        test: 'dashboard components retain SSR/SSG state and shared interactions',
        passed: true,
      })
    } finally {
      await browser.close()
    }
  }
  return results
}
