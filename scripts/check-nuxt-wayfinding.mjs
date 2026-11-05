import assert from 'node:assert/strict'
import { chromium, webkit, expect } from '@playwright/test'

export async function checkNuxtWayfinding(origin, mode) {
  const path = mode === 'ssg' ? '/wayfinding-static/' : '/wayfinding/'
  const response = await fetch(origin + path)
  assert.equal(response.status, 200)
  const html = await response.text()
  assert(html.includes('Sales: -3'))
  assert(html.includes('Activity in the last seven days.'))
  const results = []
  for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
    const browser = await launcher.launch()
    try {
      const page = await browser.newPage()
      const errors = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('console', (message) => {
        if (/hydration|\[Vue warn\]/i.test(message.text())) errors.push(message.text())
      })
      await page.goto(origin + path)
      await expect(page.locator('#wayfinding-ready')).toHaveText('ready')
      await page.getByRole('button', { name: 'Open commands', exact: true }).click()
      await page.getByRole('textbox', { name: 'Search commands', exact: true }).fill('invite')
      await page.getByRole('button', { name: 'Invite a teammate', exact: true }).click()
      await expect(page.locator('#wayfinding-trigger')).toBeFocused()
      await page.getByRole('button', { name: 'Collapse navigation', exact: true }).click()
      await page.getByRole('link', { name: 'Start', exact: true }).click()
      const help = page.getByRole('button', { name: 'About activity', exact: true })
      await help.focus()
      await expect(page.getByRole('tooltip')).toBeVisible()
      await help.press('Escape')
      await expect(page.getByRole('tooltip')).not.toBeVisible()
      await page.getByRole('button', { name: 'Category Category', exact: true }).click()
      await page.getByRole('option', { name: 'Tuesday', exact: true }).click()
      await expect(page.locator('#wayfinding-state')).toHaveText('1|true|/|tue|sales')
      await expect(page.getByRole('status')).toHaveText('Tuesday · Sales: 5')
      await expect(page.getByRole('list', { name: 'Activity' })).toContainText('Complete')
      assert.deepEqual(errors, [])
      results.push({
        mode,
        engine,
        test: 'wayfinding SSR/SSG hydration, focus, selection and data',
        passed: true,
      })
    } finally {
      await browser.close()
    }
  }
  return results
}
