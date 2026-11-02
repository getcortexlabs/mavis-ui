import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/playground/#/checks/composition')
})

test('Reveal animates intrinsic height, reverses in place, restores focus and releases auto sizing', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const toggle = page.locator('#reveal-toggle'),
    panel = page.locator('#reveal-panel')
  await toggle.focus()
  await toggle.press('Enter')
  await expect(panel).toHaveAttribute('data-state', 'open')
  expect(await panel.evaluate((el) => (el as HTMLElement).style.height)).toBe('auto')
  const before = (await panel.boundingBox())!.height
  await page.locator('#reveal-extra').click()
  await expect.poll(async () => (await panel.boundingBox())!.height).toBeGreaterThan(before)
  const editor = page.locator('#reveal-editor')
  await editor.fill('Do not lose this')
  const handle = await editor.elementHandle()
  await editor.focus()
  await toggle.evaluate((el: HTMLElement) => el.click())
  await expect(toggle).toBeFocused()
  // Reopen in the same frame before the closing operation can remove the subtree.
  await toggle.evaluate((el: HTMLElement) => el.click())
  await expect(panel).toHaveAttribute('data-state', 'open')
  expect(await handle!.evaluate((el) => el === document.getElementById('reveal-editor'))).toBe(true)
  await expect(editor).toHaveValue('Do not lose this')
  await toggle.click()
  await expect(panel).toHaveCount(0)
  await toggle.click()
  await page.locator('#reveal-mount').click()
  await expect(panel).toHaveCount(0)
  expect(errors).toEqual([])
})

test('responsive layout retains editing and follows container width', async ({ page }) => {
  const editor = page.locator('#responsive-draft'),
    stack = page.locator('#responsive-stack')
  await editor.fill('Across breakpoints')
  const node = await editor.elementHandle()
  await expect(stack).toHaveCSS('flex-direction', 'column')
  await page.setViewportSize({ width: 900, height: 900 })
  await expect(stack).toHaveCSS('flex-direction', 'row')
  await expect(stack).toHaveCSS('gap', '24px')
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(stack).toHaveCSS('flex-direction', 'column')
  await expect(editor).toHaveValue('Across breakpoints')
  expect(await node!.evaluate((el) => el === document.getElementById('responsive-draft'))).toBe(
    true,
  )
})

test('restores controlled drafts and returns calendar focus to its trigger', async ({ page }) => {
  await expect(page.locator('#restored-draft')).toHaveValue('2026-11-')
  await page.locator('#restored-draft').fill('2026-11-2')
  await page.locator('#external-draft').click()
  await expect(page.locator('#restored-draft')).toHaveValue('2027-02-')
  const opener = page.getByRole('button', { name: 'Choose date: Restored date', exact: true })
  await opener.click()
  await page.getByRole('dialog').press('Escape')
  await expect(opener).toBeFocused()
})

test('navigation uses a single anchor and disabled actions do not navigate', async ({ page }) => {
  const link = page.getByRole('link', { name: 'Button navigation', exact: true })
  await expect(link).toHaveAttribute('href', '/showcase')
  await page.getByRole('button', { name: 'Toggle navigation' }).click()
  await expect(link).not.toHaveAttribute('href')
  await link.click({ force: true })
  await expect(page).toHaveURL(/checks\/composition/)
  await page.getByRole('button', { name: 'Toggle navigation' }).click()
  await page.getByRole('link', { name: 'Card navigation', exact: true }).click()
  await expect(page).toHaveURL(/#\/showcase$/)
})

test('reduced motion settles Reveal and exposes no closing tab stops', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.locator('#reveal-toggle').click()
  await expect(page.locator('#reveal-panel')).toHaveAttribute('data-state', 'open')
  await page.locator('#reveal-toggle').click()
  await expect(page.locator('#reveal-panel')).toHaveCount(0)
})

test('composes with RouterLink and leaves modified navigation to the browser', async ({
  page,
  browserName,
}) => {
  await page.goto('/playground/#/checks/navigation')
  const button = page.getByRole('link', { name: 'Router button', exact: true })
  await expect(button).toHaveAttribute('href', '#/checks/composition')
  // WebKit automation does not create a tab for middle-click on macOS. Inspect
  // cancellation after the link handler, before suppressing the browser action.
  await button.evaluate((element) => {
    document.addEventListener(
      'click',
      (event) => {
        element.setAttribute('data-browser-navigation', String(!event.defaultPrevented))
        event.preventDefault()
      },
      { once: true },
    )
  })
  await button.click({ modifiers: ['ControlOrMeta'] })
  await expect(button).toHaveAttribute('data-browser-navigation', 'true')
  if (browserName === 'chromium') {
    const [popup] = await Promise.all([
      page.context().waitForEvent('page'),
      button.click({ button: 'middle' }),
    ])
    await expect(popup).toHaveURL(/checks\/composition/)
    await popup.close()
  }
  await expect(page).toHaveURL(/checks\/navigation/)
  await page.getByRole('link', { name: 'Rejected navigation' }).click()
  await expect(page.locator('#navigation-failures')).toHaveText('1 reported failures')
  await page.getByRole('link', { name: 'Router card', exact: true }).click()
  await expect(page).toHaveURL(/checks\/composition/)
})
