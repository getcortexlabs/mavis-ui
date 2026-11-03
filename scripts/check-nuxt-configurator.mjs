import assert from 'node:assert/strict'
import { chromium, webkit, expect } from '@playwright/test'

export async function checkNuxtConfigurator(origin, mode) {
  const path = mode === 'ssg' ? '/configurator-static/' : '/configurator/'
  const html = await (await fetch(origin + path)).text()
  assert(html.includes('srcset="/portrait.svg 320w, /portrait.svg?large 960w"'))
  assert(html.includes('value="2"') && html.includes('alt="Studio art print"'))
  if (mode === 'ssr') {
    const [first, second] = await Promise.all(['First', 'Second'].map(async owner =>
      (await fetch(`${origin}${path}?owner=${owner}`)).text()))
    assert(first.includes('First configurator') && !first.includes('Second configurator'))
    assert(second.includes('Second configurator') && !second.includes('First configurator'))
  }
  const results = []
  for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
    const browser = await launcher.launch()
    try {
      const page = await browser.newPage()
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('console', message => { if (/hydration|\[Vue warn\]/i.test(message.text())) errors.push(message.text()) })
      let release
      const gate = new Promise(resolve => { release = resolve })
      await page.route('**/_nuxt/**', async route => {
        if (new URL(route.request().url()).pathname.endsWith('.js')) await gate
        await route.continue()
      })
      try {
        await page.goto(origin + path, { waitUntil: 'commit' })
        await page.locator('#nuxt-grid-draft').fill('Before grid hydration')
        await page.locator('#nuxt-grid-draft').evaluate(element => { window.__gridDraft = element })
        await page.locator('#nuxt-quantity').fill('2.')
        await page.locator('#nuxt-quantity').evaluate(element => { window.__quantity = element })
      } finally { release() }
      await page.locator('[data-configurator-ready="true"]').waitFor()
      await expect(page.locator('#nuxt-grid-draft')).toHaveValue('Before grid hydration')
      await page.getByRole('button', { name: 'Resize grid', exact: true }).click()
      await expect.poll(() => page.locator('#nuxt-grid').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(1)
      assert(await page.locator('#nuxt-grid-draft').evaluate(element => element === window.__gridDraft))
      await expect(page.locator('#nuxt-grid-draft')).toHaveValue('Before grid hydration')
      await expect(page.locator('#nuxt-product img')).toHaveAttribute('fetchpriority', 'high')
      await expect(page.locator('#nuxt-quantity')).toHaveValue('2.')
      await expect(page.getByTestId('quantity-model')).toHaveText('2 / 2.')
      assert(await page.locator('#nuxt-quantity').evaluate(element => element === window.__quantity))
      await page.getByRole('button', { name: 'Increase: Quantity', exact: true }).click()
      await expect(page.locator('#nuxt-quantity')).toHaveValue('2.5')
      await page.getByRole('button', { name: 'Extras: Frame', exact: true }).click()
      await page.getByRole('dialog').getByRole('checkbox', { name: 'Gift wrap', exact: true }).check()
      await page.getByRole('dialog').getByRole('button', { name: 'Done', exact: true }).last().click()
      await expect(page.getByRole('button', { name: 'Extras: Frame, Gift wrap', exact: true })).toBeFocused()
      await page.getByRole('checkbox', { name: 'Gift', exact: true }).check()
      await page.getByRole('textbox', { name: 'Note', exact: true }).fill('Retain this')
      const trigger = page.getByRole('button', { name: 'Delivery', exact: true })
      await trigger.evaluate(element => element.click())
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
      await trigger.evaluate(element => element.click())
      await expect(page.getByRole('textbox', { name: 'Note', exact: true })).toHaveValue('Retain this')
      await expect(page.locator('#nuxt-product')).toHaveAttribute('data-state', 'ready')
      assert.deepEqual(errors, [])
      results.push({ mode, engine, test: 'configurator editing, choice paint, Accordion and request isolation', passed: true })
    } finally { await browser.close() }
  }
  return results
}
