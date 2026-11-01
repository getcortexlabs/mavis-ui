import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' })
  await page.goto('/playground/#/checks/motion')
  await expect(page.getByRole('heading', { name: 'Press and reveal' })).toBeVisible()
})

test('updates mounted press feedback from the theme and releases disabled and removed surfaces', async ({
  page,
}) => {
  for (const id of ['motion-button', 'motion-card']) {
    const control = page.locator(`#${id}`)
    await expect(control).toHaveCSS('transition-duration', '0.12s')
    await control.hover()
    await page.mouse.down()
    await expect(control).toHaveCSS('scale', '0.97')
    await page
      .getByRole('button', { name: 'Change theme', exact: true })
      .evaluate((el: HTMLElement) => el.click())
    await expect(control).toHaveCSS('scale', '0.9')
    await page
      .getByRole('button', { name: 'Disable feedback', exact: true })
      .evaluate((el: HTMLElement) => el.click())
    await expect(control).toHaveCSS('scale', 'none')
    await page.mouse.up()
    await expect(page.locator('#motion-count')).toHaveText('0 activations')
    await page.getByRole('button', { name: 'Enable feedback', exact: true }).click()
    await page.getByRole('button', { name: 'Change theme', exact: true }).click()
  }
  await page.locator('#motion-button').hover()
  await page.mouse.down()
  await page
    .getByRole('button', { name: 'Unmount', exact: true })
    .evaluate((el: HTMLElement) => el.click())
  await page.mouse.up()
  await expect(page.locator('#motion-button')).toHaveCount(0)
  await page.getByRole('button', { name: 'Mount', exact: true }).click()
  await expect(page.locator('#motion-button')).toHaveCSS('scale', 'none')
  await page.locator('#motion-button').click()
  await expect(page.locator('#motion-count')).toHaveText('1 activations')
})

test('uses shared Reveal values and settles rapid toggles, focus and removal', async ({ page }) => {
  await page.getByRole('button', { name: 'Show content', exact: true }).focus()
  const values = await page
    .getByRole('button', { name: 'Show content', exact: true })
    .evaluate(async (el: HTMLElement) => {
      el.click()
      await new Promise(requestAnimationFrame)
      await new Promise(requestAnimationFrame)
      const content = document.getElementById('motion-content')!
      const style = getComputedStyle(content)
      return {
        duration: style.transitionDuration,
        y: style.getPropertyValue('--m-reveal-enter-y'),
        opacity: style.getPropertyValue('--m-reveal-enter-opacity'),
      }
    })
  expect(values).toEqual({ duration: '0.18s, 0.18s', y: '8px', opacity: '0' })
  const content = page.locator('#motion-content')
  await expect(content).toHaveCSS('opacity', '1')
  await page.getByRole('button', { name: 'Hide content', exact: true }).focus()
  await page.getByRole('button', { name: 'Inside the reveal', exact: true }).focus()
  await page
    .getByRole('button', { name: 'Hide content', exact: true })
    .evaluate((el: HTMLElement) => el.click())
  await expect(content).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Show content', exact: true })).toBeFocused()
  for (let i = 0; i < 5; i++) {
    await page
      .getByRole('button', { name: /^(Show|Hide) content$/ })
      .evaluate((el: HTMLElement) => el.click())
  }
  await expect(content).toBeVisible()
  await expect(content).toHaveCSS('opacity', '1')
  await expect(content).not.toHaveAttribute('inert')
  await expect(content).not.toHaveAttribute('aria-hidden', 'true')
  await page.getByRole('button', { name: 'Unmount', exact: true }).click()
  await expect(content).toHaveCount(0)
  await page.getByRole('button', { name: 'Mount', exact: true }).click()
  await expect(content).toBeVisible()
})

test('keeps reduced-motion CSS responsive to preference changes', async ({ page }) => {
  const control = page.locator('#motion-button')
  await control.hover()
  await page.mouse.down()
  await expect(control).toHaveCSS('scale', '0.97')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(control).toHaveCSS('scale', 'none')
  await expect(control).toHaveCSS('transition-duration', '0s')
  await page.mouse.up()
  await page.getByRole('button', { name: 'Show content', exact: true }).click()
  await expect(page.locator('#motion-content')).toHaveCSS('translate', 'none')
  await expect(page.locator('#motion-content')).toHaveCSS('opacity', '1')
  await page.getByRole('button', { name: 'Hide content', exact: true }).click()
  await expect(page.locator('#motion-content')).toHaveCount(0)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await control.hover()
  await page.mouse.down()
  await expect(control).toHaveCSS('scale', '0.97')
  await page.mouse.up()
  await expect(control).toHaveCSS('scale', 'none')
})
