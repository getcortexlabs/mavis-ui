import { expect, test } from '@playwright/test'

const route = '/playground/#/showcase/horizons?lang=en'
const pose = (page: import('@playwright/test').Page) =>
  page
    .locator('.horizons-progress')
    .evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).a)

test('recycles presentation rows by identity and remembers once across pages', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto(route)
  const first = page.locator('#horizon-story-0')
  await expect(first).toHaveCSS('opacity', '1')
  await first.evaluate((el) => el.setAttribute('data-recycled', 'same-node'))
  await page.locator('#horizons-next').click()
  const recycled = page.locator('#horizon-story-3')
  await expect(recycled).toHaveAttribute('data-recycled', 'same-node')
  await expect
    .poll(() =>
      recycled.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42),
    )
    .toBeGreaterThan(0)
  await expect(recycled).toHaveCSS('opacity', '1')
  await page.locator('#horizons-next').click()
  await expect(first).toHaveCSS('opacity', '1')
  const maximum = await first.evaluate(
    (el) =>
      new Promise<number>((resolve) => {
        const start = performance.now()
        let maximum = 0
        const sample = () => {
          maximum = Math.max(maximum, new DOMMatrixReadOnly(getComputedStyle(el).transform).m42)
          if (performance.now() - start > 200) resolve(maximum)
          else requestAnimationFrame(sample)
        }
        sample()
      }),
  )
  expect(maximum).toBeLessThan(0.1)
  await first.click()
  await expect(page.locator('#horizons-visits')).toHaveText('1 encounters')
  await page.getByRole('link', { name: '← Showcase' }).click()
  expect(errors).toEqual([])
})

test('maps horizontal CSS pixels from inline start in LTR and RTL', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto(route)
  await expect(page.locator('#horizons-direction')).toBeEnabled()
  for (const rtl of [false, true]) {
    if (rtl) await page.locator('#horizons-direction').click()
    const rail = page.locator('.horizons-rail')
    await rail.evaluate((el, rtl) => {
      el.style.scrollSnapType = 'none'
      el.scrollLeft = ((rtl ? -1 : 1) * (el.scrollWidth - el.clientWidth)) / 2
    }, rtl)
    await expect.poll(() => pose(page)).toBeCloseTo(0.54, 1)
    await rail.evaluate((el, rtl) => {
      el.scrollLeft = (rtl ? -1 : 1) * (el.scrollWidth - el.clientWidth)
    }, rtl)
    await expect.poll(() => pose(page)).toBeCloseTo(1, 2)
    await expect
      .poll(() =>
        page
          .locator('.horizons-orbit')
          .evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).a),
      )
      .toBeCloseTo(-1, 1)
    await rail.evaluate((el) => {
      el.scrollLeft = 0
    })
    await expect.poll(() => pose(page)).toBeCloseTo(0.08, 2)
  }
  expect(errors).toEqual([])
})

test('leaves readable stories and working actions under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(route)
  await page.locator('#horizons-next').click()
  await expect(page.locator('#horizon-story-3')).toHaveCSS('opacity', '1')
  await page.locator('#horizon-story-3').click()
  await expect(page.locator('#horizons-visits')).toHaveText('1 encounters')
})
