import { expect, test } from '@playwright/test'
import { checkLayout } from '../layout-contract'

test('preserves content geometry through resize, text changes and RTL', async ({ page }, info) => {
  await page.goto('/playground/#/checks/layout')
  const assertLayout = async () => {
    const views = await page.locator('[id]').evaluateAll((elements) =>
      Object.fromEntries(
        elements.map((el) => {
          const { x, y, width, height } = el.getBoundingClientRect()
          return [el.id, { x, y, width, height }]
        }),
      ),
    )
    expect(checkLayout(views)).toEqual([])
    expect(await page.getByRole('main').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    )
  }
  for (const [width, height] of [
    [320, 900],
    [390, 844],
    [844, 390],
    [768, 1024],
    [1024, 768],
  ]) {
    await page.setViewportSize({ width: width!, height: height! })
    await expect(async () => await assertLayout()).toPass()
    await page.locator('#change-content').click()
    await expect(page.locator('#revealed')).toBeVisible()
    await expect(async () => await assertLayout()).toPass()
    await page.getByRole('main').evaluate((el) => {
      el.scrollTop = 0
    })
    await page.screenshot({ path: info.outputPath(`layout-${width}.png`) })
    await page.locator('#change-content').click()
    await expect(page.locator('#revealed')).toHaveCount(0)
    await expect(async () => await assertLayout()).toPass()
  }
  await page.setViewportSize({ width: 320, height: 900 })
  await page.locator('#change-content').click()
  await expect(page.locator('#revealed')).toBeVisible()
  await page.locator('p, h1, button').evaluateAll((elements) => {
    for (const element of elements) {
      const size = Number.parseFloat(getComputedStyle(element).fontSize)
      ;(element as HTMLElement).style.setProperty('font-size', `${size * 2}px`, 'important')
    }
  })
  await expect(async () => await assertLayout()).toPass()
  await page.getByRole('main').evaluate((el) => {
    el.scrollTop = 0
  })
  await page.screenshot({ path: info.outputPath('layout-320-large-text.png') })
})
