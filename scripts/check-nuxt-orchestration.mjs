import assert from 'node:assert/strict'
import { chromium, webkit, expect } from '@playwright/test'

export async function checkNuxtOrchestration(origin, mode) {
  const route = mode === 'ssg' ? '/orchestration-static/' : '/orchestration/'
  const html = await (await fetch(origin + route)).text()
  assert(html.includes('A shared motion surface') && html.includes('Server rendered connection'))
  assert(!html.includes('motionregion="[object Object]"'))
  const results = []
  for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
    const browser = await launcher.launch()
    try {
      const page = await browser.newPage()
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('console', message => { if (/hydration|\[Vue warn\]/i.test(message.text())) errors.push(message.text()) })
      await page.goto(origin + route)
      await page.getByRole('button', { name: 'Start orchestration', exact: true }).click()
      await page.getByRole('button', { name: 'Pause orchestration', exact: true }).click()
      await page.waitForTimeout(1100)
      await expect(page.locator('#nuxt-motion-checkpoints')).toHaveText('0 checkpoints')
      await page.getByRole('button', { name: 'Resume orchestration', exact: true }).click()
      await expect(page.locator('#nuxt-motion-checkpoints')).toHaveText('1 checkpoints')
      await page.getByRole('button', { name: 'Reverse connection' }).click()
      await expect.poll(() => page.locator('#nuxt-motion-path').evaluate(el => parseFloat(getComputedStyle(el).strokeDashoffset))).toBeCloseTo(100, 0)
      if (mode === 'ssr') {
        await page.getByRole('button', { name: 'Start orchestration', exact: true }).click()
        await page.getByRole('button', { name: 'Deactivate orchestration', exact: true }).click()
        await page.waitForTimeout(1100)
        await page.getByRole('button', { name: 'Activate orchestration', exact: true }).click()
        await expect(page.locator('#nuxt-motion-checkpoints')).toHaveText('1 checkpoints')
        await page.getByRole('button', { name: 'Start orchestration', exact: true }).click()
        await expect(page.locator('#nuxt-motion-checkpoints')).toHaveText('2 checkpoints')
        await page.getByRole('link', { name: 'Leave orchestration', exact: true }).click()
        await expect(page.locator('#nuxt-motion-path')).toHaveCount(0)
      }
      assert.deepEqual(errors, [], `${engine} ${mode}: orchestration hydration and cleanup`)
      results.push({ engine, mode, test: 'orchestration, SVG and owned KeepAlive cleanup', passed: true })
    } finally { await browser.close() }
  }
  return results
}
