import { readFileSync } from 'node:fs'
import { expect, test, type Locator, type Page } from '@playwright/test'

const pose = (target: Locator) =>
  target.evaluate((element) => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform)
    return { x: matrix.m41, y: matrix.m42, scale: Math.hypot(matrix.a, matrix.b) }
  })
const near = async (
  target: Locator,
  property: 'x' | 'y' | 'scale',
  value: number,
  tolerance = 0.01,
) =>
  expect.poll(async () => Math.abs((await pose(target))[property] - value)).toBeLessThan(tolerance)
async function contact(page: Page, target: Locator) {
  await target.scrollIntoViewIfNeeded()
  const box = (await target.boundingBox())!
  const point = { x: box.x + box.width / 2, y: box.y + Math.min(30, box.height / 2) }
  await page.mouse.move(point.x, point.y)
  await page.mouse.down()
  return point
}

test('retargets a continuous spring through press, pauses and resumes without replacing the surface', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/playground/#/showcase/kinetic?lang=en')
  const card = page.locator('#kinetic-card')
  await near(card, 'scale', 1)
  await page.getByRole('button', { name: 'Retarget while held', exact: true }).click()
  await contact(page, card)
  await near(card, 'scale', 1.08 * 0.97, 0.004)
  await page.mouse.up()
  await near(card, 'scale', 1.08, 0.004)
  // Let the independent 450 ms release layer finish before measuring a paused follower.
  await page.waitForTimeout(650)
  await page.getByRole('button', { name: 'Pause spring', exact: true }).click()
  const held = (await pose(card)).scale
  await page.getByRole('button', { name: 'Retarget spring', exact: true }).click()
  await page.waitForTimeout(200)
  expect((await pose(card)).scale).toBeCloseTo(held, 3)
  await page.getByRole('button', { name: 'Resume spring', exact: true }).click()
  await near(card, 'scale', 0.94, 0.004)
  await page.getByRole('button', { name: 'Retarget spring', exact: true }).click()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await near(card, 'scale', 1.08, 0.004)
  expect(errors).toEqual([])
})

test('drags, snaps, catches a release and keeps genuine pointer and keyboard activation', async ({
  page,
}) => {
  await page.goto('/playground/#/showcase/kinetic?lang=en')
  const card = page.locator('#kinetic-card')
  await near(card, 'y', 0)
  const start = await contact(page, card)
  await page.mouse.move(start.x + 37, start.y, { steps: 10 })
  await near(card, 'x', 37, 1)
  await page.mouse.up()
  await near(card, 'x', 40, 0.1)
  await expect(page.locator('#kinetic-count')).toContainText('0 activations')
  await page.getByRole('button', { name: 'Left', exact: true }).click()
  await page.waitForTimeout(70)
  await card.evaluate((element) => {
    element.addEventListener(
      'pointerdown',
      () => {
        element.setAttribute(
          'data-catch-x',
          String(new DOMMatrixReadOnly(getComputedStyle(element).transform).m41),
        )
      },
      { once: true, capture: true },
    )
  })
  const catchPoint = await contact(page, card)
  const after = await pose(card)
  const before = Number(await card.getAttribute('data-catch-x'))
  // Sample at the input boundary, rather than including test-runner round trips.
  expect(Math.abs(after.x - before)).toBeLessThan(2)
  await page.mouse.move(catchPoint.x + 18, catchPoint.y, { steps: 6 })
  await page.mouse.up()
  await page.waitForTimeout(700)
  await card.click()
  await expect(page.locator('#kinetic-count')).toContainText('1 activations')
  await card.press('Enter')
  await expect(page.locator('#kinetic-count')).toContainText('2 activations')
})

test('drops input on disable and disposes active motion before a replacement mounts', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/playground/#/showcase/kinetic?lang=en')
  const card = page.locator('#kinetic-card')
  const point = await contact(page, card)
  await page.mouse.move(point.x + 30, point.y, { steps: 5 })
  // Keyboard activation on another control changes state while the pointer remains down.
  await page.getByRole('button', { name: 'Disable card', exact: true }).press('Enter')
  const held = (await pose(card)).x
  await page.mouse.move(point.x - 40, point.y, { steps: 5 })
  await page.mouse.up()
  expect((await pose(card)).x).toBeCloseTo(held, 1)
  await page.getByRole('button', { name: 'Enable card', exact: true }).click()
  await page.getByRole('button', { name: 'Retarget spring', exact: true }).click()
  await page.getByRole('button', { name: 'Remove card', exact: true }).click()
  await expect(card).toHaveCount(0)
  await page.getByRole('button', { name: 'Mount card', exact: true }).click()
  await near(card, 'scale', 1, 0.004)
  await near(card, 'x', 0)
  await page.getByRole('button', { name: 'Right', exact: true }).click()
  await near(card, 'x', 40, 0.1)
  expect(errors).toEqual([])
})

test('Sheet handle snaps back, dismisses and preserves modal focus', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/playground/#/showcase/kinetic?lang=en')
  const opener = page.getByRole('button', { name: 'Open notes', exact: true })
  await opener.focus()
  await opener.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'A note to keep' })
  const panel = dialog.locator('.m-sheet-panel')
  const handle = dialog.locator('.m-sheet-handle')
  await near(panel, 'y', 0, 0.1)
  let point = await contact(page, handle)
  await page.mouse.move(point.x, point.y + 40, { steps: 10 })
  await page.waitForTimeout(100) // Release with no fling: the nearest stop is open.
  await page.mouse.up()
  await near(panel, 'y', 0, 0.1)
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Close notes', exact: true })).toBeFocused()
  point = await contact(page, handle)
  await page.mouse.move(point.x, point.y + 280, { steps: 12 })
  await page.mouse.up()
  await expect(dialog).toBeHidden()
  await expect(opener).toBeFocused()
  expect(errors).toEqual([])
})

test('Sheet keeps body scrolling and cancels a drag when geometry changes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 480 })
  await page.goto('/playground/#/preview/sheet?lang=en')
  await page.getByRole('button', { name: 'Full screen', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Details' })
  const panel = dialog.locator('.m-sheet-panel')
  await near(panel, 'y', 0, 0.1)
  const body = dialog.locator('.m-sheet-body')
  await body.hover()
  await page.mouse.wheel(0, 800)
  await expect.poll(() => body.evaluate((element) => element.scrollTop)).toBeGreaterThan(0)
  await near(panel, 'y', 0, 0.1)
  const point = await contact(page, dialog.locator('.m-sheet-handle'))
  await page.mouse.move(point.x, point.y + 70, { steps: 6 })
  await page.setViewportSize({ width: 520, height: 680 })
  await page.mouse.up()
  await near(panel, 'y', 0, 0.1)
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('Sheet rejects dismissal, reopens during departure and removes active ownership', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/playground/#/checks/sheet')
  const trigger = page.getByRole('button', { name: 'Open sheet', exact: true })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Lifecycle' })
  const panel = dialog.locator('.m-sheet-panel')
  await dialog.getByRole('textbox', { name: 'Draft' }).fill('Keep this draft')
  await dialog
    .getByRole('textbox', { name: 'Draft' })
    .evaluate((element) => element.setAttribute('data-presentation', 'original'))
  await dialog.getByRole('button', { name: 'Close and reopen' }).click()
  await near(panel, 'y', 0, 0.1)
  await expect(dialog.getByRole('textbox', { name: 'Draft' })).toHaveValue('Keep this draft')
  await expect(dialog.getByRole('textbox', { name: 'Draft' })).toHaveAttribute(
    'data-presentation',
    'original',
  )
  await dialog.getByRole('button', { name: 'Reject dismissal' }).click()
  const point = await contact(page, dialog.locator('.m-sheet-handle'))
  await page.mouse.move(point.x, point.y + 360, { steps: 15 })
  await page.mouse.up()
  await near(panel, 'y', 0, 0.1)
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Accept dismissal' }).click()
  await dialog.getByRole('button', { name: 'Disable dismissal' }).click()
  await expect(dialog.locator('.m-sheet-handle')).toBeHidden()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'More content' }).click()
  await near(panel, 'y', 0, 0.1)
  await dialog.getByRole('button', { name: 'Enable dismissal' }).click()
  await contact(page, dialog.locator('.m-sheet-handle'))
  await dialog.getByRole('button', { name: 'Remove presentation' }).press('Enter')
  await page.mouse.up()
  await expect(dialog).toHaveCount(0)
  await page.getByRole('button', { name: 'Mount sheet', exact: true }).click()
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  expect(errors).toEqual([])
})

test('continuous motion stops requesting frames at rest and after repeated removal', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const frame = window.requestAnimationFrame.bind(window)
    let count = 0
    Object.defineProperty(window, '__motionFrameCount', { get: () => count })
    window.requestAnimationFrame = (callback) =>
      frame((time) => {
        count++
        callback(time)
      })
  })
  await page.goto('/playground/#/showcase/kinetic?lang=en')
  for (let n = 0; n < 3; n++) {
    await page.getByRole('button', { name: 'Retarget spring', exact: true }).click()
    await page.getByRole('button', { name: 'Remove card', exact: true }).click()
    await page.getByRole('button', { name: 'Mount card', exact: true }).click()
  }
  await page.waitForTimeout(1400)
  const frames = () => page.evaluate(() => Reflect.get(window, '__motionFrameCount') as number)
  const before = await frames()
  await page.waitForTimeout(250)
  expect(await frames()).toBe(before)
  await page.getByRole('button', { name: 'Remove card', exact: true }).click()
  await page.waitForTimeout(700)
  const after = await frames()
  await page.waitForTimeout(250)
  expect(await frames()).toBe(after)
})

test('recognizes touch drag on the card and Sheet handle', async ({ page, browserName }) => {
  test.skip(
    browserName !== 'chromium',
    'CDP touch injection; WebKit uses real pointer coverage above.',
  )
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 })
  await page.goto('/playground/#/showcase/kinetic?lang=en')
  const swipe = async (target: Locator, dx: number, dy: number) => {
    await target.scrollIntoViewIfNeeded()
    const box = (await target.boundingBox())!
    const x = box.x + box.width / 2,
      y = box.y + Math.min(25, box.height / 2)
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y, id: 1 }],
    })
    for (let n = 1; n <= 8; n++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: x + (dx * n) / 8, y: y + (dy * n) / 8, id: 1 }],
      })
      await page.waitForTimeout(16)
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  }
  const card = page.locator('#kinetic-card')
  await near(card, 'y', 0, 0.1)
  await swipe(card, 40, 0)
  await near(card, 'x', 40, 0.1)
  await expect(page.locator('#kinetic-count')).toContainText('0 activations')
  await page.getByRole('button', { name: 'Open notes', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'A note to keep' })
  await near(dialog.locator('.m-sheet-panel'), 'y', 0, 0.1)
  await swipe(dialog.locator('.m-sheet-handle'), 0, 300)
  await expect(dialog).toBeHidden()
})

const field = '/playground/#/showcase/field-guide?lang=en'
const resetScroll = async (page: Page, offset = 0) => {
  await page.locator('#field-screen').evaluate((element, top) => {
    // Release the control below the viewport before deliberately resetting scroll.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    element.scrollTop = top
  }, offset)
  await expect
    .poll(() => page.locator('#field-screen').evaluate((el) => el.scrollTop))
    .toBeCloseTo(offset, 0)
}

test('rebases responsive and delayed text geometry while preserving the surface and held press', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(field)
  const card = page.locator('#field-card')
  const button = page.locator('#field-button')
  await card.evaluate((el) => {
    el.dataset.original = 'yes'
  })
  await page.getByRole('button', { name: 'Change while held', exact: true }).click()
  await resetScroll(page)
  await contact(page, card)
  await expect(card.getByText('Look closer.', { exact: false })).toBeVisible()
  await page.setViewportSize({ width: 600, height: 844 })
  await near(card, 'scale', 0.97, 0.005)
  await expect(card).toHaveAttribute('data-original', 'yes')
  const geometry = await card.evaluate((el) => {
    const css = getComputedStyle(el)
    return {
      origin: css.transformOrigin.split(' ').map(parseFloat),
      width: (el as HTMLElement).offsetWidth,
      height: (el as HTMLElement).offsetHeight,
      inline: el.style.transformOrigin,
    }
  })
  expect(geometry.inline).toBe('')
  expect(geometry.origin[0]).toBeCloseTo(geometry.width / 2, 0)
  expect(geometry.origin[1]).toBeCloseTo(geometry.height / 2, 0)
  await page.mouse.up()
  await near(card, 'scale', 1)
  await expect(button).toHaveAttribute('aria-busy', 'true')
  await near(button, 'scale', 1.04)
  expect(errors).toEqual([])
})

test('maps one continuous source to position, opacity and scale without Vue frame updates', async ({
  page,
}) => {
  await page.goto('/playground/#/showcase/kinetic?lang=en')
  const card = page.locator('#kinetic-card')
  await page.getByRole('button', { name: 'Retarget spring', exact: true }).click()
  await near(card, 'scale', 1.08, 0.004)
  await near(card, 'y', -16, 0.08)
  await page.getByRole('button', { name: 'Retarget spring', exact: true }).click()
  await near(card, 'y', 12, 0.08)
  await expect
    .poll(async () => Number(await card.evaluate((el) => getComputedStyle(el).opacity)))
    .toBeCloseTo(0.65, 2)
})

test('links actual Screen wheel/keyboard input and switches between automatic and scheduler execution', async ({
  page,
  browserName,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(field)
  const card = page.locator('#field-card')
  const screen = page.locator('#field-screen')
  await page.mouse.move(20, 300)
  await page.mouse.wheel(0, 180)
  await expect.poll(() => screen.evaluate((el) => el.scrollTop)).toBeGreaterThan(100)
  // Wheel scrolling can continue between frames. Sample source and target together.
  await expect
    .poll(() =>
      screen.evaluate((el) => {
        const target = el.querySelector('#field-card')!
        const y = new DOMMatrixReadOnly(getComputedStyle(target).transform).m42
        return Math.abs(y - Math.min(240, el.scrollTop) / 3)
      }),
    )
    .toBeLessThan(1)
  const automatic = await card.evaluate((el) =>
    el.getAnimations().some((a) => a.timeline?.constructor.name === 'ScrollTimeline'),
  )
  if (browserName === 'chromium') expect(automatic).toBe(true)
  await page.getByRole('button', { name: 'Use fallback', exact: true }).click()
  await resetScroll(page, 120)
  await near(card, 'y', 40, 0.5)
  expect(
    await card.evaluate((el) =>
      el.getAnimations().some((a) => a.timeline?.constructor.name === 'ScrollTimeline'),
    ),
  ).toBe(false)
  const point = await contact(page, card)
  await near(card, 'scale', 0.95 * 0.97, 0.005)
  await page.mouse.up()
  await near(card, 'scale', 0.95, 0.005)
  await screen.focus()
  await expect(screen).toBeFocused()
  await page.keyboard.press('PageDown')
  await expect.poll(() => screen.evaluate((el) => el.scrollTop)).toBeGreaterThan(120)
  expect(point.x).toBeGreaterThan(0)
  expect(errors).toEqual([])
})

test('keeps unrelated scroll channels after interruption, reduced motion and content changes', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(field)
  const card = page.locator('#field-card')
  await page.getByRole('button', { name: 'Release position', exact: true }).click()
  await resetScroll(page, 180)
  await near(card, 'y', 12)
  await near(card, 'scale', 0.925, 0.005)
  await expect
    .poll(() => card.evaluate((el) => Number(getComputedStyle(el).opacity)))
    .toBeCloseTo(0.5125, 2)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await near(card, 'scale', 0.9, 0.005)
  await resetScroll(page, 0)
  await near(card, 'y', 12)
  await expect
    .poll(() => card.evaluate((el) => Number(getComputedStyle(el).opacity)))
    .toBeCloseTo(1, 2)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await near(card, 'scale', 1)
  await page.getByRole('button', { name: 'Change type', exact: true }).click()
  await resetScroll(page, 120)
  await near(card, 'y', 12)
  expect(errors).toEqual([])
})

test('releases source/target generations and handles content without a scroll range', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(field)
  const card = page.locator('#field-card')
  await page.getByRole('button', { name: 'Remove scene', exact: true }).click()
  await expect(card).toHaveCount(0)
  await page.getByRole('button', { name: 'Mount scene', exact: true }).click()
  await resetScroll(page, 120)
  await near(card, 'y', 40, 0.5)
  await page.getByRole('button', { name: 'Detach scroll', exact: true }).click()
  await page.getByRole('button', { name: 'Attach scroll', exact: true }).click()
  await resetScroll(page, 0)
  await near(card, 'y', 0)
  await page.getByRole('button', { name: 'Short story', exact: true }).click()
  await page.setViewportSize({ width: 800, height: 2000 })
  await expect
    .poll(() => page.locator('#field-screen').evaluate((el) => el.scrollHeight - el.clientHeight))
    .toBe(0)
  await page.mouse.wheel(0, 300)
  await near(card, 'y', 0)
  await near(card, 'scale', 1)
  await page.setViewportSize({ width: 390, height: 600 })
  await page.mouse.move(20, 300)
  await page.mouse.wheel(0, 120)
  await expect
    .poll(() => page.locator('#field-screen').evaluate((el) => el.scrollTop))
    .toBeGreaterThan(0)
  expect(errors).toEqual([])
})

test('keeps application scale and centered pivot through delayed font metrics on a held Button', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(field)
  const button = page.locator('#field-button')
  let release!: () => void
  const ready = new Promise<void>((resolve) => {
    release = resolve
  })
  const font = readFileSync(
    'node_modules/vitepress/dist/client/theme-default/fonts/inter-roman-latin.woff2',
  )
  await page.route('**/geometry-proof.woff2', async (route) => {
    await ready
    await route.fulfill({ body: font, contentType: 'font/woff2' })
  })
  await page.addStyleTag({
    content:
      '@font-face { font-family: GeometryProof; src: url(/geometry-proof.woff2); font-display: swap; size-adjust: 170%; } #field-button { font-family: GeometryProof, monospace !important; }',
  })
  await page.waitForFunction(() => document.fonts.status === 'loading')
  const before = await button.evaluate((el) => (el as HTMLElement).offsetWidth)
  await button.evaluate((el) => {
    el.dataset.identity = 'preserved'
  })
  await contact(page, button)
  release()
  await page.evaluate(() => document.fonts.ready)
  await expect.poll(() => button.evaluate((el) => (el as HTMLElement).offsetWidth)).not.toBe(before)
  await near(button, 'scale', 1.04 * 0.97, 0.005)
  const geometry = await button.evaluate((el) => ({
    width: (el as HTMLElement).offsetWidth,
    pivot: parseFloat(getComputedStyle(el).transformOrigin),
  }))
  expect(geometry.pivot).toBeCloseTo(geometry.width / 2, 0)
  await expect(button).toHaveAttribute('data-identity', 'preserved')
  await page.mouse.up()
  await near(button, 'scale', 1.04)
  expect(errors).toEqual([])
})

test('drives the shared scroll recipe with browser touch input', async ({ page, browserName }) => {
  test.skip(
    browserName !== 'chromium',
    'Touch injection uses Chromium CDP; native input is checked separately.',
  )
  await page.goto(field)
  const session = await page.context().newCDPSession(page)
  await session.send('Emulation.setTouchEmulationEnabled', { enabled: true })
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: 15, y: 650 }],
  })
  for (let step = 1; step <= 12; step++) {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: 15, y: 650 - step * 15 }],
    })
    await page.waitForTimeout(25)
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  const screen = page.locator('#field-screen')
  await expect.poll(() => screen.evaluate((el) => el.scrollTop)).toBeGreaterThan(100)
  await page.waitForTimeout(700)
  const offset = await screen.evaluate((el) => el.scrollTop)
  await near(page.locator('#field-card'), 'y', Math.min(240, offset) / 3, 1)
  await session.detach()
})
