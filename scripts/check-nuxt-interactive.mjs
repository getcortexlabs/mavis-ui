import assert from 'node:assert/strict'
import { chromium, webkit, expect } from '@playwright/test'

export async function checkNuxtInteractive(origin, mode) {
  const path = mode === 'ssg' ? '/interactive-static/' : '/interactive/'
  const response = await fetch(origin + path)
  assert.equal(response.status, 200)
  const html = await response.text()
  assert(html.includes('Revenue: $1,234.50'))
  assert(html.includes('Keep this draft'))
  assert(html.includes('Terracotta study'))
  const results = []
  for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
    const browser = await launcher.launch()
    try {
      const page = await browser.newPage({ reducedMotion: 'reduce' })
      const errors = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('console', (message) => {
        if (/hydration|\[Vue warn\]/i.test(message.text())) errors.push(message.text())
      })
      await page.goto(origin + path)
      await expect(page.locator('#interactive-ready')).toHaveText('ready')
      await page.getByRole('button', { name: 'Add revenue', exact: true }).click()
      await expect(page.locator('#interactive-revenue')).toHaveAttribute(
        'aria-label',
        'Revenue: $1,244.50',
      )
      await page.getByRole('button', { name: 'Move down: Alpha', exact: true }).click()
      await page.getByRole('button', { name: 'Actions', exact: true }).click()
      await page.getByRole('menuitem', { name: 'Archive', exact: true }).click()
      await page.getByRole('separator', { name: 'Workspace', exact: true }).press('Home')
      await expect(page.getByRole('textbox', { name: 'Draft', exact: true })).toHaveValue(
        'Keep this draft',
      )
      await page.getByRole('slider', { name: 'Comparison', exact: true }).press('End')
      const trigger = page.getByRole('button', { name: 'Terracotta study', exact: true })
      await trigger.click()
      const dialog = page.getByRole('dialog', { name: 'Gallery', exact: true })
      await expect(dialog).toBeVisible()
      await dialog.getByRole('button', { name: 'Close viewer', exact: true }).click()
      await expect(trigger).toBeFocused()
      await expect(page.locator('#interactive-state')).toHaveText('b,a|archive|20|100|false')
      assert.deepEqual(errors, [])
      results.push({
        mode,
        engine,
        test: 'interactive SSR/SSG hydration, state and focus',
        passed: true,
      })
    } finally {
      await browser.close()
    }
  }
  return results
}
