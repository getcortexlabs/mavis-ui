import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/checks-image-*.svg', (route) => {
    if (route.request().url().includes('error')) return route.fulfill({ status: 404, body: '' })
    const wide = route.request().url().includes('large')
    return route.fulfill({
      contentType: 'image/svg+xml',
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="${wide ? 960 : 320}" height="${wide ? 480 : 160}"><rect width="100%" height="100%" fill="${wide ? 'navy' : 'teal'}"/></svg>`,
    })
  })
  await page.goto('/playground/#/checks/adoption?lang=en')
})

test('returns pointer-opened Sheet focus after Escape and resolves an explicit replacement target', async ({
  page,
}) => {
  const trigger = page.locator('#adoption-trigger')
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Consumer sheet' })
  await page.locator('#adoption-editor').fill('Retained')
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
  await expect(page.locator('#adoption-close-count')).toHaveText('1')
  await trigger.click()
  await dialog.getByRole('button', { name: 'Return to alternate' }).click()
  await expect(dialog).not.toBeVisible()
  await expect(page.locator('#adoption-alternate')).toBeFocused()
})

test('preserves rejected/reopened Sheet ownership and leaves navigation focus alone', async ({
  page,
}) => {
  await page.getByLabel('Reject dismissal').check()
  await page.locator('#adoption-trigger').click()
  const dialog = page.getByRole('dialog', { name: 'Consumer sheet' })
  await page.keyboard.press('Escape')
  await expect(dialog).toBeVisible()
  await expect.poll(() => dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true)
  await dialog.getByRole('button', { name: 'Interrupt close' }).click()
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Navigate and close' }).click()
  await expect(dialog).not.toBeVisible()
  await expect(page.locator('#adoption-destination')).toBeFocused()
})

test('does not focus a disconnected trigger after Sheet dismissal', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.locator('#adoption-trigger').click()
  await page.getByRole('button', { name: 'Remove trigger and close' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.locator('#adoption-trigger')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('resizes the responsive Stack and Grid without observer errors or replacing editors', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.setViewportSize({ width: 1000, height: 900 })
  const stack = page.locator('#adoption-stack'),
    editor = page.locator('#adoption-stack-draft')
  await editor.fill('Across breakpoints')
  const node = await editor.elementHandle()
  const cell = await page.locator('#adoption-cell-1').elementHandle()
  await page.locator('#adoption-cell-1').fill('Across grid reorder')
  for (let index = 0; index < 6; index++) {
    await expect(stack).toHaveCSS('flex-direction', 'row')
    await page.getByRole('button', { name: 'Resize container' }).click()
    await expect(stack).toHaveCSS('flex-direction', 'column')
    await expect
      .poll(() =>
        page
          .locator('#adoption-grid')
          .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length),
      )
      .toBe(1)
    await page.getByRole('button', { name: 'Resize container' }).click()
  }
  await expect(stack).toHaveCSS('flex-direction', 'row')
  await expect
    .poll(() =>
      page
        .locator('#adoption-grid')
        .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length),
    )
    .toBe(3)
  await page.getByRole('button', { name: 'Reverse cells' }).click()
  expect(await node!.evaluate((el) => el === document.getElementById('adoption-stack-draft'))).toBe(
    true,
  )
  expect(await cell!.evaluate((el) => el === document.getElementById('adoption-cell-1'))).toBe(true)
  await expect(editor).toHaveValue('Across breakpoints')
  await expect(page.locator('#adoption-cell-1')).toHaveValue('Across grid reorder')
  expect(errors).toEqual([])
})

test('forwards responsive image attributes and recovers when the chosen candidate fails', async ({
  page,
}) => {
  const image = page.locator('#adoption-image'),
    inner = image.locator('img')
  await expect(inner).toHaveAttribute('srcset', /320w.*960w/)
  await expect(inner).toHaveAttribute('sizes', '320px')
  for (const [attribute, value] of [
    ['loading', 'eager'],
    ['decoding', 'async'],
    ['fetchpriority', 'high'],
  ]) {
    await expect(inner).toHaveAttribute(attribute!, value!)
    await expect(image).not.toHaveAttribute(attribute!, value!)
  }
  await expect(image).toHaveAttribute('data-state', 'ready')
  const ratio = await image.evaluate(
    (el) => el.getBoundingClientRect().width / el.getBoundingClientRect().height,
  )
  await page.getByRole('button', { name: 'Change image size' }).click()
  await expect(inner).toHaveAttribute('sizes', '960px')
  await expect
    .poll(() => inner.evaluate((el) => (el as HTMLImageElement).currentSrc))
    .toContain('large.svg')
  await page.getByRole('button', { name: 'Use missing source' }).click()
  await expect(image).toHaveAttribute('data-state', 'error')
  await page.getByRole('button', { name: 'Restore image source' }).click()
  await expect(image).toHaveAttribute('data-state', 'ready')
  expect(
    await image.evaluate(
      (el) => el.getBoundingClientRect().width / el.getBoundingClientRect().height,
    ),
  ).toBeCloseTo(ratio, 2)
})

test('follows native image selection when only the viewport changes', async ({ page }) => {
  await page.setViewportSize({ width: 300, height: 900 })
  await page.reload()
  const image = page.locator('#adoption-viewport-image')
  await expect(image).toHaveAttribute('data-state', 'error')
  await page.setViewportSize({ width: 1100, height: 900 })
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  )
  // WebKit may retain a failed candidate on resize. Match the native <img> instead
  // of imposing a different candidate-selection or retry algorithm on the browser.
  await expect
    .poll(() =>
      page.evaluate(() => {
        const actual = document.querySelector<HTMLImageElement>('#adoption-viewport-image img')!
        const reference = document.querySelector<HTMLImageElement>('#adoption-viewport-reference')!
        return (
          actual.complete &&
          reference.complete &&
          actual.currentSrc === reference.currentSrc &&
          document.getElementById('adoption-viewport-image')!.dataset.state ===
            (reference.naturalWidth ? 'ready' : 'error')
        )
      }),
    )
    .toBe(true)
})

test('keeps the calendar centered in localized date editors through help, errors and enlarged text', async ({
  page,
}, info) => {
  const input = page.locator('#adoption-date')
  const opener = page.getByRole('button', { name: 'Escolher data: Data local', exact: true })
  await expect(input).toHaveValue('03/11/2026')
  await expect(page.locator('#adoption-instant')).toHaveText('02/11/2026')
  const aligned = async () => {
    const field = (await input.boundingBox())!,
      button = (await opener.boundingBox())!
    expect(Math.abs(field.y + field.height / 2 - button.y - button.height / 2)).toBeLessThan(1)
    expect(button.x).toBeGreaterThan(field.x)
    expect(button.x + button.width).toBeLessThanOrEqual(field.x + field.width)
  }
  for (const width of [320, 1000]) {
    await page.setViewportSize({ width, height: 900 })
    await aligned()
    await page.getByRole('button', { name: 'Toggle date error' }).click()
    await aligned()
  }
  await input
    .locator('..')
    .locator('..')
    .screenshot({ path: info.outputPath('localized-date-field.png') })
  await input.evaluate((el) => el.style.setProperty('--m-input-font-size', '32px'))
  await aligned()
  await input.fill('04/11/')
  await expect(page.locator('#adoption-date-value')).toHaveText('2026-11-03')
  await input.fill('04/11/2026')
  await expect(page.locator('#adoption-date-value')).toHaveText('2026-11-04')
  await opener.click()
  const dialog = page.getByRole('dialog', { name: 'Data local', exact: true })
  await expect(dialog.locator('[data-date="2026-11-04"]')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(opener).toBeFocused()
  await page.getByRole('button', { name: 'Change date locale' }).click()
  await expect(input).toHaveValue('11/04/2026')
  await page.locator('#adoption-range-start').fill('30/11/2026')
  await page.locator('#adoption-range-end').fill('01/12/2026')
  await expect(page.locator('#adoption-range-value')).toHaveText('2026-11-30 / 2026-12-01')
  await expect(page.locator('#adoption-range-end')).not.toHaveAttribute('aria-invalid', 'true')
})
