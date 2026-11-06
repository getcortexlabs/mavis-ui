import assert from 'node:assert/strict'
import { chromium, webkit, expect } from '@playwright/test'

export async function checkNuxtScreenComponents(origin, mode) {
  const path = mode === 'ssg' ? '/screen-components-static/' : '/screen-components/'
  const response = await fetch(origin + path)
  assert.equal(response.status, 200)
  const html = await response.text()
  for (const text of [
    'Make room for wonder.',
    '001234',
    'A server-rendered draft',
    'A retained story',
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
      await expect(page.locator('#screen-components-ready')).toHaveText('ready')
      const pin = page.getByRole('textbox', { name: 'Verification code', exact: true })
      await expect(pin).toHaveValue('001234')
      await pin.fill('098765')
      const draft = page.getByRole('textbox', { name: 'Message', exact: true })
      await expect(draft).toHaveValue('A server-rendered draft')
      const trigger = page.getByRole('button', { name: 'Create', exact: true })
      await trigger.click()
      await page.getByRole('button', { name: 'Write a note', exact: true }).click()
      await expect(trigger).toBeFocused()
      await expect(page.locator('#screen-components-state')).toHaveText('098765|note')
      await page.getByRole('button', { name: 'Refresh', exact: true }).click()
      await expect(page.locator('#screen-components-edition')).toHaveText('2')
      await expect(draft).toHaveValue('A server-rendered draft')
      assert.deepEqual(errors, [])
      results.push({
        mode,
        engine,
        test: 'screen components preserve SSR/SSG state through hydration and interaction',
        passed: true,
      })
    } finally {
      await browser.close()
    }
  }
  return results
}
