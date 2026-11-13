import { test, expect } from '@playwright/test'

test('keyed data changes preserve a 200-row viewport, drafts and bounded realization', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/playground/#/checks/virtual-changes')
  const list = page.locator('#virtual-changes-list')
  await page.locator('#virtual-middle').click()
  await list.evaluate((node) => {
    node.scrollTop += 17
  })
  await page.getByRole('textbox', { name: 'Draft 50', exact: true }).fill('kept by key')
  const anchor = async () =>
    list.evaluate((node) => {
      const rows = Array.from(node.querySelectorAll<HTMLElement>('[data-m-list-key]'))
      const top = node.getBoundingClientRect().top
      const row = rows.find((row) => row.getBoundingClientRect().bottom > top)
      return {
        key: row?.dataset.mListKey,
        offset: row ? top - row.getBoundingClientRect().top : 0,
        count: rows.length,
      }
    })
  await expect.poll(async () => (await anchor()).key).toBe('n:50')
  const before = await anchor()
  for (const action of ['virtual-prepend', 'virtual-reverse', 'virtual-filter']) {
    await page.locator(`#${action}`).click()
    await expect.poll(async () => (await anchor()).key).toBe(before.key)
    await expect.poll(async () => Math.abs((await anchor()).offset - before.offset)).toBeLessThan(1)
    await expect(page.getByRole('textbox', { name: 'Draft 50', exact: true })).toHaveValue(
      'kept by key',
    )
    expect((await anchor()).count).toBeLessThanOrEqual(12)
  }
  await page.locator('#virtual-remove').click()
  await expect.poll(async () => (await anchor()).key).toBe('n:48')
  await page.locator('#virtual-last').click()
  await expect(page.getByRole('textbox', { name: 'Draft 0', exact: true })).toBeVisible()
  await page.locator('#virtual-toggle-motion').click()
  await page.locator('#virtual-reverse').click()
  await expect(page.getByRole('textbox', { name: 'Draft 0', exact: true })).toBeVisible()
  await page.locator('#virtual-hide').click()
  await expect(list).toHaveCount(0)
  await page.locator('#virtual-hide').click()
  await expect(list).toBeVisible()
  expect(errors).toEqual([])
})

test('reduced motion commits keyed changes without leaving row transforms', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/playground/#/checks/virtual-changes')
  const list = page.locator('#virtual-changes-list')
  await page.locator('#virtual-middle').click()
  await page.locator('#virtual-prepend').click()
  await page.locator('#virtual-reverse').click()
  await expect(page.getByRole('textbox', { name: 'Draft 50', exact: true })).toBeVisible()
  await expect
    .poll(() =>
      list.locator('[data-m-list-key]').evaluateAll((rows) =>
        rows.every((row) => {
          const matrix = new DOMMatrixReadOnly(getComputedStyle(row).transform)
          return matrix.m41 === 0 && matrix.m42 === 0
        }),
      ),
    )
    .toBe(true)
})
