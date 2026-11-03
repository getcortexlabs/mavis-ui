import { expect, test, type Page } from '@playwright/test'

function observeErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  return errors
}

test('touch long press reorders through viewport edge scrolling', async ({
  browser,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Touch input injection uses the Chromium device protocol.')
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  })
  try {
    const page = await context.newPage()
    const errors = observeErrors(page)
    await page.goto('/playground/#/showcase/current?lang=en')
    await expect(page.locator('#current-status')).toContainText('ready')
    const handle = page.locator('#current-handle-note-1')
    await handle.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
    const box = (await handle.boundingBox())!
    const scroll = page.locator('#current-screen')
    const before = await scroll.evaluate((el) => el.scrollTop)
    const client = await context.newCDPSession(page)
    const x = box.x + box.width / 2,
      y = box.y + box.height / 2
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y, id: 1 }],
    })
    await page.waitForTimeout(450)
    for (let step = 1; step <= 12; step++)
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x, y: y + ((820 - y) * step) / 12, id: 1 }],
      })
    await expect.poll(() => scroll.evaluate((el) => el.scrollTop)).toBeGreaterThan(before + 100)
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await expect(page.locator('#current-status')).toContainText('1 moves')
    const order = await page
      .locator('#current-collection .m-card[id]')
      .evaluateAll((nodes) => nodes.map((node) => node.id))
    expect(order.indexOf('current-note-1')).toBeGreaterThan(0)
    expect(errors).toEqual([])
  } finally {
    await context.close()
  }
})

test('shared gradients, loading and text preserve app state through replacement and reduced motion', async ({
  page,
}) => {
  const errors = observeErrors(page)
  await page.goto('/playground/#/showcase/lustre?lang=en')
  const paint = page.locator('#lustre-paint')
  await expect
    .poll(() => paint.evaluate((el) => getComputedStyle(el).backgroundImage))
    .toContain('linear-gradient')
  await page.locator('#lustre-radial').click()
  await expect
    .poll(() => paint.evaluate((el) => getComputedStyle(el).backgroundImage))
    .toContain('radial-gradient')
  const before = await paint.evaluate((el) => getComputedStyle(el).backgroundImage)
  await page.locator('#lustre-shift').click()
  await expect
    .poll(() => paint.evaluate((el) => getComputedStyle(el).backgroundImage))
    .not.toBe(before)
  await page.locator('#lustre-conic').click()
  await expect
    .poll(() => paint.evaluate((el) => getComputedStyle(el).backgroundImage))
    .toContain('conic-gradient')
  await paint.click()
  await expect(page.locator('#lustre-presses')).toHaveText('1 presses')
  await page.locator('#lustre-replace').click()
  await expect
    .poll(() => paint.evaluate((el) => getComputedStyle(el).backgroundImage))
    .toContain('conic-gradient')
  const amount = page.locator('#lustre-amount')
  const original = await amount.evaluateHandle((el) => el.firstChild)
  await page.locator('#lustre-roll').click({ clickCount: 3 })
  await expect(amount).toHaveText('14,159')
  expect(await amount.evaluate((el, node) => el.firstChild === node, original)).toBe(true)
  await page.locator('#lustre-loader-ring').click()
  await expect(page.locator('#lustre-busy')).toHaveAttribute('aria-busy', 'true')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.locator('#lustre-text').click()
  await expect(page.locator('#lustre-heading')).toHaveText('A different light.')
  await page.locator('#lustre-loading-toggle').click()
  await expect(page.locator('#lustre-busy')).not.toHaveAttribute('aria-busy', 'true')
  await page.locator('#lustre-mount').click()
  await expect(paint).toHaveCount(0)
  await page.locator('#lustre-mount').click()
  await expect(paint).toHaveCount(1)
  await page.locator('#lustre-back').click()
  expect(errors).toEqual([])
})

test('circular conceal retains layout and removes controls from keyboard interaction through reversal', async ({
  page,
}) => {
  const errors = observeErrors(page)
  await page.goto('/playground/#/showcase/lustre?lang=en')
  const panel = page.locator('#lustre-circle'),
    toggle = page.locator('#lustre-circle-toggle')
  await expect(toggle).toBeEnabled()
  const box = (await panel.boundingBox())!
  await toggle.click()
  await expect(panel).toHaveAttribute('inert', '')
  await toggle.click()
  await expect(panel).not.toHaveAttribute('inert', '')
  await toggle.click()
  await expect.poll(() => panel.evaluate((el) => getComputedStyle(el).visibility)).toBe('hidden')
  expect(
    Math.abs((await panel.evaluate((el) => el.getBoundingClientRect().height)) - box.height),
  ).toBeLessThan(1)
  await toggle.focus()
  await page.keyboard.press('Tab')
  await expect(page.locator('#lustre-inside')).not.toBeFocused()
  await toggle.click()
  await expect(panel).toBeVisible()
  await expect(panel).not.toHaveAttribute('aria-hidden', 'true')
  expect(errors).toEqual([])
})

test('retained header anchors inserted rows and reorder preserves keyed host data', async ({
  page,
}) => {
  const errors = observeErrors(page)
  await page.goto('/playground/#/showcase/current?lang=en')
  await expect(page.locator('#current-status')).toContainText('ready')
  await page.locator('#current-jump').click()
  const anchor = page.locator('#current-note-8')
  const top = (await anchor.boundingBox())!.y
  await page.locator('#current-insert').click()
  await expect(page.locator('#current-new-1')).toHaveCount(1)
  await expect.poll(async () => Math.abs((await anchor.boundingBox())!.y - top)).toBeLessThan(3)
  const handle = page.locator('#current-handle-note-8')
  await handle.focus()
  await handle.press('Space')
  await handle.press('ArrowDown')
  await handle.press('Space')
  await expect(page.locator('#current-status')).toContainText('1 moves')
  await expect(handle).toBeFocused()
  const order = await page
    .locator('#current-collection .m-card[id]')
    .evaluateAll((nodes) => nodes.map((node) => node.id))
  expect(order.indexOf('current-note-8')).toBe(order.indexOf('current-note-9') + 1)
  await page.locator('#current-top').click()
  await page.locator('#current-large').click()
  await expect
    .poll(() => page.locator('#current-header').evaluate((el) => el.getBoundingClientRect().height))
    .toBe(310)
  await page.locator('#current-back').click()
  expect(errors).toEqual([])
})

test('guarded refresh supports failure, retry and cancellation without stale writes', async ({
  page,
}) => {
  const errors = observeErrors(page)
  await page.goto('/playground/#/showcase/current?lang=en')
  await expect(page.locator('#current-status')).toContainText('ready')
  await page.locator('#current-fail').click()
  await page.locator('#current-refresh').click()
  await expect(page.locator('#current-error')).toHaveText('Could not refresh. Try again.')
  await page.locator('#current-refresh').click()
  await expect(page.locator('#current-status')).toContainText('1 refreshes')
  await page.locator('#current-refresh').click()
  await page.locator('#current-cancel').click()
  await expect(page.locator('#current-cancel')).toHaveCount(0)
  await page.waitForTimeout(1000)
  await expect(page.locator('#current-status')).toContainText('1 refreshes')
  await page.locator('#current-refresh').click()
  await page.locator('#current-back').click()
  await page.waitForTimeout(1000)
  expect(errors).toEqual([])
})

test('pointer moves, keyboard cancellation and disabled handles keep one host-owned order', async ({
  page,
}) => {
  const errors = observeErrors(page)
  await page.goto('/playground/#/showcase/current?lang=en')
  await expect(page.locator('#current-status')).toContainText('ready')
  const handle = page.locator('#current-handle-note-1')
  await handle.focus()
  await handle.press('Space')
  await handle.press('ArrowDown')
  await handle.press('Escape')
  await expect(page.locator('#current-status')).toContainText('0 moves')
  await expect(handle).toBeFocused()
  await page.locator('#current-disable').click()
  await expect(handle).toBeDisabled()
  await page.locator('#current-disable').click()
  await handle.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
  const box = (await handle.boundingBox())!
  const nextRow = (await page.locator('#current-note-2').boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2, nextRow.y + nextRow.height * 0.8, { steps: 12 })
  await page.mouse.up()
  await expect(page.locator('#current-status')).toContainText('1 moves')
  await page.locator('#current-remove').click()
  await expect(page.locator('#current-note-18')).toHaveCount(0)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  // Also exercise the explicit move action by keyboard after pointer pickup/drop.
  await page.locator('#current-down-note-2').press('Enter')
  await expect(page.locator('#current-status')).toContainText('2 moves')
  await page.locator('#current-mount').click()
  await expect(page.locator('#current-collection')).toHaveCount(0)
  await page.locator('#current-mount').click()
  await expect(page.locator('#current-status')).toContainText('ready')
  await page.locator('#current-down-note-2').press('Enter')
  await expect(page.locator('#current-status')).toContainText('3 moves')
  const count = await page.locator('#current-collection .m-card[id]').count()
  for (let index = 0; index < count; index++) await page.locator('#current-remove').click()
  await expect(page.locator('#current-collection .m-card[id]')).toHaveCount(0)
  await page.locator('#current-insert').click()
  await expect(page.locator('#current-new-1')).toBeVisible()
  await page.locator('#current-back').click()
  expect(errors).toEqual([])
})
