import assert from 'node:assert/strict'
import { chromium, webkit, expect } from '@playwright/test'
export async function checkNuxtCreative(origin, mode) {
  const path = mode === 'ssg' ? '/creative-static/' : '/creative/'
  const response = await fetch(origin + path)
  assert.equal(response.status, 200)
  const html = await response.text()
  for (const text of [
    '#12345680',
    'A retained card',
    'A retained target',
    'Stay curious',
    'aria-valuenow="72"',
  ])
    assert(html.includes(text), `SSR contains ${text}`)
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
      await expect(page.locator('#creative-ready')).toHaveText('ready')
      await page.getByRole('textbox', { name: 'HEX or RGB', exact: true }).fill('#ABCDEF80')
      await page.getByRole('button', { name: 'Keep', exact: true }).click()
      await page.getByRole('checkbox', { name: 'Notebook', exact: true }).check()
      await page.getByRole('button', { name: 'Add selected', exact: true }).click()
      await expect(page.locator('#creative-state')).toHaveText('#ABCDEF80|b|1,2')
      await page.getByRole('button', { name: 'Update meter', exact: true }).click()
      await expect(page.getByRole('meter', { name: 'Balance', exact: true })).toHaveAttribute(
        'aria-valuenow',
        '92',
      )
      await page.getByRole('button', { name: 'Start tour', exact: true }).click()
      await page
        .getByRole('dialog', { name: 'Your story', exact: true })
        .getByRole('button', { name: 'Finish', exact: true })
        .click()
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'Play motion', exact: true })).toBeDisabled()
      assert.deepEqual(errors, [])
      results.push({
        mode,
        engine,
        test: 'creative controls preserve SSR/SSG state and interactions',
        passed: true,
      })
    } finally {
      await browser.close()
    }
  }
  return results
}
