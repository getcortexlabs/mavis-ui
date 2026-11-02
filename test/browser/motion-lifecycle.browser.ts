import { expect, test, type Page } from '@playwright/test'

const path = '/playground/#/checks/lifecycles?lang=en'
async function open(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.route('**/images/mavis.webp', (route) =>
    route.fulfill({ path: 'docs/public/images/mavis.webp', contentType: 'image/webp' }),
  )
  await page.goto(path)
  await expect(page.locator('#afterglow-edition')).toBeVisible()
  return errors
}
async function snapshot(page: Page) {
  await page.getByRole('button', { name: 'Read snapshot', exact: true }).click()
  return JSON.parse((await page.locator('#afterglow-snapshot').textContent())!)
}
async function pose(page: Page) {
  return page.locator('#afterglow-edition').evaluate((element) => {
    const m = new DOMMatrixReadOnly(getComputedStyle(element).transform)
    return { x: m.m41, y: m.m42, scale: m.a }
  })
}

test('pointer follows a stable region, press composes, and removing one owner leaves scale alive', async ({
  page,
}) => {
  const errors = await open(page)
  await expect.poll(async () => (await snapshot(page)).resources.pointerFollowers).toBe(1)
  const card = page.locator('#afterglow-edition')
  await card.scrollIntoViewIfNeeded()
  const box = (await card.boundingBox())!
  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.4)
  await expect.poll(async () => (await pose(page)).x).toBeGreaterThan(2)
  await page.mouse.down()
  await expect.poll(async () => (await pose(page)).scale).toBeLessThan(1.01)
  // Release outside the button so the proof doesn't navigate into the detail view.
  await page.mouse.move(2, 2)
  await page.mouse.up()
  await expect.poll(async () => (await pose(page)).scale).toBeCloseTo(1.025, 2)
  await page.getByRole('button', { name: 'Remove pointer owner', exact: true }).click()
  const after = await snapshot(page)
  expect(after.resources.pointerFollowers).toBe(0)
  expect(after.resources.values).toBe(1)
  expect(
    after.targets.some((target: { channels: { property: string; kind: string }[] }) =>
      target.channels.some((channel) => channel.property === 'scaleX' && channel.kind === 'value'),
    ),
  ).toBe(true)
  expect(after.eventCount).toBeLessThanOrEqual(80)
  await expect.poll(async () => (await snapshot(page)).resources.frameTasks).toBe(0)
  expect(errors).toEqual([])
})

test('diagnostics distinguish a partial takeover from the pointer and press owners', async ({
  page,
}) => {
  const errors = await open(page)
  await page.getByRole('button', { name: 'Replace horizontal owner', exact: true }).click()
  const state = await snapshot(page)
  const channels = state.targets.flatMap(
    (target: { channels: { property: string; kind: string }[] }) => target.channels,
  )
  expect(channels).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ property: 'y', kind: 'value' }),
      expect.objectContaining({ property: 'x', kind: 'rest' }),
      expect.objectContaining({ property: 'scaleX', kind: 'value' }),
    ]),
  )
  expect(state.resources.pointerFollowers).toBe(1)
  expect(state.eventCount).toBeGreaterThan(0)
  await page.getByRole('button', { name: 'Remove surface', exact: true }).click()
  const removed = await snapshot(page)
  expect(removed.resources.pointerFollowers).toBe(0)
  expect(removed.resources.values).toBe(0)
  // The region and its two remaining controls retain their Jolt Vue attachment scopes.
  expect(removed.resources.scopes).toBe(3)
  expect(removed.resources.frameTasks).toBe(0)
  expect(errors).toEqual([])
})

test('shared identity survives replacement, reversal, missing targets and KeepAlive without duplicate owners', async ({
  page,
}) => {
  const errors = await open(page)
  for (let index = 0; index < 3; index++) {
    await page.getByRole('button', { name: 'Explore the edition', exact: true }).click()
    await expect(
      page.getByRole('button', { name: 'Back to the edition', exact: true }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Back to the edition', exact: true }).click()
    await expect(page.locator('#afterglow-status')).toHaveText('completed')
    const state = await snapshot(page)
    expect(state.resources.pointerFollowers).toBe(1)
    expect(state.resources.values).toBe(5)
    expect(state.resources.scopes).toBe(9)
    expect(state.resources.sharedLayouts).toBe(1)
  }
  await page.getByRole('button', { name: 'Remove surface', exact: true }).click()
  const removed = await snapshot(page)
  expect(removed.resources.pointerFollowers).toBe(0)
  expect(removed.resources.values).toBe(0)
  // The region and its two remaining controls retain their Jolt Vue attachment scopes.
  expect(removed.resources.scopes).toBe(3)
  await page.getByRole('button', { name: 'Restore surface', exact: true }).click()
  await page.getByRole('button', { name: 'Deactivate scene', exact: true }).click()
  await expect(page.locator('#afterglow-edition')).toHaveCount(0)
  await page.getByRole('button', { name: 'Activate scene', exact: true }).click()
  const resumed = await snapshot(page)
  expect(resumed.resources.pointerFollowers).toBe(1)
  expect(resumed.resources.values).toBe(5)
  expect(resumed.resources.scopes).toBe(9)
  expect(errors).toEqual([])
})

test('modal top-layer motion ignores an animated DOM ancestor and keeps focus, input and dismissal', async ({
  page,
}) => {
  const errors = await open(page)
  for (let index = 0; index < 2; index++) {
    await page.getByRole('button', { name: 'Plan your evening', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'A little room for possibility' })
    await expect(dialog).toBeVisible()
    const panel = dialog.locator('.m-sheet-panel')
    await expect
      .poll(() =>
        panel.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42),
      )
      .toBeCloseTo(0, 0)
    const handle = (await dialog.locator('.m-sheet-handle').boundingBox())!
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2)
    await page.mouse.down()
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2 + 35, {
      steps: 8,
    })
    // Opening alone would also pass with the static fallback. Prove actual Jolt drag.
    await expect
      .poll(() =>
        panel.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42),
      )
      .toBeGreaterThan(15)
    await page.waitForTimeout(150) // Release at rest, rather than flinging toward the closed snap.
    await page.mouse.up()
    await expect
      .poll(() =>
        panel.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42),
      )
      .toBeCloseTo(0, 0)
    await dialog.getByRole('textbox', { name: 'A note for the host' }).fill('See you at seven')
    await expect(dialog.getByRole('textbox')).toHaveValue('See you at seven')
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
  }
  await page.getByRole('button', { name: /Your arrival/ }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('option', { name: 'After hours · 20:30' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByRole('button', { name: /Your arrival/ })).toContainText('After hours')
  expect(errors).toEqual([])
})

test('failed sheet enhancement still allows typing, closing and reopening', async ({ page }) => {
  const errors = await open(page)
  // An unsupported transform on the actual animated panel, rather than an ancestor
  // outside its top-layer coordinate space, exercises partial setup cleanup.
  await page.addStyleTag({
    content: '.m-sheet-panel { transform: perspective(400px) rotateY(5deg) !important; }',
  })
  await page.getByRole('button', { name: 'Plan your evening', exact: true }).click()
  await page.getByRole('textbox', { name: 'A note for the host' }).fill('Still usable')
  await page.getByRole('button', { name: 'See you there', exact: true }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await page.getByRole('button', { name: 'Plan your evening', exact: true }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  expect(errors).toEqual([])
})

test('viewport entrances are opt-in and leave readable content without observation or with reduced motion', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'IntersectionObserver', { value: undefined, configurable: true })
  })
  const errors = await open(page)
  for (let index = 0; index < 3; index++) {
    const panel = page.locator(`#afterglow-stop-${index}`)
    await panel.scrollIntoViewIfNeeded()
    await expect(panel).toBeVisible()
    expect(await panel.evaluate((element) => getComputedStyle(element).opacity)).toBe('1')
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('button', { name: 'Explore the edition', exact: true }).click()
  await expect(page.getByText('An open studio.', { exact: false })).toBeVisible()
  await expect.poll(async () => (await snapshot(page)).resources.frameTasks).toBe(0)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  expect(errors).toEqual([])
})

test('decoded portrait transition leaves one semantic image and no presentation copies after completion', async ({
  page,
}) => {
  const errors = await open(page)
  const portrait = page.locator('#afterglow-portrait')
  await portrait.scrollIntoViewIfNeeded()
  await expect
    .poll(() =>
      portrait
        .locator('img')
        .evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
    )
    .toBe(true)
  await portrait.click()
  await expect(portrait.getByText('Finding the extraordinary', { exact: false })).toBeVisible()
  await expect.poll(() => page.locator('[popover]:popover-open').count()).toBe(0)
  await expect(page.getByRole('img', { name: 'Mavis', exact: true })).toHaveCount(1)
  expect(errors).toEqual([])
})
