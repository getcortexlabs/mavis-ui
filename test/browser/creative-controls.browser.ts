import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
const ids = ['color-picker', 'swipe-deck', 'gauge', 'tour', 'transfer-list', 'marquee']
const preview = (id: string) => `/playground/#/preview/${id}?lang=en`

test('color editor keeps invalid drafts and all controls honor disabled state', async ({
  page,
}) => {
  await page.goto(preview('color-picker'))
  const input = page.getByRole('textbox', { name: 'HEX or RGB', exact: true })
  await input.fill('#12')
  await expect(input).toHaveAttribute('aria-invalid', 'true')
  await expect(page.locator('#color-value')).toHaveText('#9C5270CC')
  await input.fill('rgba(12, 34, 56, .5)')
  await input.press('Tab')
  await expect(page.locator('#color-value')).toHaveText('#0C223880')
  await page.getByRole('slider', { name: 'Opacity', exact: true }).fill('25')
  await expect(page.locator('#color-value')).toHaveText('#0C223840')
  await page.getByRole('switch', { name: 'Disable picker' }).click()
  await expect(input).toBeDisabled()
  await expect(page.getByRole('slider', { name: 'Hue', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: '#51847BFF', exact: true })).toBeDisabled()
})

test('deck decisions remain app-owned and undo restores identity', async ({ page }) => {
  await page.goto(preview('swipe-deck'))
  await page.getByRole('button', { name: 'Keep', exact: true }).click()
  await expect(page.locator('#deck-decisions')).toHaveText('forest:accept')
  await expect(page.locator('#discovery-deck-card')).toContainText('Follow the coastline.')
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(page.locator('#discovery-deck-card')).toContainText('A morning among trees.')
  await page.getByRole('button', { name: 'Pass', exact: true }).click()
  await expect(page.locator('#deck-decisions')).toHaveText('forest:reject')
})

test('deck catches a drag and makes the same decision as its buttons', async ({ page }) => {
  await page.goto(preview('swipe-deck'))
  const card = page.locator('#discovery-deck-card')
  await card.scrollIntoViewIfNeeded()
  await page.evaluate(() => document.fonts.ready)
  const bounds = (await card.boundingBox())!
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
  await page.mouse.down()
  await page.mouse.move(bounds.x + bounds.width / 2 + 120, bounds.y + bounds.height / 2, {
    steps: 10,
  })
  await expect
    .poll(() => card.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41))
    .toBeGreaterThan(50)
  await page.mouse.up()
  await expect(page.locator('#deck-decisions')).toHaveText('forest:accept')
})

test('gauge changes canonical semantics immediately and draws with Jolt', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(preview('gauge'))
  const meter = page.getByRole('meter', { name: 'Weekly balance' })
  await expect(meter).toHaveAttribute('aria-valuenow', '72')
  await page.getByRole('button', { name: 'In the flow', exact: true }).click()
  await expect(meter).toHaveAttribute('aria-valuenow', '92')
  await expect(meter).toHaveAttribute('aria-valuetext', '92%')
  await expect.poll(() => meter.locator('svg').count()).toBeGreaterThan(1)
  await page.getByRole('switch', { name: 'Half circle' }).click()
  await expect(meter).toHaveAttribute('aria-valuenow', '92')
  expect(errors).toEqual([])
})

test('transfer filters retain checks, disabled items stay put and selection uses identities', async ({
  page,
}) => {
  await page.goto(preview('transfer-list'))
  await page.getByRole('checkbox', { name: 'Field notebook', exact: true }).check()
  await page.getByRole('textbox', { name: 'Filter: On the shelf', exact: true }).fill('water')
  await page.getByRole('checkbox', { name: 'Water bottle', exact: true }).check()
  await page.getByRole('button', { name: 'Pack selected', exact: true }).click()
  await expect(page.locator('#transfer-values')).toHaveText('camera, notebook, water')
  await page.getByRole('textbox', { name: 'Filter: On the shelf', exact: true }).fill('')
  await expect(
    page.getByRole('checkbox', { name: 'Radio · unavailable', exact: true }),
  ).toBeDisabled()
  const bag = page.getByRole('group', { name: 'In your bag', exact: true })
  await bag.getByRole('checkbox', { name: 'Camera', exact: true }).check()
  await bag.getByRole('button', { name: 'Leave selected', exact: true }).click()
  await expect(page.locator('#transfer-values')).toHaveText('notebook, water')
})

test('tour follows explicit targets, keeps the editor and restores launch focus', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(preview('tour'))
  const editor = page.getByRole('textbox', { name: 'Trip name', exact: true })
  await editor.fill('An unhurried weekend')
  const trigger = page.getByRole('button', { name: 'Show me around', exact: true })
  await trigger.focus()
  await trigger.click()
  let dialog = page.getByRole('dialog', { name: 'Give it a name.', exact: true })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Next', exact: true }).click()
  dialog = page.getByRole('dialog', { name: 'Choose the unexpected.', exact: true })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Back', exact: true }).click()
  await expect(editor).toHaveValue('An unhurried weekend')
  await page.getByRole('dialog').getByRole('button', { name: 'End tour' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(trigger).toBeFocused()
  await expect(page.locator('#tour-result')).toHaveText('skip')
  await trigger.click()
  await page.getByRole('dialog').getByRole('button', { name: 'Next', exact: true }).click()
  await editor.click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(editor).toBeFocused()
  expect(errors).toEqual([])
})

test('marquee is opt-in, pauses on hover and respects reduced motion', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(preview('marquee'))
  const track = page.locator('#reminder-marquee-track')
  await expect(track.getByRole('listitem')).toHaveCount(4)
  await page.getByRole('button', { name: 'Play motion', exact: true }).click()
  await page.mouse.move(0, 0)
  const x = () => track.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41)
  await expect.poll(x).toBeLessThan(-3)
  const viewport = (await track.locator('..').boundingBox())!
  await page.mouse.move(viewport.x + 40, viewport.y + 30)
  const paused = await x()
  await page.waitForTimeout(150)
  expect(Math.abs((await x()) - paused)).toBeLessThan(1)
  await page.mouse.move(0, 0)
  await page.setViewportSize({ width: 1000, height: 1000 })
  const resumed = await x()
  await expect.poll(x).toBeLessThan(resumed - 3)
  await page.getByRole('button', { name: 'Reverse direction', exact: true }).click()
  const reversed = await x()
  await expect.poll(x).toBeGreaterThan(reversed + 3)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.getByRole('button', { name: 'Pause motion', exact: true })).toBeDisabled()
  await expect.poll(x).toBe(0)
  await expect(track.getByRole('listitem')).toHaveCount(4)
  expect(errors).toEqual([])
})

for (const theme of ['mavis', 'midnight'])
  test(`six creative previews fit narrow screens and remain accessible: ${theme}`, async ({
    page,
  }, info) => {
    test.setTimeout(60000)
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    for (const id of ids) {
      await page.setViewportSize({ width: 320, height: 1000 })
      await page.goto(preview(id) + `&theme=${theme}`)
      const root = page.locator('[data-testid="component-preview"]')
      await expect(root).toBeVisible()
      await page.evaluate(() => document.fonts.ready)
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        .toBe(true)
      await expect
        .poll(
          async () =>
            (await new AxeBuilder({ page }).include('[data-testid="component-preview"]').analyze())
              .violations,
        )
        .toEqual([])
      await page.screenshot({ path: info.outputPath(`${id}-${theme}-320.png`), fullPage: true })
      await page.setViewportSize({ width: 1440, height: 1000 })
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        .toBe(true)
    }
    expect(errors).toEqual([])
  })
