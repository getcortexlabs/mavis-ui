import { expect, test, type Page } from '@playwright/test'

const copies = (page: Page) => page.locator('[data-jolt-layout-exit]')
const rows = (page: Page) => page.locator('#exit-list > .m-card')
const order = (page: Page) => rows(page).evaluateAll((elements) => elements.map((el) => el.id))
async function open(page: Page) {
  await page.goto('/playground/#/checks/portable')
  await expect(rows(page)).toHaveCount(4)
  await page.locator('#exit-list').scrollIntoViewIfNeeded()
}

test('uses a static exit while one Vue update inserts, removes, reorders and resizes keyed cards', async ({
  page,
}) => {
  await open(page)
  const survivor = await page.locator('#exit-card-1').elementHandle()
  const before = await page.locator('#exit-card-1').boundingBox()
  await page.locator('#exit-mix').click()
  await expect
    .poll(() => order(page))
    .toEqual(['exit-card-5', 'exit-card-4', 'exit-card-3', 'exit-card-1'])
  await expect(copies(page)).toHaveCount(1)
  await expect(copies(page)).toContainText('Idea 2')
  // The original leaves the live collection immediately; the copy never steals pointer input.
  await expect(page.locator('#exit-card-2')).toHaveCount(0)
  await expect(copies(page)).toHaveCSS('pointer-events', 'none')
  expect(
    await survivor!.evaluate((element) => element === document.getElementById('exit-card-1')),
  ).toBe(true)
  await expect(page.locator('#exit-status')).toHaveText('complete')
  await expect(copies(page)).toHaveCount(0)
  expect((await page.locator('#exit-card-1').boundingBox())!.height).toBeGreaterThan(before!.height)
})

test('retires old copies on reinsertion and repeated removal without replacing surviving rows', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await open(page)
  const survivor = await page.locator('#exit-card-3').elementHandle()
  await page.locator('#exit-mix').click()
  await expect(copies(page)).toContainText('Idea 2')
  await page.locator('#exit-restore').click()
  await expect
    .poll(() => order(page))
    .toEqual(['exit-card-1', 'exit-card-2', 'exit-card-3', 'exit-card-4'])
  await expect(copies(page)).toHaveCount(1)
  await expect(copies(page)).toContainText('Idea 5')
  await page.locator('#exit-remove').click()
  await expect(rows(page).first()).toHaveAttribute('id', 'exit-card-2')
  await page.locator('#exit-remove').click()
  await expect(rows(page).first()).toHaveAttribute('id', 'exit-card-3')
  await expect(copies(page)).toHaveCount(1)
  await expect(copies(page)).toContainText('Idea 2')
  await page.locator('#exit-stop').click()
  await expect(copies(page)).toHaveCount(0)
  await expect(page.locator('#exit-status')).toHaveText('cancelled')
  expect(
    await survivor!.evaluate((element) => element === document.getElementById('exit-card-3')),
  ).toBe(true)
  expect(errors).toEqual([])
})

test('falls back to immediate removal when the shared pixel budget cannot hold a copy', async ({
  page,
}) => {
  await open(page)
  await page.locator('#exit-budget').click()
  await page.locator('#exit-remove').click()
  await expect(rows(page)).toHaveCount(3)
  await expect(page.locator('#exit-status')).toHaveText('complete')
  await expect(copies(page)).toHaveCount(0)
  await page.locator('#exit-budget').click()
  await page.locator('#exit-remove').click()
  await expect(copies(page)).toHaveCount(1)
  await page.locator('#exit-stop').click()
  await expect(copies(page)).toHaveCount(0)
})

test('releases copies when motion is reduced, the region is detached or the route leaves', async ({
  page,
}) => {
  await open(page)
  await page.locator('#exit-remove').click()
  await expect(copies(page)).toHaveCount(1)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(copies(page)).toHaveCount(0)
  await page.locator('#exit-remove').click()
  await expect(rows(page)).toHaveCount(2)
  await expect(page.locator('#exit-status')).toHaveText('complete')
  await expect(copies(page)).toHaveCount(0)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.locator('#exit-remove').click()
  await expect(copies(page)).toHaveCount(1)
  await page.locator('#exit-toggle').click()
  await expect(page.locator('#exit-list')).toHaveCount(0)
  await expect(copies(page)).toHaveCount(0)
  await page.locator('#exit-toggle').click()
  await expect(rows(page)).toHaveCount(1)
  await page.locator('#exit-restore').click()
  await expect(page.locator('#exit-status')).toHaveText('complete')
  await page.locator('#exit-remove').click()
  await expect(copies(page)).toHaveCount(1)
  // Change the SPA route, so cleanup is checked without destroying the document itself.
  await page.evaluate(() => {
    location.hash = '#/components/button'
  })
  await expect(page.locator('#exit-list')).toHaveCount(0)
  await expect(copies(page)).toHaveCount(0)
})
