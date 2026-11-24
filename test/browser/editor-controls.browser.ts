import { test, expect } from '@playwright/test'

test('editing multiple photo tags handles paste, duplicates, IME, and removal', async ({
  page,
}) => {
  await page.goto('/playground/#/preview/tag-input?lang=en')
  const input = page.getByRole('textbox', { name: 'Photo tags' })
  await input.fill('night')
  await input.press('Enter')
  await expect(input).toHaveValue('')
  await expect(page.getByRole('button', { name: 'Remove night', exact: true })).toBeVisible()
  await input.evaluate((field) => {
    const paste = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(paste, 'clipboardData', {
      value: { getData: () => '  Night,Sunrise\nGrain  ' },
    })
    field.dispatchEvent(paste)
  })
  await expect(page.getByRole('button', { name: 'Remove night', exact: true })).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Remove Sunrise', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Remove Grain', exact: true })).toBeVisible()
  await input.press('Backspace')
  await expect(page.getByRole('button', { name: 'Remove Grain', exact: true })).toHaveCount(0)
  await input.dispatchEvent('compositionstart')
  await input.fill('海,浜')
  await expect(page.getByRole('button', { name: 'Remove 海', exact: true })).toHaveCount(0)
  await input.dispatchEvent('compositionend')
  await expect(page.getByRole('button', { name: 'Remove 海', exact: true })).toBeVisible()
  await expect(input).toHaveValue('浜')
  await page.getByRole('button', { name: 'Remove night', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Remove night', exact: true })).toHaveCount(0)
})

test('portrait stack has visible overlap and an exact overflow count', async ({ page }, info) => {
  await page.goto('/playground/#/preview/avatar-group?lang=en')
  const group = page.locator('.m-avatar-group')
  await expect(group.locator('.m-avatar')).toHaveCount(3)
  await expect(group).toContainText('+2')
  const boxes = await group
    .locator('.m-avatar')
    .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().toJSON()))
  expect(boxes[1].left).toBeGreaterThan(boxes[0].left)
  expect(boxes[1].left).toBeLessThan(boxes[0].right)
  await info.attach('contributor credits', {
    body: await page.locator('[data-testid="component-preview"]').screenshot(),
    contentType: 'image/png',
  })
  await page.getByRole('button', { name: 'Show all 5 credits' }).click()
  await expect(group.locator('.m-avatar')).toHaveCount(5)
  await expect(group).not.toContainText('+2')
})

test('search submits the editor value, restores focus on clear and lets the owner cancel', async ({
  page,
}) => {
  await page.goto('/playground/#/preview/search-bar?lang=en')
  const field = page.getByRole('textbox', { name: 'Find a photo' })
  await field.fill('Alpine')
  await expect(page.getByText('Atlantic tides', { exact: true })).toHaveCount(0)
  await expect(page.getByText('The still lake', { exact: true })).toBeVisible()
  await field.press('Enter')
  await expect(page.getByText('Results for “Alpine”')).toBeVisible()
  await page.getByRole('button', { name: 'Clear search' }).click()
  await expect(field).toHaveValue('')
  await expect(field).toBeFocused()
  await field.fill('nonsense')
  await expect(page.getByText('No photographs match this search.')).toBeVisible()
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(field).toHaveValue('')
  await expect(page.getByText('Atlantic tides', { exact: true })).toBeVisible()
})

test('refresh preserves viewport position when prepending and drops a stale edition', async ({
  page,
}) => {
  await page.goto('/playground/#/preview/refresh-control?lang=en')
  const region = page.getByRole('region', { name: 'Your morning edition', exact: true })
  const row = region.locator('#story-3')
  await expect(row).toBeVisible()
  await region.evaluate((el) => {
    el.scrollTop = 165
  })
  const relativeY = () =>
    row.evaluate(
      (el) =>
        el.getBoundingClientRect().top - el.closest('[role=region]')!.getBoundingClientRect().top,
    )
  const before = await relativeY()
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await expect(region.locator('#story-6')).toHaveCount(1)
  await expect.poll(async () => Math.abs((await relativeY()) - before)).toBeLessThan(2)
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Cancel refresh' })).toBeVisible()
  await page.getByRole('button', { name: 'Switch edition' }).click()
  await expect(region.locator('#story-6')).toHaveCount(0)
  await expect(region.locator('#refresh-edition')).toHaveText('Edition 1')
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await expect(region.locator('#refresh-edition')).toHaveText('Edition 2')
  await expect(region.locator('#story-7')).toHaveCount(0)
})

test('a zoomed photo pans without dismissing the dialog', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/playground/#/preview/image-viewer?lang=en')
  await page.getByRole('button', { name: 'Above the clouds', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Postcards' })
  await dialog.getByRole('button', { name: 'Zoom in', exact: true }).click()
  await expect(dialog.getByRole('button', { name: /150%/ })).toBeVisible()
  const box = (await dialog.getByRole('img', { name: 'Above the clouds' }).boundingBox())!
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + 12, y + 100, { steps: 8 })
  await page.mouse.up()
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: /150%/ })).toBeVisible()
})

test('sheet composer keeps its draft through resize and reopen without its own keyboard transform', async ({
  page,
}) => {
  await page.goto('/playground/#/preview/composer?lang=en')
  const open = page.getByRole('button', { name: 'Edit in sheet', exact: true })
  await open.click()
  const dialog = page.getByRole('dialog', { name: 'Edit draft' })
  const field = dialog.getByRole('textbox', { name: 'Draft in sheet' })
  await field.fill('Hold this line')
  await page.setViewportSize({ width: 780, height: 420 })
  await expect(field).toBeInViewport()
  const composer = dialog.locator('.m-composer')
  expect(await composer.evaluate((el) => getComputedStyle(el).transform)).toMatch(
    /^(none|matrix\(1, 0, 0, 1, 0, 0\))$/,
  )
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await open.click()
  await expect(field).toHaveValue('Hold this line')
})

test('a two-finger pinch keeps the photo open until a single-finger dismissal at minimum zoom', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Multi-contact input uses Chromium DevTools.')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const touch = await page.context().newCDPSession(page)
  await touch.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
  await page.goto('/playground/#/preview/image-viewer?lang=en')
  await page.getByRole('button', { name: 'Above the clouds', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Postcards' })
  const percentage = dialog.getByRole('button', { name: /\d+%/ })
  await expect(dialog.getByRole('button', { name: 'Zoom in', exact: true })).toBeEnabled()
  const rect = (await dialog
    .getByRole('img', { name: 'Above the clouds' })
    .locator('..')
    .boundingBox())!
  const x = rect.x + rect.width / 2,
    y = rect.y + rect.height / 2
  const pair = (radius: number) => [
    { x: x - radius, y, id: 1 },
    { x: x + radius, y, id: 2 },
  ]
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pair(20) })
  for (const radius of [24, 30, 38, 48, 52])
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pair(radius) })
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect(percentage).not.toHaveText('100%')
  await percentage.click()
  await expect(percentage).toHaveText('100%')
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y: y - rect.height * 0.2, id: 1 }],
  })
  for (const delta of [-0.1, 0, 0.1, 0.2, 0.3])
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y: y + rect.height * delta, id: 1 }],
    })
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect(dialog).not.toBeVisible()
})
