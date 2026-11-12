import { expect, test, type Locator, type Page } from '@playwright/test'

const preview = '/playground/#/preview/kanban?lang=en'
const card = (page: Page, id: string) => page.locator(`[data-kanban-card="${id}"]`)
const grip = (page: Page, id: string) => page.locator(`[data-kanban-handle="${id}"]`)
const column = (page: Page, id: string) => page.locator(`[data-kanban-column="${id}"]`)
const order = (page: Page) => page.locator('#kanban-order')
const start = 'identity:ideas,editorial:ideas,web:making,print:done'

async function center(locator: Locator) {
  const box = (await locator.boundingBox())!
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}
const offset = (page: Page, id: string) =>
  card(page, id)
    .locator('> .m-box')
    .evaluate((element) => {
      const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform)
      return { x: matrix.m41, y: matrix.m42, scale: matrix.a }
    })
const resting = (page: Page, id: string) =>
  expect
    .poll(async () => {
      const { x, y, scale } = await offset(page, id)
      return Math.abs(x) + Math.abs(y) + Math.abs(scale - 1)
    })
    .toBeLessThan(0.01)
async function open(page: Page, url = preview, height = 1100) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.setViewportSize({ width: 1440, height })
  await page.goto(url)
  await grip(page, 'identity').scrollIntoViewIfNeeded()
  await page.evaluate(() => document.fonts.ready)
  await settled(page)
  return errors
}
async function settled(page: Page) {
  await expect(order(page)).toHaveText(start)
  await expect
    .poll(() =>
      page.locator('.m-kanban').evaluate((board) => board.getAnimations({ subtree: true }).length),
    )
    .toBe(0)
}
async function take(page: Page, id: string) {
  const from = await center(grip(page, id))
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  return from
}

test('only the grip drags, and the card stays under the pointer while a gap opens', async ({
  page,
}) => {
  const errors = await open(page)
  const body = await center(card(page, 'identity').getByText('Botanical identity'))
  await page.mouse.move(body.x, body.y)
  await page.mouse.down()
  await page.mouse.move(body.x + 90, body.y + 30, { steps: 6 })
  expect(await offset(page, 'identity')).toEqual({ x: 0, y: 0, scale: 1 })
  await page.mouse.up()

  await take(page, 'print')
  const between = await center(grip(page, 'editorial'))
  await page.mouse.move(between.x, between.y - 30, { steps: 14 })
  const gap = page.locator('[data-kanban-gap]')
  await expect
    .poll(() =>
      page.evaluate(() => {
        const element = document.querySelector('[data-kanban-gap]')
        return {
          column: element?.closest('[data-kanban-column]')?.getAttribute('data-kanban-column'),
          next: element?.nextElementSibling?.getAttribute('data-kanban-card'),
        }
      }),
    )
    .toEqual({ column: 'ideas', next: 'editorial' })
  await expect(gap).toHaveCount(1)
  await page.mouse.move(between.x, between.y - 28)
  await expect
    .poll(async () => {
      const held = await center(grip(page, 'print'))
      return Math.hypot(held.x - between.x, held.y - (between.y - 28))
    })
    .toBeLessThan(6)
  await expect.poll(async () => (await offset(page, 'print')).scale).toBeCloseTo(1.02, 2)
  await page.mouse.up()
  await expect(order(page)).toHaveText('identity:ideas,print:ideas,editorial:ideas,web:making')
  await expect(page.locator('#kanban-result')).toHaveText('print:ideas')
  await expect(gap).toHaveCount(0)
  await resting(page, 'print')
  await expect(grip(page, 'print')).toBeFocused()
  expect(errors).toEqual([])
})

test('the room below a short column accepts a drop, and further down does not', async ({
  page,
}) => {
  const errors = await open(page)
  const done = (await column(page, 'done').boundingBox())!
  await take(page, 'identity')
  await page.mouse.move(done.x + done.width / 2, done.y + done.height + 130, { steps: 14 })
  await expect(page.locator('[data-kanban-gap]')).toHaveCount(0)
  await page.mouse.up()
  await expect(order(page)).toHaveText(start)
  await resting(page, 'identity')

  const body = (await card(page, 'identity').boundingBox())!
  const from = await take(page, 'identity')
  const lift = from.y - (body.y + body.height / 2)
  await page.mouse.move(done.x + done.width / 2, done.y + done.height + 40 + lift, { steps: 14 })
  await expect(page.locator('[data-kanban-gap]')).toHaveCount(1)
  await page.mouse.up()
  await expect(page.locator('#kanban-result')).toHaveText('identity:done')
  await resting(page, 'identity')
  expect(errors).toEqual([])
})

test('a column at capacity rejects the card, which returns to its place', async ({ page }) => {
  const errors = await open(page)
  const making = await center(column(page, 'making'))
  await take(page, 'identity')
  await page.mouse.move(making.x, making.y, { steps: 12 })
  await page.mouse.up()
  await expect(page.locator('#kanban-result')).toHaveText('identity:making')
  const full = await order(page).textContent()

  await take(page, 'editorial')
  await page.mouse.move(making.x, making.y, { steps: 12 })
  await expect.poll(async () => (await offset(page, 'editorial')).x).toBeGreaterThan(40)
  await expect(page.locator('[data-kanban-gap]')).toHaveCount(0)
  await page.mouse.up()
  await expect(order(page)).toHaveText(full!)
  await resting(page, 'editorial')
  expect(errors).toEqual([])
})

const interrupts = {
  Escape: (page: Page) => page.keyboard.press('Escape'),
  'a window that loses focus': (page: Page) =>
    page.evaluate(() => window.dispatchEvent(new Event('blur'))),
  scrolling: (page: Page) => page.mouse.wheel(0, 60),
  'a locked board': (page: Page) =>
    page.getByRole('switch', { name: 'Lock board' }).evaluate((el: HTMLElement) => el.click()),
}
for (const [name, interrupt] of Object.entries(interrupts))
  test(`${name} cancels the drag and the card returns`, async ({ page }) => {
    const errors = await open(page, preview, name === 'scrolling' ? 620 : 1100)
    await take(page, 'identity')
    const target = await center(column(page, 'done'))
    await page.mouse.move(target.x, target.y, { steps: 10 })
    await expect(page.locator('[data-kanban-gap]')).toHaveCount(1)
    await expect(grip(page, 'identity')).toBeFocused()
    await interrupt(page)
    await expect(page.locator('[data-kanban-gap]')).toHaveCount(0)
    await resting(page, 'identity')
    await page.mouse.up()
    await expect(order(page)).toHaveText(start)
    if (name === 'a locked board') {
      await expect(grip(page, 'identity')).toBeDisabled()
      await page.getByRole('switch', { name: 'Lock board' }).click()
    }
    await grip(page, 'identity').scrollIntoViewIfNeeded()
    await take(page, 'identity')
    const again = await center(column(page, 'done'))
    await page.mouse.move(again.x, again.y, { steps: 10 })
    await page.mouse.up()
    await expect(page.locator('#kanban-result')).toHaveText('identity:done')
    expect(errors).toEqual([])
  })

for (const mode of ['reduced motion', 'animation off'] as const)
  test(`a rejected drop returns at once with ${mode}`, async ({ page }) => {
    if (mode === 'reduced motion') await page.emulateMedia({ reducedMotion: 'reduce' })
    const errors = await open(page)
    if (mode === 'animation off') await page.getByRole('switch', { name: 'Animate layout' }).click()
    const from = await take(page, 'identity')
    await page.mouse.move(from.x + 40, from.y - 160, { steps: 8 })
    await expect.poll(async () => (await offset(page, 'identity')).y).toBeLessThan(-100)
    await page.mouse.up()
    await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => done(null))))
    expect(await offset(page, 'identity')).toEqual({ x: 0, y: 0, scale: 1 })
    await expect(order(page)).toHaveText(start)

    const done = await center(column(page, 'done'))
    await take(page, 'identity')
    await page.mouse.move(done.x, done.y, { steps: 10 })
    await page.mouse.up()
    await expect(page.locator('#kanban-result')).toHaveText('identity:done')
    await resting(page, 'identity')
    expect(errors).toEqual([])
  })

test('leaving the board in the middle of a drag leaves nothing behind', async ({ page }) => {
  const errors = await open(page, '/playground/#/checks/dashboard')
  const done = await center(column(page, 'done'))
  await take(page, 'identity')
  await page.mouse.move(done.x, done.y, { steps: 10 })
  await expect(page.locator('[data-kanban-gap]')).toHaveCount(1)
  await page.locator('#dashboard-next').evaluate((el: HTMLElement) => el.click())
  await expect(page.locator('[data-kanban-card]')).toHaveCount(0)
  await page.mouse.up()
  for (let step = 0; step < 5; step++)
    await page.locator('#dashboard-next').evaluate((el: HTMLElement) => el.click())
  await grip(page, 'identity').scrollIntoViewIfNeeded()
  await settled(page)
  await take(page, 'identity')
  const target = await center(column(page, 'done'))
  await page.mouse.move(target.x, target.y, { steps: 10 })
  await page.mouse.up()
  await expect(page.locator('#kanban-result')).toHaveText('identity:done')
  expect(errors).toEqual([])
})
