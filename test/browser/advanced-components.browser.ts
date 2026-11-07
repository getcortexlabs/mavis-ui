import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
const preview = (id: string) => `/playground/#/preview/${id}?lang=en`
test('hierarchical search preserves disabled rows and controlled selection', async ({ page }) => {
  await page.goto(preview('tree-select'))
  await page.getByRole('button', { name: 'Lettering', exact: true }).click()
  await page.getByRole('textbox', { name: 'Find a discipline' }).fill('color')
  await expect(page.getByText('Brand identity', { exact: true })).toBeVisible()
  await page.getByRole('checkbox', { name: 'Color systems' }).check()
  await expect(page.locator('#tree-select-value')).toHaveText('lettering,color')
  await page.getByRole('textbox', { name: 'Find a discipline' }).fill('archive')
  await expect(page.getByRole('checkbox', { name: 'Archive · locked' })).toBeDisabled()
  await page.keyboard.press('Escape')
  await expect(
    page.getByRole('button', { name: 'Lettering, Color systems', exact: true }),
  ).toBeFocused()
})
test('masonry reflows while retaining editor state and logical reading order', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 1000 })
  await page.goto(preview('masonry'))
  const editor = page.getByRole('textbox', { name: 'A thought to keep' })
  await editor.fill('Still here')
  await page.getByRole('button', { name: 'Reverse collection' }).click()
  await expect(editor).toHaveValue('Still here')
  await expect(page.locator('#studio-masonry [id^="masonry-"]').first()).toHaveAttribute(
    'id',
    'masonry-small',
  )
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 1100 })
    await expect
      .poll(async () => {
        const bounds = await page
          .locator('#studio-masonry [id^="masonry-"]')
          .evaluateAll((elements) =>
            elements.map((el) => {
              const b = el.getBoundingClientRect()
              return { x: b.x, y: b.y, w: b.width, h: b.height }
            }),
          )
        return bounds.every((a, i) =>
          bounds.every(
            (b, j) =>
              i === j ||
              a.x + a.w <= b.x + 1 ||
              b.x + b.w <= a.x + 1 ||
              a.y + a.h <= b.y + 1 ||
              b.y + b.h <= a.y + 1,
          ),
        )
      })
      .toBe(true)
    await expect(editor).toHaveValue('Still here')
  }
})
test('heatmap distinguishes missing/zero and exposes data and keyboard selection', async ({
  page,
}) => {
  await page.goto(preview('heatmap'))
  const first = page.getByRole('button', { name: '2026-09-01: No data', exact: true })
  await first.focus()
  await first.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(page.locator('#heatmap-value')).toHaveText('2026-09-02')
  await page.getByRole('button', { name: 'View data' }).click()
  await expect(
    page.getByRole('button', { name: '2026-09-12: 0', exact: true }).last(),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Another chapter' }).click()
  await expect(page.locator('#heatmap-value')).toHaveText('2026-09-02')
})
test('crop zoom, rotation, cancellation and export keep source pixels canonical', async ({
  page,
}) => {
  await page.goto(preview('image-cropper'))
  const exportButton = page.getByRole('button', { name: 'Export image', exact: true })
  await expect(exportButton).toBeEnabled()
  await page.getByRole('slider', { name: 'Zoom' }).fill('10')
  await expect(page.locator('#crop-value')).not.toHaveText('original')
  const before = await page.locator('#crop-value').textContent()
  const handle = page.getByRole('group', { name: 'Move image', exact: true })
  await handle.scrollIntoViewIfNeeded()
  await page.evaluate(() => document.fonts.ready)
  const bounds = (await handle.boundingBox())!
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
  await page.mouse.down()
  await page.mouse.move(bounds.x + bounds.width / 2 + 40, bounds.y + bounds.height / 2 + 20, {
    steps: 5,
  })
  await page.keyboard.press('Escape')
  await page.mouse.up()
  await expect(page.locator('#crop-value')).toHaveText(before!)
  await page.getByRole('button', { name: 'Rotate clockwise' }).click()
  await expect(page.locator('#crop-value')).toContainText(',90')
  await exportButton.click()
  await expect(page.locator('#crop-result')).toHaveText('480 × 480')
  const image = page.getByRole('img', { name: 'Exported crop', exact: true })
  await expect(image).toBeVisible()
  expect(
    await image.evaluate((el: HTMLImageElement) => [el.naturalWidth, el.naturalHeight]),
  ).toEqual([480, 480])
  await page.getByRole('button', { name: 'Change photograph' }).click()
  await expect(page.locator('#crop-value')).toHaveText('original')
  await expect(exportButton).toBeEnabled()
})
test('scheduler moves/resizes instants, cancels drag and retains short event access', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1200, height: 1200 })
  await page.goto(preview('scheduler'))
  await page
    .getByRole('button', { name: /^A small pause ·/ })
    .last()
    .click()
  await expect(page.getByRole('button', { name: 'Earlier', exact: true })).toBeFocused()
  await page.getByRole('button', { name: 'Later', exact: true }).click()
  await expect(page.locator('#scheduler-result')).toHaveText('note:2026-11-02T18:15:00.000Z')
  const handle = page.getByRole('group', { name: 'Move event: Morning field walk', exact: true })
  await handle.scrollIntoViewIfNeeded()
  await page.evaluate(() => document.fonts.ready)
  const b = (await handle.boundingBox())!
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
  await page.mouse.down()
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2 + 40, { steps: 5 })
  await page.keyboard.press('Escape')
  await page.mouse.up()
  await expect(page.locator('#scheduler-result')).toHaveText('note:2026-11-02T18:15:00.000Z')
  await handle.press('ArrowDown')
  await expect(page.locator('#scheduler-result')).toHaveText('walk:2026-11-02T14:15:00.000Z')
  await page
    .getByRole('button', { name: /^Morning field walk ·/ })
    .last()
    .click()
  await page.getByRole('button', { name: 'Longer', exact: true }).click()
  await expect(page.locator('#scheduler-result')).toContainText('walk:')
})
test('inbox keeps read state, dismisses deliberately and restores focus after removal', async ({
  page,
}) => {
  await page.goto(preview('notification-center'))
  await page.getByRole('button', { name: 'Open edition', exact: true }).click()
  await expect(page.locator('#notification-action')).toHaveText('edition')
  await page.getByRole('button', { name: 'Unread', exact: true }).click()
  await page
    .getByRole('button', { name: 'Mark as read: The autumn edition is ready', exact: true })
    .click()
  await expect(page.getByRole('button', { name: 'Unread', exact: true })).toBeFocused()
  await expect(page.locator('#notification-state')).toContainText('edition:true')
  await page.getByRole('button', { name: 'All', exact: true }).click()
  await page.getByRole('button', { name: 'Dismiss: A fresh pair of eyes', exact: true }).click()
  await expect(page.locator('#notification-state')).not.toContainText('feedback')
  await page.getByRole('button', { name: 'Receive an invitation' }).click()
  await expect(page.getByText('A new invitation', { exact: true })).toBeVisible()
})
for (const id of [
  'tree-select',
  'masonry',
  'heatmap',
  'image-cropper',
  'scheduler',
  'notification-center',
])
  test(`${id}: responsive, reduced motion, accessibility and no runtime errors`, async ({
    page,
  }, info) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => {
      if (/ResizeObserver loop|\[Vue warn\]/.test(m.text())) errors.push(m.text())
    })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(preview(id))
    await expect(page.locator('[data-testid="component-preview"]')).toBeVisible()
    if (id === 'image-cropper')
      await expect(page.getByRole('button', { name: 'Export image', exact: true })).toBeEnabled()
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1100 })
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        .toBe(true)
    }
    const audit = await new AxeBuilder({ page })
      .include('[data-testid="component-preview"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(audit.violations).toEqual([])
    await page.screenshot({ path: info.outputPath(`${id}-desktop.png`), fullPage: true })
    await page.setViewportSize({ width: 390, height: 1100 })
    await page.screenshot({ path: info.outputPath(`${id}-mobile.png`), fullPage: true })
    expect(errors).toEqual([])
  })
test('exported crop pixels match all four quarter rotations', async ({ page }) => {
  await page.goto('/playground/#/checks/crop-export')
  const colors = [
      [255, 0, 0],
      [0, 255, 0],
      [0, 0, 255],
      [255, 255, 0],
    ],
    orders = [
      [0, 1, 2, 3],
      [2, 0, 3, 1],
      [3, 2, 1, 0],
      [1, 3, 0, 2],
    ]
  for (const order of orders) {
    await expect(page.getByRole('button', { name: 'Export image', exact: true })).toBeEnabled()
    await page.getByRole('button', { name: 'Export image', exact: true }).click()
    const image = page.getByRole('img', { name: 'Pixel evidence', exact: true })
    await expect(image).toBeVisible()
    await expect
      .poll(() =>
        image.evaluate(async (el: HTMLImageElement) => {
          await el.decode()
          const c = document.createElement('canvas')
          c.width = c.height = 40
          const ctx = c.getContext('2d')!
          ctx.drawImage(el, 0, 0)
          return [
            [10, 10],
            [30, 10],
            [10, 30],
            [30, 30],
          ].map(([x, y]) => Array.from(ctx.getImageData(x!, y!, 1, 1).data).slice(0, 3))
        }),
      )
      .toEqual(order.map((i) => colors[i]))
    await page.getByRole('button', { name: 'Rotate clockwise', exact: true }).click()
  }
})
