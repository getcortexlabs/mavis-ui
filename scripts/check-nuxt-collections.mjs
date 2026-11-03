import assert from 'node:assert/strict'
import { chromium, webkit, expect } from '@playwright/test'

export async function checkNuxtCollections(origin, mode) {
  const path = mode === 'ssg' ? '/collections-static/' : '/collections/'
  const response = await fetch(origin + path)
  assert.equal(response.status, 200)
  const html = await response.text()
  assert(html.includes('value="9:30 AM"'))
  assert.equal((html.match(/role="listitem"/g) ?? []).length, 7)
  assert(!html.includes('collection-row-1000'))
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
        await page.locator('#collection-time').fill('10:15 AM')
        await page.locator('#collection-time').evaluate((element) => {
          window.__collectionEditor = element
        })
      } finally {
        release()
      }
      await expect(page.locator('#collection-ready')).toHaveText('ready')
      await expect(page.locator('#collection-time')).toHaveValue('10:15 AM')
      await expect(page.locator('#collection-state')).toContainText('|10:15|')
      assert(
        await page
          .locator('#collection-time')
          .evaluate((element) => element === window.__collectionEditor),
      )
      const trigger = page.getByRole('button', { name: 'Actions', exact: true })
      await trigger.click()
      await page.getByRole('menuitem', { name: 'Edit', exact: true }).click()
      await expect(trigger).toBeFocused()
      await expect(page.locator('#collection-state')).toContainText('|edit|')
      await page.getByRole('button', { name: 'Filters', exact: true }).click()
      await page.locator('#collection-query').fill('Retained')
      await page.getByRole('button', { name: 'Apply filters', exact: true }).click()
      await expect(page.locator('#collection-state')).toContainText('|Retained|')
      await page.locator('#collection-last').click()
      await expect(page.locator('#collection-row-1000')).toBeVisible()
      assert((await page.locator('#collection-list [role="listitem"]').count()) < 15)
      assert.deepEqual(errors, [])
      results.push({
        mode,
        engine,
        test: 'collection hydration, localized draft, overlays and bounded rows',
        passed: true,
      })
    } finally {
      await browser.close()
    }
  }
  return results
}
