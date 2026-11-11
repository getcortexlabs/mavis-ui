import { expect, test, type Locator, type Page } from '@playwright/test'

let errors: string[]
test.afterEach(() => expect(errors).toEqual([]))

const pose = (surface: Locator) =>
  surface.evaluate((el) => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(el).transform)
    return {
      x: matrix.e,
      y: matrix.f,
      rotate: (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI,
      flat: matrix.is2D,
    }
  })
const shadow = (surface: Locator) =>
  surface.evaluate((el) => {
    const css = getComputedStyle(el).boxShadow
    const lengths = (css.replace(/\([^)]*\)/g, '').match(/-?[\d.]+px/g) ?? []).map(parseFloat)
    const alpha = Number(/rgba\([^)]*,\s*([\d.]+)\)/.exec(css)?.[1] ?? 1)
    return { y: lengths[1], blur: lengths[2], alpha }
  })
const press = (page: Page, name: string) =>
  page.getByRole('button', { name, exact: true }).evaluate((el: HTMLElement) => el.click())
const open = async (
  page: Page,
  language = 'en',
  reducedMotion: 'reduce' | 'no-preference' = 'no-preference',
) => {
  errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.emulateMedia({ colorScheme: 'light', reducedMotion })
  await page.goto(`/playground/#/checks/depth?lang=${language}`)
  await expect(page.locator('#depth-courier')).toBeVisible()
}

test('follows the shared path facing its tangent and stays inside the declared bounds', async ({
  page,
}) => {
  await open(page)
  const courier = page.locator('#depth-courier')
  await expect(page.locator('#depth-bounds')).toHaveText('Stays inside 0…196 × -41.257…1.55')
  await press(page, 'Send')
  const samples: Awaited<ReturnType<typeof pose>>[] = []
  await expect
    .poll(
      async () => {
        samples.push(await pose(courier))
        return page.locator('#depth-route').textContent()
      },
      { intervals: [40] },
    )
    .toBe('Delivered')
  expect(samples.length).toBeGreaterThan(8)
  expect(Math.min(...samples.map((sample) => sample.y))).toBeLessThan(-20)
  for (const sample of samples) {
    expect(sample.x).toBeGreaterThanOrEqual(-0.5)
    expect(sample.x).toBeLessThanOrEqual(196.5)
    expect(sample.y).toBeGreaterThanOrEqual(-41.757)
    expect(sample.y).toBeLessThanOrEqual(2.05)
  }
  expect(new Set(samples.map((sample) => Math.round(sample.rotate))).size).toBeGreaterThan(4)
  const rest = await pose(courier)
  expect(rest.x).toBeCloseTo(196, 1)
  expect(rest.y).toBeCloseTo(0, 1)
  expect(rest.rotate).toBeCloseTo(69.444, 1)

  await press(page, 'Path with x')
  await expect(page.locator('#depth-failure')).toHaveText(
    'A path owns x and y. Remove them or drop the path.',
  )
  expect((await pose(courier)).x).toBeCloseTo(196, 1)
  await press(page, 'Bring back')
  await expect.poll(async () => (await pose(courier)).x).toBeCloseTo(0, 1)
  expect((await pose(courier)).rotate).toBeCloseTo(0, 1)
  await expect(page.locator('#depth-route')).toHaveText('Waiting at the start')
})

test('holds a seeked path in place until the next request replaces it', async ({ page }) => {
  await open(page)
  const courier = page.locator('#depth-courier')
  await press(page, 'Hold halfway')
  await expect(page.locator('#depth-route')).toHaveText('Held halfway')
  await expect.poll(async () => (await pose(courier)).x).toBeGreaterThan(60)
  const held = await pose(courier)
  expect(held.x).toBeLessThan(140)
  await page.waitForTimeout(300)
  expect((await pose(courier)).x).toBeCloseTo(held.x, 1)
  await press(page, 'Send')
  await expect(page.locator('#depth-route')).toHaveText('Delivered')
  expect((await pose(courier)).x).toBeCloseTo(196, 1)
})

test('rotates around both axes under the perspective its parent box declares', async ({ page }) => {
  await open(page)
  const panel = page.locator('#depth-panel')
  await expect(page.locator('#depth-stage')).toHaveCSS('perspective', '640px')
  const width = (await panel.boundingBox())!.width
  expect((await pose(panel)).flat).toBe(true)
  await press(page, 'Tilt')
  await expect.poll(async () => (await pose(panel)).flat).toBe(false)
  await expect.poll(async () => (await panel.boundingBox())!.width).toBeLessThan(width - 6)
  const depth = () =>
    panel.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m13)
  const lean = () =>
    panel.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m23)
  await expect.poll(depth).toBeCloseTo(Math.sin((22 * Math.PI) / 180), 2)
  await expect
    .poll(lean)
    .toBeCloseTo(Math.sin((14 * Math.PI) / 180) * Math.cos((22 * Math.PI) / 180), 2)
  await press(page, 'Turn the other way')
  await expect.poll(depth).toBeCloseTo(-Math.sin((22 * Math.PI) / 180), 2)
  expect(Math.abs(await lean())).toBeGreaterThan(0.2)
  await press(page, 'Level')
  await expect.poll(async () => (await panel.boundingBox())!.width).toBeCloseTo(width, 0)
})

test('moves between the theme shadows while the card rises', async ({ page }) => {
  await open(page)
  const card = page.locator('#depth-card')
  await expect(page.locator('#depth-shadow')).toHaveText('The shadow follows the card.')
  expect(await shadow(card)).toEqual({ y: 2, blur: 6, alpha: 0.1 })
  await press(page, 'Lift')
  await expect.poll(async () => (await shadow(card)).blur).toBeCloseTo(40, 0)
  await expect.poll(async () => (await shadow(card)).y).toBeCloseTo(16, 0)
  await expect.poll(async () => (await shadow(card)).alpha).toBeCloseTo(0.2, 2)
  await expect.poll(async () => (await pose(card)).y).toBeCloseTo(-8, 1)
  await card.hover()
  await page.mouse.down()
  const scale = () =>
    card.evaluate((el) => {
      const matrix = new DOMMatrixReadOnly(getComputedStyle(el).transform)
      return Math.hypot(matrix.a, matrix.b)
    })
  await expect.poll(scale).toBeLessThan(0.99)
  expect((await pose(card)).y).toBeCloseTo(-8, 1)
  expect((await shadow(card)).blur).toBeCloseTo(40, 0)
  await page.mouse.up()
  await expect.poll(scale).toBeCloseTo(1, 2)
  await expect.poll(async () => (await shadow(card)).blur).toBeCloseTo(6, 0)
  await expect.poll(async () => (await shadow(card)).alpha).toBeCloseTo(0.1, 2)
  await expect.poll(async () => (await pose(card)).y).toBeCloseTo(0, 1)
})

test('settles on the final pose at once under reduced motion', async ({ page }) => {
  await open(page, 'en', 'reduce')
  const courier = page.locator('#depth-courier')
  await press(page, 'Send')
  await expect(page.locator('#depth-route')).toHaveText('Delivered')
  const rest = await pose(courier)
  expect(rest.x).toBeCloseTo(196, 1)
  expect(rest.rotate).toBeCloseTo(69.444, 1)
  const panel = page.locator('#depth-panel')
  await press(page, 'Tilt')
  await expect.poll(async () => (await pose(panel)).flat).toBe(false)
})

test('releases a path in flight on unmount and starts clean in Portuguese', async ({ page }) => {
  await open(page, 'pt')
  await expect(
    page.getByRole('heading', { name: 'Trajetórias, profundidade e sombras' }),
  ).toBeVisible()
  await press(page, 'Enviar')
  await expect(page.locator('#depth-route')).toHaveText('A caminho')
  await press(page, 'Desmontar')
  await expect(page.locator('#depth-courier')).toHaveCount(0)
  await press(page, 'Montar')
  const courier = page.locator('#depth-courier')
  await expect(courier).toBeVisible()
  expect((await pose(courier)).x).toBeCloseTo(0, 1)
  await expect(page.locator('#depth-route')).toHaveText('Parou no caminho')
  await press(page, 'Enviar')
  await expect(page.locator('#depth-route')).toHaveText('Entregue')
})

test('leaves nothing behind when the route changes with a path in flight', async ({ page }) => {
  await open(page)
  await press(page, 'Send')
  await expect(page.locator('#depth-route')).toHaveText('On the way')
  await page.evaluate(() => {
    location.hash = '#/checks/motion'
  })
  await expect(page.getByRole('heading', { name: 'Press and reveal' })).toBeVisible()
  await page.goBack()
  const courier = page.locator('#depth-courier')
  await expect(courier).toBeVisible()
  expect((await pose(courier)).x).toBeCloseTo(0, 1)
  await expect(page.locator('#depth-route')).toHaveText('Waiting at the start')
  await press(page, 'Send')
  await expect(page.locator('#depth-route')).toHaveText('Delivered')
})
