import { expect, test, type Page } from '@playwright/test'

let errors: string[]
test.afterEach(() => expect(errors).toEqual([]))

type Region = { bar: number; ratio: number }
const read = (page: Page) =>
  page.evaluate(
    () =>
      Object.fromEntries(
        ['calm', 'open'].map((id) => {
          const root = document.getElementById(id)!
          const grid = root.querySelector<HTMLElement>('.m-resizable-panels > div')!
          return [
            id,
            {
              bar: Number(root.querySelector('.m-chart-plot rect')!.getAttribute('height')),
              ratio: parseFloat(grid.style.gridTemplateColumns),
            },
          ]
        }),
      ) as Record<'calm' | 'open', Region>,
  )
// Activates a control and reads three frames later, before any animation could have ended.
const after = async (page: Page, id: string) => {
  await page.evaluate(async (id) => {
    document.getElementById(id)!.click()
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    )
  }, id)
  return read(page)
}
const settled = async (page: Page) => {
  await expect
    .poll(async () => {
      const first = await read(page)
      await page.waitForTimeout(120)
      return JSON.stringify(first) === JSON.stringify(await read(page))
    })
    .toBe(true)
  return read(page)
}
const policy = async (page: Page, name: 'User' | 'Always' | 'Never') => {
  await page.getByRole('button', { name, exact: true }).click()
  await expect(page.locator('#policy')).toHaveText(`Second region: ${name.toLowerCase()}`)
}
const open = async (page: Page, reducedMotion: 'reduce' | 'no-preference') => {
  errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.emulateMedia({ reducedMotion })
  await page.goto('/playground/#/checks/reduced-motion')
  await expect(page.locator('#open .m-chart-plot rect').first()).toBeVisible()
  return settled(page)
}

test('each region applies its own policy to charts and animated numbers', async ({ page }) => {
  const rest = await open(page, 'no-preference')
  expect(rest.calm).toEqual(rest.open)
  const week = await after(page, 'week')
  const end = await settled(page)
  expect(end.calm.bar).not.toBe(rest.calm.bar)
  expect(week.calm.bar).toBe(end.calm.bar)
  expect(week.open.bar).not.toBe(end.open.bar)
  expect(end.open.bar).toBe(end.calm.bar)

  const divider = await after(page, 'divider')
  expect(divider.calm.ratio).toBe(70)
  expect(divider.open.ratio).toBeGreaterThan(30)
  expect(divider.open.ratio).toBeLessThan(70)
  expect((await settled(page)).open.ratio).toBe(70)
})

test('user follows the system, always and never override it', async ({ page }) => {
  const rest = await open(page, 'reduce')
  let step = await after(page, 'week')
  let end = await settled(page)
  expect(end.open.bar).not.toBe(rest.open.bar)
  expect(step.open.bar).toBe(end.open.bar)

  await policy(page, 'Never')
  step = await after(page, 'week')
  end = await settled(page)
  expect(step.open.bar).not.toBe(end.open.bar)
  expect(step.calm.bar).toBe(end.calm.bar)
  step = await after(page, 'divider')
  expect(step.open.ratio).toBeGreaterThan(30)
  expect(step.open.ratio).toBeLessThan(70)
  expect(step.calm.ratio).toBe(70)
  await settled(page)

  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await policy(page, 'Always')
  step = await after(page, 'week')
  end = await settled(page)
  expect(step.open.bar).toBe(end.open.bar)

  await policy(page, 'User')
  step = await after(page, 'week')
  end = await settled(page)
  expect(step.open.bar).not.toBe(end.open.bar)
})

test('a change of the system preference settles an update in flight', async ({ page }) => {
  await open(page, 'no-preference')
  const step = await after(page, 'week')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const now = await after(page, 'policy')
  const end = await settled(page)
  expect(step.open.bar).not.toBe(end.open.bar)
  expect(now.open.bar).toBe(end.open.bar)
  // WebKit acknowledges emulation before existing MediaQueryLists update. Observe one
  // created under `reduce`, just like Jolt's, before starting the next animation.
  const preference = await page.evaluateHandle(() => matchMedia('(prefers-reduced-motion: reduce)'))
  expect(await preference.evaluate((query) => query.matches)).toBe(true)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect.poll(() => preference.evaluate((query) => query.matches)).toBe(false)
  await preference.dispose()
  const again = await after(page, 'week')
  expect(again.open.bar).not.toBe((await settled(page)).open.bar)

  const moving = await after(page, 'divider')
  expect(moving.open.ratio).toBeLessThan(70)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  expect((await after(page, 'policy')).open.ratio).toBe(70)
})

test('a box follows the region it is given while mounted', async ({ page }) => {
  await open(page, 'no-preference')
  await page.getByRole('button', { name: 'Swap regions', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Restore regions', exact: true })).toBeVisible()
  let step = await after(page, 'week')
  let end = await settled(page)
  expect(step.open.bar).toBe(end.open.bar)
  expect(step.calm.bar).not.toBe(end.calm.bar)
  await page.getByRole('button', { name: 'Restore regions', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Swap regions', exact: true })).toBeVisible()
  step = await after(page, 'week')
  end = await settled(page)
  expect(step.calm.bar).toBe(end.calm.bar)
  expect(step.open.bar).not.toBe(end.open.bar)
})

test('marquees follow the region, and policies survive remounting and KeepAlive', async ({
  page,
}) => {
  await open(page, 'no-preference')
  const offset = (id: string) =>
    page.evaluate((id) => {
      const marquee = document.querySelector(`#${id} [aria-label="Small reminders"]`)!
      return (
        [...marquee.querySelectorAll('*')]
          .map((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).e)
          .find((value) => value !== 0) ?? 0
      )
    }, id)
  await page.locator('#open [aria-label="Small reminders"]').scrollIntoViewIfNeeded()
  await expect.poll(() => offset('open')).toBeLessThan(-4)
  const first = await offset('open')
  await expect.poll(() => offset('open')).toBeLessThan(first - 4)
  expect(await offset('calm')).toBe(0)

  for (let round = 0; round < 3; round++) {
    await page.getByRole('button', { name: 'Unmount', exact: true }).click()
    await expect(page.locator('#open')).toHaveCount(0)
    await page.getByRole('button', { name: 'Mount', exact: true }).click()
    await expect(page.locator('#open .m-chart-plot rect').first()).toBeVisible()
  }
  // Kept alive and brought back while the system preference flips back and forth.
  for (let round = 0; round < 2; round++) {
    await page.getByRole('button', { name: 'Deactivate', exact: true }).click()
    await expect(page.locator('#open')).toHaveCount(0)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.getByRole('button', { name: 'Activate', exact: true }).click()
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await expect(page.locator('#open .m-chart-plot rect').first()).toBeVisible()
  }
  await settled(page)
  const step = await after(page, 'week')
  const end = await settled(page)
  expect(step.calm.bar).toBe(end.calm.bar)
  expect(step.open.bar).not.toBe(end.open.bar)
  const divider = await after(page, 'divider')
  expect(divider.calm.ratio).toBe(70)
  expect(divider.open.ratio).toBeLessThan(70)
  await page.locator('#open [aria-label="Small reminders"]').scrollIntoViewIfNeeded()
  const resumed = await offset('open')
  await expect.poll(() => offset('open')).not.toBe(resumed)
  expect(await offset('calm')).toBe(0)
})
