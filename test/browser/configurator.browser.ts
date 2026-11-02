import { expect, test } from '@playwright/test'

test('preserves numeric drafts, steps decimals, and follows disabled state', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('Failed to load resource'))
      errors.push(message.text())
  })
  await page.goto('/playground/#/components/number-input?lang=en')
  const editor = page.getByRole('textbox', { name: 'Quantity', exact: true })
  await editor.fill('-')
  await expect(page.getByText('Value: 2 · Draft: -', { exact: true })).toBeVisible()
  await editor.fill('2.5')
  await editor.press('ArrowUp')
  await expect(editor).toHaveValue('3')
  await page.getByRole('button', { name: 'Decrease: Quantity', exact: true }).click()
  await expect(editor).toHaveValue('2.5')
  await editor.fill('13')
  await expect(editor).toHaveAttribute('aria-invalid', 'true')
  await page.getByRole('switch', { name: 'Disable', exact: true }).click()
  await expect(editor).toBeDisabled()
  expect(errors).toEqual([])
})

test('filters MultiSelect without losing selected chips, enforces max and restores focus', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('Failed to load resource'))
      errors.push(message.text())
  })
  await page.goto('/playground/#/components/multi-select?lang=en')
  const trigger = page.getByRole('button', { name: 'Extras: Frame', exact: true })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Extras', exact: true })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('searchbox', { name: 'Search extras' }).fill('gift')
  await dialog.getByRole('checkbox', { name: 'Gift wrapping', exact: true }).check()
  await dialog.getByRole('searchbox', { name: 'Search extras' }).fill('')
  await expect(
    dialog.getByRole('checkbox', { name: 'Handwritten note', exact: true }),
  ).toBeDisabled()
  await expect(dialog.getByRole('checkbox', { name: 'Frame', exact: true })).toBeChecked()
  await dialog.getByRole('button', { name: 'Done', exact: true }).last().click()
  await expect(dialog).not.toBeVisible()
  await page.getByRole('button', { name: 'Remove: Frame', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Extras: Gift wrapping', exact: true }),
  ).toBeFocused()
  expect(errors).toEqual([])
})

test('Image reserves geometry and recovers from a failed source', async ({ page }) => {
  await page.goto('/playground/#/components/image?lang=en')
  const image = page.locator('#image-demo')
  await expect(image).toHaveAttribute('data-state', 'ready')
  const before = (await image.boundingBox())!
  await page.getByRole('switch', { name: 'Simulate error', exact: true }).click()
  await expect(image).toHaveAttribute('data-state', 'error')
  await expect(image.getByText('Image unavailable', { exact: true })).toBeVisible()
  const failed = (await image.boundingBox())!
  expect(Math.abs(failed.height - before.height)).toBeLessThan(1)
  await page.getByRole('switch', { name: 'Simulate error', exact: true }).click()
  await expect(image).toHaveAttribute('data-state', 'ready')
})

test('Accordion keeps intrinsic height and editor identity through rapid reversal', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('Failed to load resource'))
      errors.push(message.text())
  })
  await page.goto('/playground/#/showcase/forma?lang=en')
  const accordion = page.locator('#forma-accordion')
  const trigger = accordion.getByRole('button', { name: 'Made to last', exact: true })
  await trigger.click()
  const panel = accordion.locator('.m-reveal')
  await expect(panel).toHaveAttribute('data-state', 'open')
  await expect.poll(() => panel.evaluate((el: HTMLElement) => el.style.height)).toBe('auto')
  const before = (await panel.boundingBox())!.height
  await page.locator('#forma-more').click()
  await expect.poll(async () => (await panel.boundingBox())!.height).toBeGreaterThan(before)
  const input = page.getByRole('textbox', { name: 'A note', exact: true })
  await input.fill('Keep this draft')
  const handle = await input.elementHandle()
  await input.focus()
  await trigger.evaluate((el: HTMLElement) => el.click())
  await expect(trigger).toBeFocused()
  await trigger.evaluate((el: HTMLElement) => el.click())
  await expect(panel).toHaveAttribute('data-state', 'open')
  expect(await handle!.evaluate((el) => el.isConnected)).toBe(true)
  await expect(input).toHaveValue('Keep this draft')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await trigger.click()
  await expect(panel).toHaveCount(0)
  expect(errors).toEqual([])
})

test('choice paint survives rapid toggles, theme changes and disposal', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('Failed to load resource'))
      errors.push(message.text())
  })
  await page.goto('/playground/#/showcase/forma?lang=en')
  const control = page.getByRole('switch', { name: 'Recyclable packaging', exact: true })
  const track = control.locator('.m-switch-track > [data-m-choice-paint]')
  const before = await track.evaluate((el) => getComputedStyle(el).backgroundColor)
  await control.evaluate((el: HTMLElement) => {
    el.click()
    el.click()
    el.click()
  })
  await expect(control).toHaveAttribute('aria-checked', 'false')
  await expect
    .poll(() => track.evaluate((el) => getComputedStyle(el).backgroundColor))
    .not.toBe(before)
  await page.getByRole('button', { name: 'Change theme', exact: true }).click()
  await control.click()
  await expect(control).toHaveAttribute('aria-checked', 'true')
  await page.getByRole('button', { name: '← Showcase', exact: true }).click()
  await expect(page).toHaveURL(/#\/showcase/)
  expect(errors).toEqual([])
})

test('Forma fits compact and wide screens', async ({ page }, info) => {
  await page.goto('/playground/#/showcase/forma?lang=en')
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 960 })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(
      await page.getByRole('main').evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true)
    await page.screenshot({ path: info.outputPath(`forma-${width}.png`) })
  }
})

test('one scalar maps paint and radius while press retains the application scale', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('Failed to load resource'))
      errors.push(message.text())
  })
  await page.goto('/playground/#/showcase/forma?lang=en')
  const card = page.locator('#forma-paint')
  await page.locator('#forma-cool').click()
  await expect
    .poll(() => card.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).a))
    .toBeCloseTo(1.1, 2)
  await expect
    .poll(() => card.evaluate((el) => getComputedStyle(el).backgroundColor))
    .toBe('rgb(173, 193, 255)')
  await expect
    .poll(() => card.evaluate((el) => parseFloat(getComputedStyle(el).borderRadius)))
    .toBeCloseTo(32, 1)
  await card.hover()
  await page.mouse.down()
  await expect
    .poll(() => card.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).a))
    .toBeCloseTo(1.1 * 0.96, 2)
  await page.mouse.move(0, 0)
  await page.mouse.up()
  await expect
    .poll(() => card.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).a))
    .toBeCloseTo(1.1, 2)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('switch', { name: 'Recyclable packaging', exact: true }).click()
  await page.emulateMedia({ forcedColors: 'active' })
  await page.getByRole('checkbox', { name: 'This is a gift', exact: true }).check()
  expect(errors).toEqual([])
})
