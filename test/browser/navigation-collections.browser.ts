import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('menu owns keyboard traversal, skips disabled actions and restores its trigger', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/playground/#/preview/menu?lang=en')
  const trigger = page.getByRole('button', { name: 'Actions', exact: true })
  await trigger.focus()
  await trigger.press('Enter')
  const first = page.getByRole('menuitem', { name: 'Edit collection' })
  await expect(first).toBeFocused()
  await first.press('ArrowDown')
  await expect(page.getByRole('menuitem', { name: 'Duplicate' })).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('menuitem', { name: 'Remove' })).toBeFocused()
  await page.keyboard.press('Home')
  await expect(first).toBeFocused()
  await page.keyboard.press('d')
  await page.keyboard.press('Enter')
  await expect(page.locator('#menu-selection')).toHaveText('duplicate')
  await expect(page.getByRole('menu')).toHaveCount(0)
  await expect(trigger).toBeFocused()
  await trigger.press('ArrowDown')
  await expect(first).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
  expect(errors).toEqual([])
})

test('popover fits the viewport, preserves drafts and closes outside without stealing focus', async ({
  page,
}) => {
  await page.goto('/playground/#/preview/popover?lang=en')
  const trigger = page.getByRole('button', { name: 'Filters', exact: true })
  await trigger.click()
  const panel = page.getByRole('dialog', { name: 'Refine the collection' })
  const search = panel.getByRole('textbox', { name: 'Search', exact: true })
  await expect(search).toBeFocused()
  await search.fill('Native')
  const bounds = await panel.boundingBox()
  expect(bounds!.x).toBeGreaterThanOrEqual(8)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390 - 8)
  await page.setViewportSize({ width: 320, height: 568 })
  await expect
    .poll(async () => {
      const rect = await panel.boundingBox()
      return rect ? rect.x + rect.width : 0
    })
    .toBeLessThanOrEqual(312)
  await panel.getByRole('button', { name: 'Apply filters' }).click()
  await expect(trigger).toBeFocused()
  await trigger.click()
  await expect(search).toHaveValue('Native')
  await page.getByRole('heading', { name: 'A little more context', exact: true }).click()
  await expect(panel).toHaveCount(0)
  await trigger.click()
  await search.press('Escape')
  await expect(trigger).toBeFocused()
})

test('time drafts, bounds, provisional picker and canonical submission agree', async ({ page }) => {
  await page.goto('/playground/#/preview/time-picker?lang=en')
  const field = page.getByRole('textbox', { name: 'Meeting time', exact: true })
  await expect(field).toHaveValue('9:30 AM')
  await field.fill('10:')
  await expect(page.locator('#time-value')).toHaveText('09:30')
  await field.fill('10:15 AM')
  await expect(page.locator('#time-value')).toHaveText('10:15')
  await field.fill('10:07 AM')
  await expect(page.locator('#time-value')).toHaveText('10:15')
  await expect(field).toHaveAttribute('aria-invalid', 'true')
  await page.getByRole('button', { name: 'Choose time', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Meeting time', exact: true })
  await dialog.getByRole('combobox', { name: 'Hour', exact: true }).selectOption({ label: '03' })
  await dialog.getByRole('combobox', { name: 'Minute', exact: true }).selectOption({ label: '30' })
  await dialog.getByRole('combobox', { name: 'Period', exact: true }).selectOption({ label: 'PM' })
  await expect(page.locator('#time-value')).toHaveText('10:15')
  await dialog.getByRole('button', { name: 'Apply', exact: true }).click()
  await expect(field).toHaveValue('3:30 PM')
  await expect(page.locator('input[name="meeting-time"]')).toHaveValue('15:30')
  await expect(page.getByRole('button', { name: 'Choose time', exact: true })).toBeFocused()
  await page.getByRole('button', { name: 'Choose time', exact: true }).click()
  await dialog.getByRole('combobox', { name: 'Hour', exact: true }).selectOption({ label: '11' })
  await expect(dialog.getByRole('button', { name: 'Apply', exact: true })).toBeDisabled()
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(field).toHaveValue('3:30 PM')
})

test('navigation bars expose app-owned destinations and actions', async ({ page }) => {
  await page.goto('/playground/#/preview/tab-bar?lang=en')
  const navigation = page.getByRole('navigation', { name: 'Main navigation' })
  await expect(navigation.getByRole('link', { name: 'Home', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  const saved = navigation.getByRole('link', { name: 'Saved 3', exact: true })
  await expect(saved).toHaveAttribute('href', '/saved')
  await saved.click()
  await expect(saved).toHaveAttribute('aria-current', 'page')
  await expect(page.locator('#tab-bar-current')).toHaveText('saved')
  await page.goto('/playground/#/preview/app-bar?lang=en')
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await expect(page.locator('#app-bar-visits')).toHaveText('Actions: 1')
  await page.getByRole('button', { name: 'New collection', exact: true }).click()
  await expect(page.locator('#app-bar-visits')).toHaveText('Actions: 2')
})

test('virtualized rows stay bounded and retain logical state across recycling and reorder', async ({
  page,
}) => {
  await page.goto('/playground/#/preview/virtual-list?lang=en')
  const list = page.getByRole('region', { name: 'A thousand collections' })
  await expect(list.getByRole('listitem')).toHaveCount(8)
  const first = list.getByRole('button', { name: 'Save 1', exact: true })
  await first.click()
  await first.focus()
  await list.evaluate((element) => {
    element.scrollTop = 36000
  })
  await expect(first).toBeFocused()
  await expect.poll(() => list.getByRole('listitem').count()).toBeLessThanOrEqual(12)
  await page.getByRole('button', { name: 'Last item', exact: true }).click()
  await expect(list.getByText('Collection 1000', { exact: true })).toBeVisible()
  await expect(first).toHaveCount(0)
  await page.getByRole('button', { name: 'Reverse', exact: true }).click()
  await expect(list.getByText('Collection 996', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Last item', exact: true }).click()
  await expect(list.getByText('Collection 1', { exact: true })).toBeVisible()
  await expect(first).toContainText('Saved')
  expect(await list.getByRole('listitem').count()).toBeLessThanOrEqual(11)
})

test('new component previews expose accessible controls', async ({ page }) => {
  for (const component of [
    'popover',
    'menu',
    'app-bar',
    'tab-bar',
    'time-picker',
    'virtual-list',
  ]) {
    await page.goto(`/playground/#/preview/${component}?lang=en`)
    const result = await new AxeBuilder({ page })
      .include('[data-testid="component-preview"]')
      .analyze()
    expect(result.violations, component).toEqual([])
  }
})
