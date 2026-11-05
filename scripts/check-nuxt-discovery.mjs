import assert from 'node:assert/strict'
import { chromium, webkit, expect } from '@playwright/test'

export async function checkNuxtDiscovery(origin, mode) {
  const path = mode === 'ssg' ? '/discovery-static/' : '/discovery/'
  const response = await fetch(origin + path)
  assert.equal(response.status, 200)
  const html = await response.text()
  assert(html.includes('November 2026'))
  assert(html.includes('aria-valuenow="20"'))
  assert(html.includes('role="treeitem"'))
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
      let release
      const gate = new Promise((resolve) => {
        release = resolve
      })
      await page.route('**/_nuxt/**', async (route) => {
        if (new URL(route.request().url()).pathname.endsWith('.js')) await gate
        await route.continue()
      })
      try {
        await page.goto(origin + path, { waitUntil: 'commit' })
        const input = page.getByRole('slider', { name: 'Budget: Minimum', exact: true })
        await input.focus()
        await input.press('ArrowRight')
        await expect(input).toHaveValue('21')
      } finally {
        release()
      }
      await expect(page.locator('#discovery-ready')).toHaveText('ready')
      await expect(page.locator('#discovery-range')).toHaveText('21,80')
      await page.getByRole('button', { name: 'Name', exact: true }).click()
      await page.getByRole('checkbox', { name: 'Select one', exact: true }).check()
      await page.getByRole('button', { name: 'Next slide', exact: true }).click()
      await page.locator('[data-date="2026-11-12"]').click()
      await page.getByRole('button', { name: 'Score: 4 / 5', exact: true }).click()
      const root = page.getByRole('treeitem', { name: 'Root', exact: true })
      await root.focus()
      await root.press('ArrowRight')
      await root.press('ArrowRight')
      await page.keyboard.press('Enter')
      await expect(page.locator('#discovery-state')).toHaveText(
        'two|ascending|one|2026-11-12|4|child',
      )
      assert.deepEqual(errors, [])
      results.push({
        mode,
        engine,
        test: 'six controls, early range edit and hydration',
        passed: true,
      })
    } finally {
      await browser.close()
    }
  }
  return results
}
