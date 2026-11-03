import assert from 'node:assert/strict'
import { chromium, webkit, expect } from '@playwright/test'

/** Runs against either the installed Nuxt server or its generated static output. */
export async function checkNuxtDates(origin, mode) {
  const route = mode === 'ssg' ? '/dates-static/' : '/dates/'
  const html = await (await fetch(`${origin}${route}`)).text()
  assert(html.includes('value="2024-02-29"'), `${mode}: civil date initial HTML`)
  assert(html.includes('placeholder="AAAA-MM-DD"'), `${mode}: explicit locale snapshot`)
  assert(html.includes('value="29/02/2024"'), `${mode}: localized editor snapshot`)
  assert(html.includes('02/11/2026'), `${mode}: explicit timezone snapshot`)
  assert(!html.includes('role="grid"'), `${mode}: calendar starts closed`)
  const results = []
  for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
    const browser = await launcher.launch()
    try {
      // Opposite sides of the date line must retain the same civil-date strings.
      for (const timezoneId of ['Pacific/Kiritimati', 'Pacific/Pago_Pago']) {
        const context = await browser.newContext({
          timezoneId,
          viewport: { width: 390, height: 844 },
        })
        const page = await context.newPage()
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
          await page.goto(`${origin}${route}`, { waitUntil: 'commit' })
          await page.locator('#nuxt-date').waitFor()
          await page.evaluate(() => {
            window.__dateEditors = [...document.querySelectorAll('input')]
            window.__dateIds = [...document.querySelectorAll('[id]')].map((element) => element.id)
          })
          await expect(page.locator('#nuxt-restored')).toHaveValue('2024-02-')
          await expect(page.getByRole('button', { name: 'Choose date: Restored draft', exact: true })).toBeDisabled()
          await page.locator('#nuxt-local-date').fill('01/03/')
          await page.locator('#nuxt-date').fill('2024-03-10')
          await page.locator('#nuxt-draft').fill('2024-02-')
          await page.locator('#nuxt-range-start').fill('2024-03-12')
          await page.locator('#nuxt-range-end').fill('2024-03-15')
          await page.locator('#nuxt-draft').focus()
          await page.locator('#nuxt-draft').evaluate((element) => element.setSelectionRange(5, 7))
        } finally {
          release()
        }
        await page.locator('[data-date-ready="true"]').waitFor()
        await expect(page.getByRole('button', { name: 'Choose date: Restored draft', exact: true })).toBeEnabled()
        await expect(page.locator('#nuxt-restored')).toHaveValue('2024-02-')
        await expect(page.locator('#nuxt-local-date')).toHaveValue('01/03/')
        await expect(page.getByTestId('localized-model')).toHaveText('2024-02-29')
        await expect(page.getByTestId('zoned-instant')).toHaveText('02/11/2026')
        await expect(page.locator('#nuxt-date')).toHaveValue('2024-03-10')
        await expect(page.locator('#nuxt-draft')).toHaveValue('2024-02-')
        await expect(page.locator('#nuxt-range-start')).toHaveValue('2024-03-12')
        await expect(page.locator('#nuxt-range-end')).toHaveValue('2024-03-15')
        await expect(page.getByTestId('date-model')).toHaveText('2024-03-10')
        await expect(page.getByTestId('draft-model')).toHaveText('2024-02-01')
        await expect(page.getByTestId('range-model')).toHaveText('2024-03-12 / 2024-03-15')
        assert(
          await page.evaluate(() =>
            [...document.querySelectorAll('input')].every(
              (element, index) => element === window.__dateEditors[index],
            ),
          ),
          `${mode}/${engine}: editor identity`,
        )
        assert.deepEqual(
          await page
            .locator('#nuxt-draft')
            .evaluate((element) => [element.selectionStart, element.selectionEnd]),
          [5, 7],
        )
        assert.deepEqual(
          await page.evaluate(() =>
            [...document.querySelectorAll('[id]')].map((element) => element.id),
          ),
          await page.evaluate(() => window.__dateIds),
        )
        await page.getByRole('button', { name: 'Escolher data: Departure', exact: true }).click()
        const dialog = page.getByRole('dialog', { name: 'Departure', exact: true })
        await expect(dialog.getByRole('grid', { name: 'março 2024' })).toBeVisible()
        await expect(dialog.locator('[data-date="2024-03-10"]')).toBeFocused()
        await dialog.locator('[data-date="2024-03-10"]').press('ArrowRight')
        await dialog.locator('[data-date="2024-03-11"]').press('Enter')
        await expect(page.getByTestId('date-model')).toHaveText('2024-03-11')
        await expect(page.getByRole('button', { name: 'Escolher data: Departure', exact: true })).toBeFocused()
        assert.deepEqual(errors, [], `${mode}/${engine}/${timezoneId}: hydration/runtime errors`)
        results.push({
          mode,
          engine,
          timezoneId,
          test: 'date drafts, range, DOM identity, caret and calendar after delayed hydration',
          passed: true,
        })
        await context.close()
      }
    } finally {
      await browser.close()
    }
  }
  return results
}
