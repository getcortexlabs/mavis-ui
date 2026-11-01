import { expect, test } from '@playwright/test'

test('presents a modal sheet, keeps focus inside and reports how it closed', async ({
  page,
  browserName,
}) => {
  // Safari on macOS moves keyboard focus between buttons with Option-Tab.
  const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab'
  await page.goto('/playground/#/preview/sheet?lang=en')
  const trigger = page.getByRole('button', { name: 'Open sheet', exact: true })
  await trigger.focus()
  await trigger.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Filters' })
  await expect(dialog).toBeVisible()
  const close = dialog.getByRole('button', { name: 'Close', exact: true })
  await expect(close).toBeFocused()
  await expect(dialog.getByRole('heading', { name: 'Filters', level: 2 })).toBeVisible()
  await expect(dialog.getByRole('textbox', { name: 'Search' })).toBeVisible()
  await expect(dialog).toHaveCSS('translate', '0px')

  // Tab cycles through the dialog only.
  for (const name of ['Search', 'Cancel', 'Apply']) {
    await page.keyboard.press(tab)
    await expect(dialog.getByRole(name === 'Search' ? 'textbox' : 'button', { name })).toBeFocused()
  }
  await page.keyboard.press(tab)
  await expect(close).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(page.getByText('Closed by the Escape key.', { exact: true })).toBeVisible()
  await expect(trigger).toBeFocused()

  await trigger.click()
  await expect(dialog).toBeVisible()
  await page.mouse.click(20, 20)
  await expect(dialog).toBeHidden()
  await expect(page.getByText('Closed by the scrim.', { exact: true })).toBeVisible()

  await trigger.click()
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByText('Closed by the close button.', { exact: true })).toBeVisible()

  await trigger.click()
  await dialog.getByRole('button', { name: 'Apply', exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByText('Closed by the app.', { exact: true })).toBeVisible()
})

test('keeps a non-dismissible sheet open and fills the viewport when fullscreen', async ({
  page,
}) => {
  await page.goto('/playground/#/preview/sheet?lang=en')
  await page.getByRole('button', { name: 'Not dismissible', exact: true }).click()
  const held = page.getByRole('dialog', { name: 'Confirm' })
  await expect(held).toBeVisible()
  await expect(held.getByRole('button', { name: 'Close' })).toHaveCount(0)
  await page.keyboard.press('Escape')
  await page.mouse.click(20, 20)
  await expect(held).toBeVisible()
  await held.getByRole('button', { name: 'Confirm', exact: true }).click()
  await expect(held).toBeHidden()

  await page.getByRole('button', { name: 'Full screen', exact: true }).click()
  const full = page.getByRole('dialog', { name: 'Details' })
  await expect(full).toBeVisible()
  await expect(full).toHaveCSS('translate', '0px')
  const viewport = page.viewportSize()!
  const box = (await full.boundingBox())!
  expect(Math.round(box.height)).toBe(viewport.height)
  expect(Math.round(box.width)).toBe(viewport.width)
  await full.getByRole('button', { name: 'Done', exact: true }).scrollIntoViewIfNeeded()
  await full.getByRole('button', { name: 'Done', exact: true }).click()
  await expect(full).toBeHidden()
})

test('leaves at once under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/playground/#/preview/sheet?lang=en')
  const trigger = page.getByRole('button', { name: 'Open sheet', exact: true })
  await trigger.focus()
  await trigger.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Filters' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveCSS('transition-duration', '0s')
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('keeps a reopened dialog intact when the previous close event arrives', async ({ page }) => {
  await page.goto('/playground/#/preview/sheet?lang=en')
  await page.getByRole('button', { name: 'Open sheet', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Filters' })
  await expect(dialog).toBeVisible()
  // HTMLDialogElement queues close events, so reopening can precede their delivery.
  await dialog.evaluate((element: HTMLDialogElement) => {
    element.close()
    element.showModal()
  })
  await expect(dialog.getByRole('textbox', { name: 'Search' })).toBeVisible()
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})
