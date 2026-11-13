import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'

test('command palette filters, handles keyboard, skips disabled actions and restores focus', async ({
  page,
}) => {
  await page.goto('/playground/#/preview/command-palette?lang=en')
  const trigger = page.getByRole('button', { name: 'Find an action ⌘ K', exact: true })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Your next move', exact: true })
  const search = dialog.getByRole('textbox', { name: 'Search commands', exact: true })
  await expect(search).toBeFocused()
  // Audit the open palette as well as the closed preview.
  await expect(dialog.locator('.m-sheet-panel')).toHaveCSS('opacity', '1')
  const audit = await new AxeBuilder({ page }).include('dialog[open]').analyze()
  expect(audit.violations).toEqual([])
  await search.press('ArrowDown')
  await expect(dialog.getByRole('button', { name: 'Open overview G O', exact: true })).toBeFocused()
  await page.keyboard.press('End')
  await expect(
    dialog.getByRole('button', { name: 'Invite a teammate I', exact: true }),
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#command-result')).toHaveText('invite')
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
  await page.keyboard.press('Control+k')
  await expect(search).toBeFocused()
  await search.fill('missing')
  await expect(dialog.getByRole('status')).toHaveText('No matching commands')
  await search.fill('team')
  await expect(
    dialog.getByRole('button', { name: 'Invite a teammate I', exact: true }),
  ).toBeVisible()
  await search.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
})

test('rail retains app-owned destinations and accessible names when collapsed', async ({
  page,
}) => {
  await page.goto('/playground/#/preview/navigation-rail?lang=en')
  const rail = page.getByRole('navigation', { name: 'Studio navigation' })
  await rail.getByRole('link', { name: 'Projects 8', exact: true }).click()
  await expect(page.locator('#rail-value')).toHaveText('projects')
  await expect(rail.getByRole('link', { name: 'Projects 8', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await rail.getByRole('button', { name: 'Collapse navigation' }).click()
  await expect(rail).toHaveCSS('width', '80px')
  await expect(rail.getByRole('link', { name: 'Projects 8', exact: true })).toHaveAttribute(
    'href',
    '/projects',
  )
  const result = await new AxeBuilder({ page }).include('.m-navigation-rail').analyze()
  expect(result.violations).toEqual([])
  await rail.getByRole('button', { name: 'Expand navigation' }).click()
  await expect(rail).toHaveCSS('width', '256px')
})

test('breadcrumb expands hidden ancestors and keeps the current page unlinked', async ({
  page,
}) => {
  await page.goto('/playground/#/preview/breadcrumb?lang=en')
  const nav = page.getByRole('navigation', { name: 'Breadcrumb' })
  await expect(nav.getByRole('link', { name: 'Projects', exact: true })).toHaveCount(0)
  await nav.getByRole('button', { name: 'Show full path' }).click()
  await expect(nav.getByRole('link', { name: 'Projects', exact: true })).toBeFocused()
  await nav.getByRole('link', { name: 'Projects', exact: true }).click()
  await expect(page.locator('#breadcrumb-value')).toHaveText('/projects')
  await expect(nav.locator('[aria-current="page"]')).toHaveText('Color stories')
  await expect(nav.getByRole('link', { name: 'Color stories', exact: true })).toHaveCount(0)
})

test('tooltip remains hoverable, dismisses with Escape and leaves focus on its trigger', async ({
  page,
}) => {
  await page.goto('/playground/#/preview/tooltip?lang=en')
  const trigger = page.getByRole('button', { name: 'About this metric', exact: true })
  await trigger.focus()
  const tooltip = page.getByRole('tooltip')
  await expect(tooltip).toBeVisible()
  await expect(trigger).toBeFocused()
  await expect(trigger).toHaveAttribute(
    'aria-describedby',
    (await tooltip.getAttribute('id')) as string,
  )
  await page.keyboard.press('Escape')
  await expect(tooltip).not.toBeVisible()
  await expect(trigger).toBeFocused()
  await trigger.blur()
  await trigger.hover()
  await expect(tooltip).toBeVisible()
  await tooltip.hover()
  await expect(tooltip).toBeVisible()
  await page.mouse.move(0, 0)
  await expect(tooltip).not.toBeVisible()
  await trigger.click()
  await expect(tooltip).toBeVisible()
  await page.getByText('Focus, hover or tap the information button.', { exact: true }).click()
  await expect(tooltip).not.toBeVisible()
})

test('timeline updates states in place without replacing slotted content', async ({ page }) => {
  await page.goto('/playground/#/preview/timeline?lang=en')
  const timeline = page.getByRole('list', { name: 'Project activity' })
  await expect(timeline.getByRole('listitem')).toHaveCount(4)
  const review = timeline.getByRole('listitem').filter({ hasText: 'A fresh pair of eyes' })
  await expect(review).toContainText('In progress')
  await page.getByRole('button', { name: 'Approve and continue' }).click()
  await expect(review).toContainText('Complete')
  await expect(
    timeline.getByRole('listitem').filter({ hasText: 'Ready for the world' }),
  ).toContainText('In progress')
  await expect(review.getByText('AM', { exact: true })).toBeVisible()
})

test('chart pointer preview leaves selection untouched until a click', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/playground/#/preview/chart?lang=en')
  const chart = page.locator('.m-chart')
  const first = chart.locator('svg circle').first()
  await expect(first).toBeVisible()
  const point = await first.boundingBox()
  expect(point).not.toBeNull()
  await page.mouse.move(point!.x + point!.width / 2, point!.y + point!.height / 2)
  await expect(chart.getByRole('status')).toHaveText('Mon · Visits: 18')
  await expect(page.locator('#chart-value')).toHaveText('—')
  await expect(chart.getByRole('button', { name: 'Day Day', exact: true })).toBeVisible()
  await page.mouse.click(point!.x + point!.width / 2, point!.y + point!.height / 2)
  await expect(page.locator('#chart-value')).toHaveText('0/visits')
  const other = await chart.locator('svg circle').nth(7).boundingBox()
  expect(other).not.toBeNull()
  await page.mouse.move(other!.x + other!.width / 2, other!.y + other!.height / 2)
  await expect(chart.getByRole('status')).toHaveText('Mon · Saves: 8')
  await expect(page.locator('#chart-value')).toHaveText('0/visits')
  await page.getByRole('radio', { name: 'Lines', exact: true }).hover()
  await expect(chart.getByRole('status')).toHaveText('Mon · Visits: 18')
})

test('chart preserves gaps, selects values, toggles series and exposes the complete data', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/playground/#/preview/chart?lang=en')
  const chart = page.locator('.m-chart')
  // One continuous series and a second series split at a missing observation.
  await expect(chart.locator('svg path')).toHaveCount(3)
  const marker = await chart.locator('svg circle').first().boundingBox()
  expect(marker).not.toBeNull()
  expect(Math.abs(marker!.width - marker!.height)).toBeLessThan(1)
  await chart.getByRole('button', { name: 'Day Day', exact: true }).click()
  await page.getByRole('option', { name: 'Wed', exact: true }).click()
  await chart.getByRole('button', { name: 'Metric Visits', exact: true }).click()
  await page.getByRole('option', { name: 'Saves', exact: true }).click()
  await expect(chart.getByRole('status')).toHaveText('Wed · Saves: No value')
  await chart.getByRole('button', { name: 'Saves', exact: true }).click()
  await expect(chart.locator('svg path')).toHaveCount(1)
  await chart.getByRole('button', { name: 'Show data' }).click()
  await expect(chart.getByRole('listitem')).toHaveCount(7)
  await expect(chart.getByRole('listitem').filter({ hasText: 'Wed' })).toContainText(
    'Saves: No value',
  )
  await page.getByRole('radio', { name: 'Bars', exact: true }).click()
  await expect(chart.locator('svg path')).toHaveCount(0)
  await chart.getByRole('button', { name: 'Visits', exact: true }).click()
  await expect(chart.getByText('No chart data', { exact: true })).toBeVisible()
  await chart.getByRole('button', { name: 'Saves', exact: true }).click()
  await page.getByRole('button', { name: 'Another week', exact: true }).click()
  await expect(chart.getByRole('listitem').filter({ hasText: 'Wed' })).toContainText('Saves: 20')
  expect(errors).toEqual([])
})

for (const theme of ['mavis', 'midnight']) {
  test(`six previews keep accessible controls and fit narrow layouts: ${theme}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 320, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    for (const name of [
      'command-palette',
      'navigation-rail',
      'breadcrumb',
      'tooltip',
      'timeline',
      'chart',
    ]) {
      await page.goto(`/playground/#/preview/${name}?lang=en&theme=${theme}`)
      await expect(page.locator('[data-testid="component-preview"]')).toBeVisible()
      const result = await new AxeBuilder({ page })
        .include('[data-testid="component-preview"]')
        .analyze()
      expect(result.violations, name).toEqual([])
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        name,
      ).toBe(true)
      mkdirSync('artifacts/wayfinding/web', { recursive: true })
      await page.screenshot({
        path: `artifacts/wayfinding/web/${info.project.name}-${theme}-${name}.png`,
        fullPage: true,
      })
    }
    expect(errors).toEqual([])
  })
}
