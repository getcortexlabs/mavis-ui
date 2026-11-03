import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/playground/#/checks/portable')
})

test('selects Web on a mobile viewport and keeps keyed drafts through filtering and reordering', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await expect(page.locator('#portable-web')).toBeVisible()
  await expect(page.locator('#portable-native')).toHaveCount(0)
  await expect(page.locator('#portable-fallback')).toBeVisible()
  await page.getByLabel('Draft 1', { exact: true }).fill('Retained draft')
  const input = await page.getByLabel('Draft 1', { exact: true }).elementHandle()
  await page.getByRole('button', { name: 'Reverse list', exact: true }).click()
  await expect(page.locator('#portable-list-status')).toHaveText('complete')
  await expect(page.locator('#portable-list > .m-card').first()).toHaveAttribute(
    'id',
    'portable-row-4',
  )
  await page.getByRole('button', { name: 'Filter list', exact: true }).click()
  await expect(page.getByLabel('Draft 2', { exact: true })).toHaveCount(0)
  await expect(page.getByLabel('Draft 1', { exact: true })).toHaveValue('Retained draft')
  expect(await input!.evaluate((element) => element.isConnected)).toBe(true)
  expect(errors).toEqual([])
})

test('derives scroll progress from section layout and refreshes after resizing', async ({
  page,
}) => {
  const source = page.locator('main.m-screen')
  const artwork = page.locator('#portable-artwork')
  const y = () =>
    artwork.evaluate((node) => new DOMMatrixReadOnly(getComputedStyle(node).transform).m42)
  await source.evaluate((node) => {
    const section = document.getElementById('portable-section')!
    node.scrollTop = section.offsetTop
  })
  await expect.poll(y).toBeLessThan(-5)
  const before = await y()
  await page.getByRole('button', { name: 'Grow section', exact: true }).click()
  await expect.poll(y).not.toBe(before)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect.poll(y).toBeCloseTo(-60, 0)
})

test('keeps guards authoritative and restores a keyed trigger after browser back', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.getByRole('link', { name: 'Try blocked route', exact: true }).click()
  await expect(page).toHaveURL(/#\/checks\/portable$/)
  const trigger = page.locator('#portable-details')
  await trigger.focus()
  await trigger.press('Enter')
  await expect(page.getByRole('heading', { name: 'Shared detail' })).toBeVisible()
  await expect(page.locator('#portable-heading')).toBeFocused()
  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Shared platform checks' })).toBeVisible()
  await expect(page.locator('#portable-details')).toBeFocused()
  expect(errors).toEqual([])
})
