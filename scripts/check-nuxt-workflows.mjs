import assert from 'node:assert/strict'
import { chromium, webkit, expect } from '@playwright/test'

export async function checkNuxtWorkflows(origin, mode) {
  const route = mode === 'ssg' ? '/workflows-static/' : '/workflows/'
  const results = []
  const html = await (await fetch(`${origin}${route}`)).text()
  for (const text of [
    'Profile details',
    'Review registration',
    'Destination city',
    'itinerary.pdf',
    'Saved result pages',
    'Registration steps',
  ])
    assert(html.includes(text), `${mode}: initial ${text}`)
  assert(html.includes('value="Recife"'), `${mode}: serializable search snapshot`)
  assert(!html.includes('blob:'), `${mode}: no local file preview in SSR`)
  assert(!html.includes('type="file"'), `${mode}: no server file picker activation`)
  if (mode === 'ssr') {
    await Promise.all(
      ['Rafa', 'Marina'].map(async (owner) => {
        const snapshot = await (await fetch(`${origin}${route}?owner=${owner}&page=2`)).text()
        assert(snapshot.includes(`value="${owner}"`), 'Per-request field state')
        assert(
          snapshot.includes(`Review ${owner}&#39;s name.`) ||
            snapshot.includes(`Review ${owner}'s name.`),
          'Per-request form errors',
        )
        assert(snapshot.includes('data-testid="workflow-page">2<'), 'SSR route query owns page 2')
        assert(
          !snapshot.includes(`value="${owner === 'Rafa' ? 'Marina' : 'Rafa'}"`),
          'Form isolation',
        )
      }),
    )
    await Promise.all(
      ['0', '10', 'not-a-page'].map(async (page) => {
        const snapshot = await (await fetch(`${origin}${route}?page=${page}`)).text()
        assert(
          snapshot.includes('data-testid="workflow-page">1<'),
          'Host rejects invalid route pages before rendering',
        )
      }),
    )
    results.push({ mode, test: 'per-request form and pagination route state', passed: true })
  }
  for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
    const browser = await launcher.launch()
    try {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('console', (message) => {
        if (/hydration|\[Vue warn\]/i.test(message.text())) errors.push(message.text())
      })
      await page.goto(`${origin}${route}${mode === 'ssr' ? '?page=2&owner=Rafa' : ''}`)
      await page.locator('[data-workflow-ready="true"]').waitFor()
      await expect(page.getByTestId('workflow-searches')).toHaveText('0')
      await expect(page.getByRole('listbox')).toHaveCount(0)
      await expect(page.getByRole('group', { name: 'Profile details' })).toBeVisible()
      await page.getByRole('button', { name: 'Focus first error', exact: true }).click()
      await expect(page.locator('#workflow-name')).toBeFocused()
      const error = page.getByRole('region', { name: 'Review registration' }).getByRole('button')
      await error.click()
      await expect(page.locator('#workflow-name')).toBeFocused()
      await page.getByRole('button', { name: '2. Documents', exact: true }).click()
      await expect(page.getByRole('region', { name: 'Current step panel' })).toHaveText(
        'Document panel owned by the app',
      )
      await expect(
        page.getByRole('button', { name: '2. Documents. Current', exact: true }),
      ).toHaveAttribute('aria-current', 'step')
      const initial = mode === 'ssr' ? '2' : '1'
      const next = String(Number(initial) + 1)
      await expect(page.getByTestId('workflow-page')).toHaveText(initial)
      await page
        .getByRole('navigation', { name: 'Saved result pages' })
        .getByRole('button', { name: 'Next', exact: true })
        .click()
      await expect(page.getByTestId('workflow-page')).toHaveText(next)
      await expect(page).toHaveURL(new RegExp(`[?&]page=${next}(?:&|$)`))
      await page.goBack()
      await expect(page.getByTestId('workflow-page')).toHaveText(initial)
      await expect(
        page
          .getByRole('navigation', { name: 'Saved result pages' })
          .getByRole('button', { name: `Page ${initial}`, exact: true }),
      ).toHaveAttribute('aria-current', 'page')
      const files = page.getByRole('group', { name: 'Trip documents' })
      await expect(files.getByText('itinerary.pdf', { exact: true })).toBeVisible()
      await expect(files.getByRole('button', { name: /^Upload/ })).toHaveCount(0)
      await files.getByRole('button', { name: 'Remove: itinerary.pdf', exact: true }).click()
      await expect(files.getByText('No files selected', { exact: true })).toBeVisible()
      assert.deepEqual(errors, [], `${mode}/${engine}: workflows hydrate and interact`)
      await page.close()

      const delayed = await context.newPage()
      const delayedErrors = []
      delayed.on('pageerror', (error) => delayedErrors.push(error.message))
      delayed.on('console', (message) => {
        if (/hydration|\[Vue warn\]/i.test(message.text())) delayedErrors.push(message.text())
      })
      let release
      const gate = new Promise((resolve) => {
        release = resolve
      })
      await delayed.route('**/_nuxt/**', async (request) => {
        if (new URL(request.request().url()).pathname.endsWith('.js')) await gate
        await request.continue()
      })
      try {
        await delayed.goto(`${origin}${route}`, { waitUntil: 'commit' })
        await delayed.locator('#workflow-city').waitFor()
        await delayed.locator('#workflow-city').fill('Rio')
        await delayed.locator('#workflow-city').evaluate((element) => {
          window.__workflowEditor = element
          element.setSelectionRange(1, 2)
        })
      } finally {
        release()
      }
      await delayed.locator('[data-workflow-ready="true"]').waitFor()
      await expect(delayed.locator('#workflow-city')).toHaveValue('Rio')
      await expect(delayed.getByTestId('workflow-query')).toHaveText('Rio')
      await expect(delayed.getByTestId('workflow-city-model')).toHaveText('2611606')
      // The adopted prior user edit is an explicit query; unchanged hydration above did no fetch.
      await expect(delayed.getByTestId('workflow-searches')).toHaveText('1')
      assert(
        await delayed
          .locator('#workflow-city')
          .evaluate((element) => element === window.__workflowEditor),
        'Combobox editor identity',
      )
      assert.deepEqual(
        await delayed
          .locator('#workflow-city')
          .evaluate((element) => [element.selectionStart, element.selectionEnd]),
        [1, 2],
      )
      // Nuxt applies its initial route scroll after hydration; the editor may move below
      // the viewport. Bring the actual anchor back into view before pointer selection.
      await delayed.locator('#workflow-city').scrollIntoViewIfNeeded()
      await expect(delayed.locator('#workflow-city')).toBeInViewport()
      await expect(
        delayed.getByRole('option', { name: 'Rio de Janeiro', exact: true }),
      ).toBeInViewport()
      await delayed.getByRole('option', { name: 'Rio de Janeiro', exact: true }).click()
      await expect(delayed.getByTestId('workflow-city-model')).toHaveText('3304557')
      assert.deepEqual(delayedErrors, [], `${mode}/${engine}: delayed query hydration`)
      results.push({
        mode,
        engine,
        test: 'forms, step panel, route pagination/back, file descriptors and delayed combobox query',
        passed: true,
      })
      await context.close()
    } finally {
      await browser.close()
    }
  }
  return results
}
