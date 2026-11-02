import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('form summary focuses public handles without replacing the current editor', async ({
  page,
}) => {
  await page.goto('/playground/#/checks/workflows')
  const name = page.getByRole('textbox', { name: 'Name', exact: true })
  await name.fill('Rafa')
  await page.getByRole('button', { name: 'Review registration', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Email', exact: true })).toBeFocused()
  await expect(name).toHaveValue('Rafa')
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('rafa@example.test')
  await page.getByRole('button', { name: 'Review registration', exact: true }).click()
  await expect(page.getByText('Ready to continue.', { exact: true })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Review your details' })).toHaveCount(0)
})

test('steps retain drafts, validate transitions and reveal unvisited fields before focus', async ({
  page,
}) => {
  await page.goto('/playground/#/checks/workflows')
  const journey = page.locator('#registration-demo')
  await journey.getByRole('button', { name: 'Finish demonstration', exact: true }).click()
  const name = journey.getByRole('textbox', { name: 'Gathering name', exact: true })
  await expect(name).toBeFocused()
  await name.fill('A shared table')
  await journey.getByRole('textbox', { name: 'Gathering date', exact: true }).fill('2026-11-21')
  await journey.getByRole('button', { name: 'Finish demonstration', exact: true }).click()
  const city = journey.getByRole('combobox', { name: 'City', exact: true })
  await expect(city).toBeFocused()
  await expect(journey.getByRole('button', { name: /^2\. Place/ })).toHaveAttribute(
    'aria-current',
    'step',
  )
  await city.fill('Rec')
  await expect(page.getByRole('option', { name: 'Recife · PE' })).toBeVisible()
  await city.press('Shift+Tab')
  await journey.getByRole('button', { name: /^1\. Gathering/ }).click()
  await expect(name).toHaveValue('A shared table')
  await expect(journey.getByRole('textbox', { name: 'Gathering date', exact: true })).toHaveValue(
    '2026-11-21',
  )
  await journey.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(city).toHaveValue('Rec')
  await expect(city).toBeFocused()
  await city.focus()
  await page.getByRole('option', { name: 'Recife · PE' }).click()
  await journey.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(journey.getByRole('button', { name: /^3\. Review/ })).toHaveAttribute(
    'aria-current',
    'step',
  )
  const finish = journey.getByRole('button', { name: 'Finish demonstration', exact: true })
  await finish.focus()
  await finish.press('Enter')
  await expect(journey.getByText('Gathering prepared', { exact: true })).toBeVisible()
  await expect(finish).toBeFocused()
})

test('pagination handles last pages, filtering and empty results while retaining controls', async ({
  page,
}) => {
  await page.goto('/playground/#/checks/workflows')
  const pages = page.getByRole('navigation', { name: 'Destination pages' })
  const last = pages.getByRole('button', { name: 'Page 5', exact: true })
  await last.focus()
  await last.press('Enter')
  await expect(last).toBeFocused()
  await expect(page.locator('#pagination-results')).toContainText('Rio de Janeiro')
  await expect(pages.getByRole('button', { name: 'Next', exact: true })).toBeDisabled()
  await expect(pages.getByRole('button', { name: 'Page 5', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(last).toBeFocused()
  await pages.getByRole('button', { name: 'Page 4', exact: true }).click()
  await expect(pages.getByRole('button', { name: 'Page 4', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  const next = pages.getByRole('button', { name: 'Next', exact: true })
  await next.focus()
  await next.press('Enter')
  await expect(next).toBeFocused()
  await expect(last).toHaveAttribute('aria-current', 'page')
  await expect(last).toBeFocused()
  await expect(pages.getByRole('status')).toHaveText('Page 5 · 1 on this page · 13 destinations')
  const owned = page.getByRole('navigation', { name: 'Parent controlled pages' })
  await owned.getByRole('button', { name: 'Page 3', exact: true }).click()
  await expect(page.locator('#pagination-attempts')).toHaveText('1')
  await expect(owned.getByRole('button', { name: 'Page 2', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  const filter = page.getByRole('textbox', { name: 'Filter destinations' })
  await filter.fill('Rec')
  await expect(page.locator('#pagination-results')).toContainText('Recife')
  await expect(pages.getByRole('button', { name: 'Page 1', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(filter).toBeFocused()
  await filter.fill('nowhere')
  await expect(pages.getByText('No destinations found')).toBeVisible()
  await expect(pages.getByRole('button', { name: /^Page / })).toHaveCount(0)
})

test('Gather stays within a narrow viewport with named controls and keyboard navigation', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await page.goto('/playground/#/showcase/gather')
  await expect(page.getByRole('heading', { name: 'Junte boas ideias.' })).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)
  expect(overflow).toBe(false)
  const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(audit.violations).toEqual([])
  await page.screenshot({ path: testInfo.outputPath('gather-320.png'), fullPage: true })
})
