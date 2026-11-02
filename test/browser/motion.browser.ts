import { expect, test, type Locator } from '@playwright/test'

test.describe.configure({ mode: 'serial' })
let errors: string[]
test.afterEach(() => expect(errors).toEqual([]))

const scale = (control: Locator) =>
  control.evaluate((el) => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(el).transform)
    return Math.hypot(matrix.a, matrix.b)
  })
const atScale = (control: Locator, value: number) =>
  expect.poll(() => scale(control)).toBeCloseTo(value, 3)

test.beforeEach(async ({ page }) => {
  errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' })
  await page.goto('/playground/#/checks/motion')
  await expect(page.getByRole('heading', { name: 'Press and reveal' })).toBeVisible()
})

test('updates held feedback from the theme and removes only its contribution when disabled', async ({
  page,
}) => {
  for (const id of ['motion-button', 'motion-card']) {
    const control = page.locator(`#${id}`)
    await control.hover()
    await page.mouse.down()
    await atScale(control, 0.96)
    await page
      .getByRole('button', { name: 'Change theme', exact: true })
      .evaluate((el: HTMLElement) => el.click())
    await atScale(control, 0.9)
    await page
      .getByRole('button', { name: 'Disable feedback', exact: true })
      .evaluate((el: HTMLElement) => el.click())
    await atScale(control, 1)
    await page.mouse.up()
    await expect(page.locator('#motion-count')).toHaveText('0 activations')
    await page.getByRole('button', { name: 'Enable feedback', exact: true }).click()
    await page.getByRole('button', { name: 'Change theme', exact: true }).click()
  }
})

test('composes application scale, retargets while held and releases without a stale base', async ({
  page,
}) => {
  const control = page.locator('#motion-button')
  await page.getByRole('button', { name: 'Base 1.10', exact: true }).click()
  await atScale(control, 1.1)
  await control.hover()
  await page.mouse.down()
  await atScale(control, 1.056)
  await page
    .getByRole('button', { name: 'Base 1.20', exact: true })
    .evaluate((el: HTMLElement) => el.click())
  await atScale(control, 1.152)
  await page.mouse.up()
  await atScale(control, 1.2)
  await page.getByRole('button', { name: 'Animate and hold', exact: true }).click()
  await control.hover()
  await page.mouse.down()
  await atScale(control, 1.056)
  await page.waitForTimeout(1300)
  const held = await scale(control)
  expect(held).toBeGreaterThan(1.056)
  expect(held).toBeLessThan(1.153)
  await page.mouse.up()
  const released = await scale(control)
  expect(Math.abs(released - held)).toBeLessThan(0.03)
  await atScale(control, 1.2)
  await expect(page.locator('#motion-result')).toHaveText('Finished · base 1.20')
})

test('cancels application playback on removal and mounts a fresh surface', async ({ page }) => {
  await page.getByRole('button', { name: 'Animate and hold', exact: true }).click()
  await expect(page.locator('#motion-result')).toHaveText('Animating to 1.20 · hold the button')
  const bounds = await page.locator('#motion-button').boundingBox()
  await page.mouse.move(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2)
  await page.mouse.down()
  await page
    .getByRole('button', { name: 'Unmount', exact: true })
    .evaluate((el: HTMLElement) => el.click())
  await page.mouse.up()
  await expect(page.locator('#motion-result')).toHaveText('Cancelled · finished: false')
  await expect(page.locator('#motion-button')).toHaveCount(0)
  await page.getByRole('button', { name: 'Mount', exact: true }).click()
  await atScale(page.locator('#motion-button'), 1)
  await page.getByRole('button', { name: 'Base 1.20', exact: true }).click()
  await atScale(page.locator('#motion-button'), 1.2)
})

test('settles rapid Reveal interruptions, restores focus and excludes leaving controls', async ({
  page,
}) => {
  const toggle = page.getByRole('button', { name: /^(Show|Hide) content$/ })
  const content = page.locator('#motion-content')
  await toggle.focus()
  await toggle.press('Enter')
  await expect(content).toHaveCSS('opacity', '1')
  await page.getByRole('button', { name: 'Inside the reveal', exact: true }).focus()
  const leaving = await toggle.evaluate(async (el: HTMLElement) => {
    el.click()
    await Promise.resolve()
    const content = document.querySelector('#motion-content')!
    return { inert: content.hasAttribute('inert'), hidden: content.getAttribute('aria-hidden') }
  })
  expect(leaving).toEqual({ inert: true, hidden: 'true' })
  await expect(content).toHaveCount(0)
  await expect(toggle).toBeFocused()
  for (let i = 0; i < 2; i++) {
    await toggle.click()
    await expect(content).toHaveCSS('opacity', '1')
    await toggle.click()
    await expect(content).toHaveCount(0)
  }
  for (let i = 0; i < 7; i++) {
    await toggle.evaluate((el: HTMLElement) => el.click())
    await page.waitForTimeout(25)
  }
  await expect(content).toBeVisible()
  await expect(content).toHaveCSS('opacity', '1')
  await expect(content).not.toHaveAttribute('inert')
  await expect(content).not.toHaveAttribute('aria-hidden', 'true')
  await page.getByRole('button', { name: 'Unmount', exact: true }).click()
  await expect(content).toHaveCount(0)
})

test('handles real keyboard input and pointer cancellation without extra activation', async ({
  page,
}) => {
  for (const id of ['motion-button', 'motion-card']) {
    const control = page.locator(`#${id}`)
    await control.focus()
    await page.keyboard.down('Space')
    await atScale(control, 0.96)
    await page.keyboard.up('Space')
    await atScale(control, 1)
    await control.hover()
    await page.mouse.down()
    await atScale(control, 0.96)
    await control.dispatchEvent('pointercancel', { pointerId: 1, pointerType: 'mouse' })
    await atScale(control, 1)
    await page.mouse.move(1, 1)
    await page.mouse.up()
  }
  await expect(page.locator('#motion-count')).toHaveText('2 activations')
})

test('honors live reduced motion during press and application playback', async ({ page }) => {
  const control = page.locator('#motion-button')
  await control.hover()
  await page.mouse.down()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await atScale(control, 0.96)
  await page.mouse.up()
  await atScale(control, 1)
  await page.getByRole('button', { name: 'Show content', exact: true }).click()
  await expect(page.locator('#motion-content')).toHaveCSS('opacity', '1')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.getByRole('button', { name: 'Animate and hold', exact: true }).click()
  await expect(page.locator('#motion-result')).toHaveText('Animating to 1.20 · hold the button')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await atScale(control, 1.2)
  await expect.poll(() => control.evaluate((el) => el.getAnimations().length)).toBe(0)
})
