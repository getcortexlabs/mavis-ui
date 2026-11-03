import { expect, test } from '@playwright/test'

test('shared gravity pauses, seeks, retargets and survives presentation replacement', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/playground/#/showcase/field?lang=en')
  const ball = page.locator('#field-ball')
  await page.locator('#field-drop').click()
  await page.locator('#field-pause').click()
  await expect(page.locator('#field-pause')).toHaveText('Resume')
  const y = () =>
    ball.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42)
  const before = await y()
  await page.waitForTimeout(120)
  expect(Math.abs((await y()) - before)).toBeLessThan(1)
  await page.locator('#field-seek').click()
  expect(Math.abs((await y()) - before)).toBeGreaterThan(1)
  await page.locator('#field-toss').click()
  await expect(page.locator('#field-status')).toHaveText('completed')
  await expect.poll(y).toBeCloseTo(160, 0)
  await page.locator('#field-remount').click()
  await expect.poll(y).toBeCloseTo(0, 0)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.locator('#field-drop').click()
  await expect(page.locator('#field-status')).toHaveText('completed')
  expect(errors).toEqual([])
})

test('shared sensor bindings follow injected readings, pause and release on replacement', async ({
  page,
}) => {
  // Synthetic event fixtures validate integration, not physical sensor availability.
  await page.addInitScript(() => {
    Object.defineProperty(window, 'DeviceOrientationEvent', {
      configurable: true,
      value: class extends Event {},
    })
    Object.defineProperty(window, 'DeviceMotionEvent', {
      configurable: true,
      value: class extends Event {},
    })
  })
  await page.goto('/playground/#/showcase/field?lang=en')
  await page.locator('#field-enable').click()
  const emit = (alpha: number) =>
    page.evaluate((alpha) => {
      const event = new Event('deviceorientation')
      Object.assign(event, { alpha, beta: 0, gamma: 0 })
      window.dispatchEvent(event)
    }, alpha)
  await emit(0)
  await expect(page.locator('#field-sensor-status')).toHaveText('active')
  await emit(60)
  const angle = () =>
    page.locator('#field-compass').evaluate((element) => {
      const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform)
      return (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI
    })
  await expect.poll(angle).toBeCloseTo(60, 0)
  await page.locator('#field-sensor-pause').click()
  await emit(120)
  expect(await angle()).toBeCloseTo(60, 0)
  await page.locator('#field-remount').click()
  await expect.poll(angle).toBeCloseTo(0, 0)
  await page.goto('/playground/#/showcase')
  await emit(180)
  await expect(page.locator('#field-compass')).toHaveCount(0)
})

test('gallery returns to a live keyed page and focuses a fallback after deletion', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/playground/#/showcase/gallery?lang=en')
  await page.locator('[data-open-photo="photo-0"]').click()
  await expect(page.locator('#gallery-status')).toHaveText('completed')
  await page.locator('#gallery-zoom').click()
  await expect(page.locator('#gallery-zoom')).toHaveText('100%')
  await page.locator('#gallery-zoom').click()
  await expect(page.locator('#gallery-zoom')).toHaveText('200%')
  await page.locator('#gallery-reorder').click()
  await page.locator('#gallery-back').click()
  await expect(page.locator('#gallery-viewer')).toHaveCount(0)
  await expect(page.locator('#gallery-status')).toHaveText('completed')
  await expect(page.locator('[data-open-photo="photo-0"]')).toBeFocused()
  await page.locator('[data-open-photo="photo-0"]').click()
  await expect(page.locator('#gallery-status')).toHaveText('completed')
  await page.locator('#gallery-delete').click()
  await page.locator('#gallery-back').click()
  await expect(page.locator('#gallery-heading')).toBeFocused()
  await expect(page.locator('[data-open-photo="photo-0"]')).toHaveCount(0)
  await expect(page.locator('#gallery-error')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('glass keeps child actions interactive and haptics report browser capability', async ({
  page,
}) => {
  await page.goto('/playground/#/showcase/gallery?lang=en')
  await page.locator('#gallery-glass').click()
  await expect(page.locator('#gallery-glass-backend')).toHaveText(/css-backdrop-filter|solid/)
  await page.locator('#gallery-haptic').click()
  await expect(page.locator('#gallery-feedback')).toHaveText(
    /^(vibration|none): (requested|unavailable|blocked|disabled)$/,
  )
  await page.emulateMedia({ forcedColors: 'active' })
  await page.locator('#gallery-glass').click()
  await expect(page.locator('#gallery-glass-backend')).toHaveText('solid')
})

test('interactive return commits an application route once', async ({ page }) => {
  await page.goto('/playground/#/showcase/passage?lang=en')
  await page.locator('#passage-travel').click()
  await expect(page.locator('#passage-status')).toHaveText('completed')
  await page.locator('#passage-edge-back').click()
  await expect(page).not.toHaveURL(/story=coast/)
  await expect(page.locator('#passage-detail')).toHaveCount(0)
})

test('gallery accepts a real pointer dismissal after opening its decoded image', async ({
  page,
}) => {
  await page.goto('/playground/#/showcase/gallery?lang=en')
  await page.locator('[data-open-photo="photo-1"]').click()
  await expect(page.locator('#gallery-status')).toHaveText('completed')
  const viewer = page.locator('#gallery-viewer')
  await viewer.scrollIntoViewIfNeeded()
  const box = (await viewer.boundingBox())!
  const x = box.x + box.width / 2,
    y = box.y + 120
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x, y + 230, { steps: 12 })
  await page.mouse.up()
  await expect(viewer).toHaveCount(0)
  await expect(page.locator('[data-open-photo="photo-1"]')).toBeFocused()
  await expect(page.locator('#gallery-error')).toHaveCount(0)
})
