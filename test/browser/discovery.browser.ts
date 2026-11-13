import { test, expect } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import AxeBuilder from '@axe-core/playwright'

test('table sorts through its owner and preserves selected rows between pages', async ({
  page,
}) => {
  await page.goto('/playground/#/preview/data-table?lang=en')
  await page.getByRole('checkbox', { name: 'Select Atlas', exact: true }).check()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.getByRole('checkbox', { name: 'Select Drift', exact: true }).check()
  await expect(page.locator('#table-selection')).toHaveText('atlas, drift')
  await page.getByRole('button', { name: 'Previous', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'Select Atlas', exact: true })).toBeChecked()
  await page.getByRole('button', { name: 'Members', exact: true }).click()
  await expect(page.getByRole('columnheader', { name: 'Members' })).toHaveAttribute(
    'aria-sort',
    'ascending',
  )
  await page.getByRole('textbox', { name: 'Find a collection' }).fill('missing')
  await expect(page.getByRole('status').filter({ hasText: 'No results' })).toBeVisible()
})
test('carousel changes by buttons, keyboard and swipe, with no idle autoplay', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/playground/#/preview/carousel?lang=en')
  await page.getByRole('button', { name: 'Next slide', exact: true }).click()
  await expect(page.locator('#carousel-value')).toHaveText('collect')
  const stage = page.locator('.m-carousel [tabindex="0"]')
  await stage.focus()
  await stage.press('ArrowRight')
  await expect(page.locator('#carousel-value')).toHaveText('share')
  await expect(page.getByRole('button', { name: 'Next slide', exact: true })).toBeDisabled()
  // The entering slide gets its gesture with its entrance, a frame after it is in the document.
  // A press before that frame belongs to no slide, so wait for the entrance to start and end.
  const entering = () =>
    stage.evaluate((element) => element.getAnimations({ subtree: true }).length)
  await expect.poll(entering, { intervals: [20] }).toBeGreaterThan(0)
  await expect.poll(entering).toBe(0)
  const rect = (await stage.boundingBox())!
  await page.mouse.move(rect.x + 40, rect.y + 80)
  await page.mouse.down()
  await page.mouse.move(rect.x + 180, rect.y + 80, { steps: 8 })
  await page.mouse.up()
  await expect(page.locator('#carousel-value')).toHaveText('collect')
  await expect(page.getByText('Keep what moves you.', { exact: true })).toBeVisible()
  expect(errors).toEqual([])
})
test('range endpoints cannot cross and disabled state prevents edits', async ({ page }) => {
  await page.goto('/playground/#/preview/range-slider?lang=en')
  const lower = page.getByRole('slider', { name: 'Nightly budget: Minimum', exact: true })
  const upper = page.getByRole('slider', { name: 'Nightly budget: Maximum', exact: true })
  await lower.focus()
  await lower.press('End')
  await expect(page.locator('#range-value')).toHaveText('650 – 650')
  await upper.focus()
  await upper.press('Home')
  await expect(upper).toHaveAttribute('aria-valuenow', '650')
  await page.getByRole('switch', { name: 'Lock budget', exact: true }).click()
  await expect(lower).toBeDisabled()
  await expect(upper).toBeDisabled()
})
test('calendar rejects an unavailable interval and retains its first endpoint', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/playground/#/preview/calendar?lang=en')
  await page.locator('[data-date="2026-11-17"]').click()
  await page.locator('[data-date="2026-11-19"]').click()
  await expect(page.getByRole('alert')).toHaveText('This range includes an unavailable date.')
  await expect(page.locator('#calendar-value')).toHaveText('2026-11-17 / …')
  await page.locator('[data-date="2026-11-16"]').click()
  await expect(page.locator('#calendar-value')).toHaveText('2026-11-16 / 2026-11-17')
  await expect(page.locator('[data-date="2026-11-16"] > span[aria-hidden]')).toHaveCSS(
    'opacity',
    '1',
  )
  await expect(page.locator('[data-date="2026-11-15"] > span[aria-hidden]')).toHaveCSS(
    'opacity',
    '0',
  )
  expect(errors).toEqual([])
})
test('rating supports fractional keyboard changes and clearing', async ({ page }) => {
  await page.goto('/playground/#/preview/rating?lang=en')
  const slider = page.getByRole('slider', { name: 'How was your stay?', exact: true })
  await slider.focus()
  await slider.press('ArrowRight')
  await expect(page.locator('#rating-value')).toHaveText('4')
  await page.getByRole('button', { name: 'Clear rating', exact: true }).click()
  await expect(page.locator('#rating-value')).toHaveText('0')
})
test('tree keyboard traversal skips unavailable nodes and requests lazy children', async ({
  page,
}) => {
  await page.goto('/playground/#/preview/tree-view?lang=en')
  const brand = page.getByRole('treeitem', { name: 'Brand system', exact: true })
  await brand.focus()
  await brand.press('ArrowDown')
  await expect(page.getByRole('treeitem', { name: 'Website', exact: true })).toBeFocused()
  await page.keyboard.press('ArrowDown')
  const research = page.getByRole('treeitem', { name: 'Research', exact: true })
  await expect(research).toBeFocused()
  await research.press('ArrowRight')
  await expect(page.getByRole('treeitem', { name: 'Interviews', exact: true })).toBeVisible()
  await research.press('ArrowRight')
  await page.keyboard.press('Enter')
  await expect(page.locator('#tree-value')).toHaveText('interviews')
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowLeft')
  await expect(research).toHaveAttribute('aria-expanded', 'false')
})
for (const [theme, width] of [
  ['mavis', 390],
  ['midnight', 320],
] as const) {
  test(`six previews satisfy accessibility and narrow layouts: ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    for (const name of [
      'data-table',
      'carousel',
      'range-slider',
      'calendar',
      'rating',
      'tree-view',
    ]) {
      await page.goto(`/playground/#/preview/${name}?lang=en&theme=${theme}`)
      await expect(page.locator('[data-testid="component-preview"]')).toBeVisible()
      mkdirSync('artifacts/discovery/web', { recursive: true })
      await page.screenshot({
        path: `artifacts/discovery/web/${test.info().project.name}-${theme}-${name}.png`,
        fullPage: true,
      })
      const result = await new AxeBuilder({ page })
        .include('[data-testid="component-preview"]')
        .analyze()
      expect(result.violations, name).toEqual([])
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
        name,
      ).toBe(true)
    }
  })
}
