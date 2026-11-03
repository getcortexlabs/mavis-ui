import assert from 'node:assert/strict'
import { chromium, webkit, expect } from '@playwright/test'

export async function checkNuxtPlatforms(origin, mode) {
  const route = mode === 'ssg' ? '/platforms-static/' : '/platforms/'
  const html = await (await fetch(origin + route)).text()
  assert(html.includes('Another way to see.') && html.includes('The journey matters too.'))
  assert(!html.includes('motionsurface="[object Object]"'))
  const results = []
  for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
    const browser = await launcher.launch()
    try {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
      const errors = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('console', (message) => {
        if (message.type() === 'error' || /hydration|\[Vue warn\]/i.test(message.text()))
          errors.push(message.text())
      })
      await page.goto(origin + route)
      await expect(page.locator('#prism-ready')).toHaveText('Image ready')
      await page.locator('#prism-prepare').click()
      await expect(page.locator('#prism-status')).toHaveText('paused')
      await page.locator('#prism-seek').click()
      await page.locator('#prism-finish').click()
      await expect(page.locator('#prism-status')).toHaveText('completed')
      const src = await page.locator('#prism-photo img').getAttribute('src')
      await page.locator('#platform-active').click()
      await expect(page.locator('#prism-photo')).toHaveCount(0)
      await page.locator('#platform-active').click()
      await expect(page.locator('#prism-ready')).toHaveText('Image ready')
      await expect(page.locator('#prism-photo img')).toHaveAttribute('src', src)
      await page.locator('#platform-orbit').click()
      await expect(page.locator('#orbit-ready')).toContainText('Ready to move')
      await page.locator('#platform-active').click()
      await page.locator('#platform-active').click()
      await expect(page.locator('#orbit-ready')).toContainText('Ready to move')
      await expect(page.locator('#orbit-error')).toHaveCount(0)
      await page.locator('#passage-travel').click()
      await expect(page.locator('#passage-status')).toHaveText('completed')
      await expect(page.locator('#passage-detail')).toBeVisible()
      assert.deepEqual(errors, [], `${engine} ${mode} platform hydration/KeepAlive`)
      results.push({
        engine,
        mode,
        test: 'image model, physics and asynchronous navigation hydrate and resume',
        passed: true,
      })
    } finally {
      await browser.close()
    }
  }
  return results
}
