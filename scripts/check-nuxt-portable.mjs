import assert from 'node:assert/strict'
import { chromium, webkit, expect } from '@playwright/test'

export async function checkNuxtPortable(origin, mode) {
  const route = mode === 'ssg' ? '/portable-static/' : '/portable/'
  const html = await (await fetch(origin + route)).text()
  assert(html.includes('Web content') && html.includes('Browser fallback'))
  assert(!html.includes('Native content'))
  const results = []
  for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
    const browser = await launcher.launch()
    try {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
      const errors = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('console', (message) => {
        if (/hydration|\[Vue warn\]/i.test(message.text())) errors.push(message.text())
      })
      await page.goto(origin + route)
      await expect(page.locator('#portable-web')).toBeVisible()
      await expect(page.locator('#portable-native')).toHaveCount(0)
      await page.getByLabel('Draft 1', { exact: true }).fill('Shared draft')
      await page.getByRole('button', { name: 'Reverse list', exact: true }).click()
      await expect(page.locator('#portable-list-status')).toHaveText('complete')
      await expect(page.getByLabel('Draft 1', { exact: true })).toHaveValue('Shared draft')
      // SSR exercises an async Nuxt page and its page:finish barrier. SSG checks hydration.
      if (mode === 'ssr') {
        const trigger = page.locator('#portable-details')
        await trigger.focus()
        await trigger.press('Enter')
        await expect(page.getByRole('heading', { name: 'Shared detail' })).toBeVisible()
        await expect(page.locator('#portable-heading')).toBeFocused()
        await page.goBack()
        await expect(page.locator('#portable-details')).toBeFocused()
        await page.getByRole('link', { name: 'Try blocked route', exact: true }).click()
        await expect(page).toHaveURL(/\/portable\/?$/)
      }
      assert.deepEqual(errors, [], `${engine} ${mode} portable screen`)
      results.push({
        engine,
        mode,
        test: 'platform slots, keyed lists and router transitions',
        passed: true,
      })
    } finally {
      await browser.close()
    }
  }
  return results
}
