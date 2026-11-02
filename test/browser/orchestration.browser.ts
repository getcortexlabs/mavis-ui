import { expect, test } from '@playwright/test'
const route = '/playground/#/showcase/tempo?lang=en'
const state = (page: import('@playwright/test').Page) =>
  page.locator('#tempo-card').evaluate((el) => {
    const style = getComputedStyle(el),
      matrix = new DOMMatrixReadOnly(style.transform)
    return {
      x: matrix.m41,
      y: matrix.m42,
      scale: Math.hypot(matrix.a, matrix.b),
      opacity: Number(style.opacity),
    }
  })

test('animates scalar keyframes, seeks the same progress clock, adds a layer and preserves press', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(route)
  await page.locator('#tempo-values').click()
  await page.locator('#tempo-pause').click()
  await page.locator('#tempo-seek').click()
  await expect.poll(async () => (await state(page)).opacity).toBeCloseTo(0.775, 2)
  const initial = await state(page)
  await page.locator('#tempo-accent').click()
  await expect.poll(async () => (await state(page)).x).toBeCloseTo(initial.x + 9, 0)
  await page.locator('#tempo-remove-accent').click()
  await expect.poll(async () => (await state(page)).x).toBeCloseTo(initial.x, 0)
  const card = page.locator('#tempo-card')
  await card.scrollIntoViewIfNeeded()
  const box = (await card.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await expect.poll(async () => (await state(page)).scale).toBeCloseTo(initial.scale * 0.97, 2)
  await page.mouse.up()
  await expect.poll(async () => (await state(page)).scale).toBeCloseTo(initial.scale, 2)
  await page.locator('#tempo-resume').click()
  await expect.poll(async () => (await state(page)).opacity).toBeCloseTo(1, 2)
  expect(errors).toEqual([])
})

test('pauses future timeline callbacks and cancels them on stop', async ({ page }) => {
  await page.goto(route)
  await page.locator('#tempo-timeline').click()
  await page.locator('#tempo-pause').click()
  const position = await state(page)
  await page.waitForTimeout(1200)
  await expect(page.locator('#tempo-checkpoints')).toHaveText('0 moments along the way')
  expect((await state(page)).x).toBeCloseTo(position.x, 1)
  await page.locator('#tempo-resume').click()
  await expect(page.locator('#tempo-checkpoints')).toHaveText('1 moments along the way')
  await page.locator('#tempo-timeline').click()
  await page.locator('#tempo-stop').click()
  await page.waitForTimeout(1200)
  await expect(page.locator('#tempo-checkpoints')).toHaveText('1 moments along the way')
})

test('retains a requested state through paused replacement and supports projected decay', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(route)
  await page.locator('#tempo-working').click()
  await page.locator('#tempo-pause').click()
  await page.locator('#tempo-replace').click()
  await expect(page.locator('#tempo-card')).toContainText('TEMPO / 02')
  const paused = await state(page)
  await page.waitForTimeout(150)
  expect((await state(page)).y).toBeCloseTo(paused.y, 1)
  await page.locator('#tempo-resume').click()
  await expect.poll(async () => (await state(page)).y).toBeCloseTo(-14, 0)
  await page.locator('#tempo-success').click()
  await expect.poll(async () => (await state(page)).scale).toBeCloseTo(1.07, 2)
  await page.locator('#tempo-fling').click()
  await expect.poll(async () => (await state(page)).x).toBeCloseTo(40, 0)
  await page.locator('#tempo-mount').click()
  await expect(page.locator('#tempo-card')).toHaveCount(0)
  await page.locator('#tempo-mount').click()
  await expect(page.locator('#tempo-card')).toHaveCount(1)
  expect(errors).toEqual([])
})

test('owns SVG drawing and paint in the same region as component press', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/playground/#/showcase/connections?lang=en')
  const path = page.locator('#motion-path')
  await page.locator('#path-reverse').click()
  await page.locator('#path-pause').click()
  await page.locator('#path-seek').click()
  await expect
    .poll(() => path.evaluate((el) => parseFloat(getComputedStyle(el).strokeDashoffset)))
    .toBeCloseTo(50, 0)
  await page.locator('#path-geometry').click()
  await expect
    .poll(() => path.evaluate((el) => parseFloat(getComputedStyle(el).strokeDashoffset)))
    .toBeCloseTo(50, 0)
  await page.locator('#path-draw').click()
  await expect
    .poll(() => path.evaluate((el) => parseFloat(getComputedStyle(el).strokeDashoffset)))
    .toBeCloseTo(0, 0)
  await page.locator('#path-paint').click()
  await page.locator('#web-motion-card').click()
  await expect(page.locator('#web-motion-clicks')).toHaveText('1 connections')
  await page.getByRole('link', { name: '← Showcase' }).click()
  expect(errors).toEqual([])
})

test('settles scalar/state/decay and SVG under reduced motion without losing controls', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(route)
  await page.locator('#tempo-success').click()
  await expect.poll(async () => (await state(page)).scale).toBeCloseTo(1.07, 2)
  await page.locator('#tempo-fling').click()
  await expect.poll(async () => (await state(page)).x).toBeCloseTo(40, 0)
  await page.goto('/playground/#/showcase/connections?lang=en')
  await page.locator('#path-reverse').click()
  await expect
    .poll(() =>
      page
        .locator('#motion-path')
        .evaluate((el) => parseFloat(getComputedStyle(el).strokeDashoffset)),
    )
    .toBeCloseTo(100, 0)
})
