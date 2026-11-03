import { expect, test, type Page } from '@playwright/test'

function errorsIn(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  return errors
}

test('interactive modal swipes request app closure and sheet content remains scrollable', async ({
  page,
}) => {
  const errors = errorsIn(page)
  await page.goto('/playground/#/showcase/orbit?lang=en')
  await page.locator('#orbit-dialog').click()
  const dialog = page.getByRole('dialog', { name: 'Keep this idea?' })
  await expect(dialog).toHaveAttribute('data-motion-state', 'open')
  await expect(dialog).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)')
  const title = (await dialog.locator('.m-dialog-title').boundingBox())!
  const x = title.x + title.width / 2,
    y = title.y + title.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x, y + 340, { steps: 15 })
  await expect
    .poll(() => dialog.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42))
    .toBeGreaterThan(280)
  await page.mouse.up()
  await expect(dialog).toHaveCount(0)
  await expect(page.locator('#orbit-close')).toHaveText('swipe')
  await page.locator('#orbit-sheet').click()
  const sheet = page.getByRole('dialog', { name: 'Small choices' })
  await expect(sheet).toHaveAttribute('data-motion', 'jolt-bottom-sheet')
  const body = sheet.locator('.m-sheet-body')
  await expect
    .poll(() => body.evaluate((el) => el.scrollHeight - el.clientHeight))
    .toBeGreaterThan(0)
  await body.getByText('A possibility 18', { exact: true }).scrollIntoViewIfNeeded()
  await expect(body.getByText('A possibility 18', { exact: true })).toBeInViewport()
  await expect(sheet).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(sheet).toBeHidden()
  expect(errors).toEqual([])
})

test('shared navigation awaits the router and restores both presentations', async ({ page }) => {
  const errors = errorsIn(page)
  await page.goto('/playground/#/showcase/passage?lang=en')
  await page.locator('#passage-travel').click()
  await expect(page).toHaveURL(/story=coast/)
  await expect(page.locator('#passage-detail')).toBeVisible()
  await expect(page.locator('#passage-status')).toHaveText('completed')
  await page.locator('#passage-travel').click()
  await expect(page).not.toHaveURL(/story=coast/)
  await expect(page.locator('#passage-detail')).toHaveCount(0)
  await expect(page.locator('#passage-status')).toHaveText('completed')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.locator('#passage-travel').click()
  await expect(page.locator('#passage-detail')).toBeVisible()
  await expect(page.locator('#passage-travel')).toBeEnabled()
  expect(errors).toEqual([])
})

test('blur, vector shapes, particles and icons retain readable content with reduced motion', async ({
  page,
}) => {
  const errors = errorsIn(page)
  await page.goto('/playground/#/showcase/prism?lang=en')
  await page.locator('#prism-confetti').click()
  await page.locator('#prism-soften').click()
  await expect
    .poll(() => page.locator('#prism-blur').evaluate((el) => getComputedStyle(el).filter))
    .toContain('blur(')
  const path = page.locator('#prism-shape svg path').first()
  const original = await path.getAttribute('d')
  await page.locator('#prism-morph').click()
  await expect(path).not.toHaveAttribute('d', original!)
  await page.locator('#prism-bounce').click()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.locator('#prism-pulse').click()
  await page.locator('#prism-replace').click()
  await expect(page.getByText('Near and far.', { exact: true })).toBeVisible()
  await page.locator('#prism-mount').click()
  await expect(page.locator('#prism-sky')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('image controls commit the app source only after forward completion and survive replacement', async ({
  page,
}) => {
  const errors = errorsIn(page)
  await page.goto('/playground/#/showcase/prism?lang=en')
  await expect(page.locator('#prism-ready')).toHaveText('Image ready')
  const image = page.locator('#prism-photo img')
  const source = await image.getAttribute('src')
  await page.locator('#prism-prepare').click()
  await expect(page.locator('#prism-status')).toHaveText('paused')
  await page.locator('#prism-seek').click()
  expect(await image.getAttribute('src')).toBe(source)
  await page.locator('#prism-finish').click()
  await expect(page.locator('#prism-status')).toHaveText('completed')
  await expect(image).not.toHaveAttribute('src', source!)
  const destination = await image.getAttribute('src')
  await page.locator('#prism-replace').click()
  await expect(page.locator('#prism-ready')).toHaveText('Image ready')
  await expect(image).toHaveAttribute('src', destination!)
  await page.locator('#prism-prepare').click()
  await expect(page.locator('#prism-status')).toHaveText('paused')
  await page.locator('#prism-stop').click()
  await expect(page.locator('#prism-status')).toHaveText('cancelled')
  await expect(image).toHaveAttribute('src', destination!)
  await page.locator('#prism-mount').click()
  await expect(image).toHaveCount(0)
  await page.locator('#prism-mount').click()
  await expect(page.locator('#prism-ready')).toHaveText('Image ready')
  await expect(page.locator('#prism-error')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('physics pauses, resets and recreates its bodies; interactive dialog restores focus', async ({
  page,
}) => {
  const errors = errorsIn(page)
  await page.goto('/playground/#/showcase/orbit?lang=en')
  await expect(page.locator('#orbit-ready')).toContainText('Ready to move')
  await expect(page.locator('#orbit-error')).toHaveCount(0)
  const ball = page.locator('#orbit-ball-2')
  await page.locator('#orbit-pause').click()
  const paused = await ball.evaluate((el) => getComputedStyle(el).transform)
  await page.waitForTimeout(150)
  expect(await ball.evaluate((el) => getComputedStyle(el).transform)).toBe(paused)
  await page.locator('#orbit-reset').click()
  await page.locator('#orbit-pause').click()
  await page.locator('#orbit-impulse').click()
  await expect(page.locator('#orbit-ready')).toContainText('1')
  await page.locator('#orbit-mount').click()
  await expect(ball).toHaveCount(0)
  await page.locator('#orbit-mount').click()
  await expect(page.locator('#orbit-ready')).toContainText('Ready to move')
  const trigger = page.locator('#orbit-dialog')
  await trigger.focus()
  await trigger.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Keep this idea?' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(trigger).toBeFocused()
  await trigger.focus()
  await trigger.press('Enter')
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(trigger).toBeFocused()
  expect(errors).toEqual([])
})
