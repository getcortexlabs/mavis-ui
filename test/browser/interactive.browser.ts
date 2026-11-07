import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'

test('sortable list commits a drag, exposes keyboard moves and disables them consistently', async ({
  page,
}) => {
  await page.goto('/playground/#/preview/sortable-list?lang=en')
  const handle = page.getByRole('button', { name: 'Reorder: Morning light', exact: true })
  await expect(handle).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  const from = (await handle.boundingBox())!
  const target = (await page
    .getByRole('button', { name: 'Reorder: Blue hour', exact: true })
    .boundingBox())!
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(250)
  await page.mouse.move(target.x + target.width / 2, target.y + target.height - 2, { steps: 16 })
  await page.mouse.up()
  await expect(page.locator('#sort-order')).not.toHaveText('morning,coast,blue,home')
  await page.getByRole('button', { name: 'Move up: The way home', exact: true }).click()
  await expect(page.locator('#sort-order')).not.toHaveText(/home$/)
  await page.getByRole('button', { name: 'Lock order', exact: true }).click()
  await expect(handle).toBeDisabled()
  await expect(
    page.getByRole('button', { name: 'Move down: The way home', exact: true }),
  ).toBeDisabled()
})

test('swipe reveals an explicit action, menu offers the same operation and archive can be undone', async ({
  page,
}) => {
  await page.goto('/playground/#/preview/swipe-actions?lang=en')
  const card = page.getByText('The cabin is booked. You in?', { exact: true })
  const box = (await card.boundingBox())!
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.7 - 95, box.y + box.height / 2, { steps: 14 })
  await page.mouse.up()
  const archive = page.getByRole('button', { name: 'Archive', exact: true })
  await expect(archive).toBeVisible()
  await archive.click()
  await expect(page.locator('#swipe-result')).toHaveText('archive')
  await page.getByRole('button', { name: 'Undo archive', exact: true }).click()
  await page.getByRole('button', { name: 'Actions', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Star', exact: true }).click()
  await expect(page.locator('#swipe-result')).toHaveText('favorite')
})

test('number flow keeps canonical names while interrupting values and formatting', async ({
  page,
}) => {
  await page.goto('/playground/#/preview/number-flow?lang=en')
  const value = page.locator('#flow-revenue')
  await expect(value).toHaveAttribute('aria-label', 'Revenue: $12,480.50')
  await page.getByRole('button', { name: 'New orders', exact: true }).click({ clickCount: 3 })
  await expect(value).toHaveAttribute('aria-label', 'Revenue: $16,609.25')
  await page.getByRole('button', { name: 'Refund', exact: true }).click()
  await expect(value).toHaveAttribute('aria-label', 'Revenue: $16,360.50')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('button', { name: 'BRL', exact: true }).click()
  await expect(value).toHaveAttribute('aria-label', /Revenue: R\$16,360.50/)
  await expect(value).toHaveText(/16,360.50/)
})

test('panels resize by keyboard and pointer, preserve drafts and restore after collapse', async ({
  page,
}) => {
  await page.goto('/playground/#/preview/resizable-panels?lang=en')
  const divider = page.getByRole('separator', { name: 'Notebook layout', exact: true })
  const draft = page.getByRole('textbox', { name: 'Note title', exact: true })
  await draft.fill('Keep this thought')
  await divider.press('End')
  await expect(divider).toHaveAttribute('aria-valuenow', '80')
  await divider.press('Home')
  await expect(divider).toHaveAttribute('aria-valuenow', '20')
  // The accessible value updates immediately; Jolt can still be moving the divider.
  // Measure the rendered split before taking coordinates for a real pointer drag.
  await expect
    .poll(() =>
      divider.evaluate((element) => {
        const primary = element.previousElementSibling!.getBoundingClientRect().width
        const secondary = element.nextElementSibling!.getBoundingClientRect().width
        return (primary / (primary + secondary)) * 100
      }),
    )
    .toBeCloseTo(20, 1)
  await divider.hover()
  const start = (await divider.boundingBox())!
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2)
  await page.mouse.down()
  await page.mouse.move(start.x + start.width / 2 + 30, start.y + start.height / 2, { steps: 10 })
  await expect
    .poll(async () => Number(await divider.getAttribute('aria-valuenow')))
    .toBeGreaterThan(20)
  await page.mouse.up()
  await expect
    .poll(async () => Number(await divider.getAttribute('aria-valuenow')))
    .toBeGreaterThan(20)
  await page.getByRole('button', { name: 'Hide notes', exact: true }).click()
  await expect(divider).toHaveAttribute('aria-valuenow', '0')
  await expect(draft).toHaveValue('Keep this thought')
  await page.getByRole('button', { name: 'Show notes', exact: true }).click()
  await page.getByRole('button', { name: 'Stack panels', exact: true }).click()
  await expect(divider).toHaveAttribute('aria-orientation', 'horizontal')
  await expect(draft).toHaveValue('Keep this thought')
})

test('comparison preserves image dimensions during reveal, supports endpoints and reduced motion', async ({
  page,
}) => {
  await page.goto('/playground/#/preview/image-compare?lang=en')
  const handle = page.getByRole('slider', { name: 'Choose your landscape', exact: true })
  const before = page.getByRole('img', { name: 'Mountains', exact: true })
  const original = (await before.boundingBox())!
  await handle.press('Home')
  await expect(handle).toHaveAttribute('aria-valuenow', '0')
  await handle.press('End')
  await expect(handle).toHaveAttribute('aria-valuenow', '100')
  await expect.poll(async () => (await before.boundingBox())?.width).toBeCloseTo(original.width, 0)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('button', { name: 'More coast', exact: true }).click()
  await expect(handle).toHaveAttribute('aria-valuenow', '15')
  await page.getByRole('button', { name: 'Change direction', exact: true }).click()
  await expect(handle).toHaveAttribute('aria-orientation', 'vertical')
  await handle.press('ArrowUp')
  await expect(handle).toHaveAttribute('aria-valuenow', '14')
})

test('viewer connects thumbnails, zooms, changes photos and restores focus after native Escape', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/playground/#/preview/image-viewer?lang=en')
  const trigger = page.getByRole('button', { name: 'Above the clouds', exact: true })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Postcards', exact: true })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Zoom in', exact: true }).click()
  await expect(dialog.getByRole('button', { name: /150%/ })).toBeVisible()
  await dialog.getByRole('button', { name: 'Next image', exact: true }).click()
  await expect(dialog.getByRole('img', { name: 'Still waters', exact: true })).toBeVisible()
  await expect(dialog.getByRole('button', { name: /100%/ })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
  await expect(page.locator('#viewer-value')).toHaveText('lake:false')
  expect(errors).toEqual([])
})

test('viewer closes from zoom and supports rapid reopen with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/playground/#/preview/image-viewer?lang=en')
  const trigger = page.getByRole('button', { name: 'Above the clouds', exact: true })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Postcards', exact: true })
  await dialog.getByRole('button', { name: 'Zoom in', exact: true }).click()
  await expect(dialog.getByRole('button', { name: /150%/ })).toBeVisible()
  await dialog.getByRole('button', { name: 'Close viewer', exact: true }).click()
  await expect(dialog).not.toBeVisible()
  await trigger.click()
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: /100%/ })).toBeVisible()
  const audit = await new AxeBuilder({ page }).include('dialog[open]').analyze()
  expect(audit.violations).toEqual([])
})

for (const width of [320, 768, 1440])
  test(`interactive previews fit ${width}px and expose accessible controls`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    mkdirSync('artifacts/interactive', { recursive: true })
    for (const name of [
      'image-viewer',
      'sortable-list',
      'swipe-actions',
      'number-flow',
      'resizable-panels',
      'image-compare',
    ]) {
      await page.goto(`/playground/#/preview/${name}?lang=en`)
      await expect(page.locator('[data-testid="component-preview"]')).toBeVisible()
      await expect
        .poll(
          () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
          { message: `${name} fits ${width}` },
        )
        .toBe(true)
      const audit = await new AxeBuilder({ page })
        .include('[data-testid="component-preview"]')
        .analyze()
      expect(audit.violations, name).toEqual([])
      if (width !== 768)
        await page.screenshot({
          path: `artifacts/interactive/${info.project.name}-${name}-${width}.png`,
          fullPage: true,
        })
    }
    expect(errors).toEqual([])
  })

test('Portuguese dark previews remain usable and the open viewer fits a narrow screen', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  for (const name of [
    'image-viewer',
    'sortable-list',
    'swipe-actions',
    'number-flow',
    'resizable-panels',
    'image-compare',
  ]) {
    await page.goto(`/playground/#/preview/${name}?lang=pt&theme=midnight`)
    const preview = page.locator('[data-testid="component-preview"]')
    await expect(preview).toBeVisible()
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true)
    const audit = await new AxeBuilder({ page })
      .include('[data-testid="component-preview"]')
      .analyze()
    expect(audit.violations, name).toEqual([])
  }
  await page.goto('/playground/#/preview/image-viewer?lang=pt&theme=midnight')
  await page.locator('.m-image-viewer button').first().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  const box = (await dialog.boundingBox())!
  expect(box.width).toBeLessThanOrEqual(390)
  expect(box.height).toBeLessThanOrEqual(844)
  const audit = await new AxeBuilder({ page }).include('dialog[open]').analyze()
  expect(audit.violations).toEqual([])
  await page.screenshot({
    path: `artifacts/interactive/${info.project.name}-viewer-open-dark-390.png`,
  })
  expect(errors).toEqual([])
})

test('panel snap points remain exact and Escape releases the pointer transaction', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/playground/#/preview/resizable-panels?lang=en')
  const divider = page.getByRole('separator', { name: 'Notebook layout', exact: true })
  await divider.press('Home')
  const layout = (await page.locator('.m-resizable-panels > div').first().boundingBox())!
  let box = (await divider.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(
    box.x + box.width / 2 + (layout.width - 44) * 0.05,
    box.y + box.height / 2,
    { steps: 6 },
  )
  await page.mouse.up()
  await expect(divider).toHaveAttribute('aria-valuenow', '25')
  box = (await divider.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2, { steps: 6 })
  await page.keyboard.press('Escape')
  await expect(divider).toHaveAttribute('aria-valuenow', '25')
  await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2, { steps: 6 })
  await page.mouse.up()
  await expect(divider).toHaveAttribute('aria-valuenow', '25')
})
