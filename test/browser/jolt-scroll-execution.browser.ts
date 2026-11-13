import { expect, test } from '@playwright/test'

test('section motion agrees across automatic and forced fallback through resize and remount', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/playground/#/checks/scroll-execution')
  const modes = page.locator('#scroll-check-modes')
  await expect(modes).toHaveText(/^(scroll-timeline|scheduler),scheduler$/)
  const scroll = async (progress: number) => {
    await page.locator('#scroll-check-screen').evaluate((screen, fraction) => {
      const section = document.getElementById('scroll-check-section')!
      const top =
        section.getBoundingClientRect().top -
        screen.getBoundingClientRect().top -
        screen.clientTop +
        screen.scrollTop
      const maximum = screen.scrollHeight - screen.clientHeight
      const start = Math.max(0, Math.min(maximum, top - screen.clientHeight))
      const end = Math.max(0, Math.min(maximum, top + section.getBoundingClientRect().height))
      screen.scrollTop = start + (end - start) * fraction
    }, progress)
  }
  const poses = () =>
    page.evaluate(() =>
      ['auto', 'fallback'].map((mode) => {
        const style = getComputedStyle(document.getElementById(`scroll-check-${mode}`)!)
        return { y: new DOMMatrixReadOnly(style.transform).m42, opacity: Number(style.opacity) }
      }),
    )
  const compare = async (progress: number) => {
    await scroll(progress)
    await expect
      .poll(async () => (await poses()).every((pose) => Math.abs(pose.y + 80 * progress) < 1))
      .toBe(true)
    await expect
      .poll(async () =>
        (await poses()).every((pose) => Math.abs(pose.opacity - (0.4 + 0.6 * progress)) < 0.02),
      )
      .toBe(true)
  }
  await compare(0.25)
  await compare(0.75)
  await page.locator('#scroll-check-grow').click()
  await expect(page.locator('#scroll-check-section')).toHaveCSS('height', '1000px')
  // Let resize delivery and the browser's scroll-anchor adjustment finish before
  // explicitly selecting the next position in the resized section.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  )
  await compare(0.5)
  await page.locator('#scroll-check-takeover').click()
  await page.locator('#scroll-check-grow').click()
  await expect(page.locator('#scroll-check-section')).toHaveCSS('height', '700px')
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  )
  await scroll(0.75)
  await expect
    .poll(async () => (await poses()).every((pose) => Math.abs(pose.y + 25) < 1))
    .toBe(true)
  await expect
    .poll(async () => (await poses()).every((pose) => Math.abs(pose.opacity - 0.85) < 0.02))
    .toBe(true)
  await page.locator('#scroll-check-mount').click()
  await expect(modes).toHaveText('released')
  await expect(page.locator('#scroll-check-auto')).toHaveCount(0)
  await page.locator('#scroll-check-mount').click()
  await expect(modes).toHaveText(/^(scroll-timeline|scheduler),scheduler$/)
  await compare(0.5)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect
    .poll(async () => (await poses()).every((pose) => Math.abs(pose.y + 80) < 1))
    .toBe(true)
  expect(errors).toEqual([])
})
