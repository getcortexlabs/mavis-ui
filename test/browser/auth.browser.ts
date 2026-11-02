import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' })
})

function collectErrors(page: import('@playwright/test').Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

test('preserves separate sign-in/signup drafts and exposes only the active panel', async ({
  page,
}) => {
  const errors = collectErrors(page)
  await page.goto('/playground/#/showcase/morrow')
  const panel = page.getByRole('tabpanel')
  await panel.getByRole('textbox', { name: 'Email', exact: true }).fill('login@example.com')
  await panel.getByLabel('Password', { exact: true }).fill('sample-password')
  await panel.getByRole('button', { name: 'Show password' }).click()
  await page.getByRole('tab', { name: 'Create account' }).click()
  await expect(page.getByRole('tabpanel')).toHaveCount(1)
  await expect(panel.getByRole('textbox', { name: 'Email', exact: true })).toHaveValue('')
  await panel.getByRole('textbox', { name: 'Your name' }).fill('Sam')
  await panel.getByRole('textbox', { name: 'Email', exact: true }).fill('signup@example.com')
  await page.getByRole('tab', { name: 'Sign in', exact: true }).click()
  await expect(panel.getByRole('textbox', { name: 'Email', exact: true })).toHaveValue(
    'login@example.com',
  )
  await expect(panel.getByRole('textbox', { name: 'Password', exact: true })).toHaveValue(
    'sample-password',
  )
  await expect(page.getByRole('textbox', { name: 'Your name' })).toHaveCount(0)
  await page.getByRole('tab', { name: 'Create account' }).click()
  await expect(panel.getByRole('textbox', { name: 'Your name' })).toHaveValue('Sam')
  await expect(panel.getByRole('textbox', { name: 'Email', exact: true })).toHaveValue(
    'signup@example.com',
  )
  expect(errors).toEqual([])
})

test('keeps branded Button names and delivers an app notification across route replacement', async ({
  page,
}) => {
  const errors = collectErrors(page)
  await page.goto('/playground/#/showcase/morrow')
  const branded = page.getByRole('button', { name: 'Continue with Studio', exact: true })
  await expect(branded).toContainText('Demo')
  await expect(branded).toHaveAccessibleName('Continue with Studio')
  await branded.focus()
  await page.keyboard.press('Space')
  await expect(page).toHaveURL(/\/showcase\/morrow\/home$/)
  await expect(page.getByRole('heading', { name: 'Hello, Alex.' })).toBeVisible()
  await expect(page.locator('.m-toast')).toContainText('Welcome, Alex.')
  await expect(page.locator('.m-toast-host')).toHaveCount(1)
  await page.getByRole('button', { name: 'Dismiss notification' }).click()
  await expect(page.locator('.m-toast')).toHaveCount(0)
  await page.getByRole('button', { name: 'Back to sign in', exact: false }).click()
  await expect(branded).toBeVisible()
  expect(errors).toEqual([])
})

test('defers application feedback for real modals while allowing non-modal dialogs', async ({
  page,
}) => {
  const errors = collectErrors(page)
  await page.goto('/playground/#/showcase/morrow/home')
  await page.getByRole('button', { name: 'Start something good' }).click()
  await expect(page.locator('.m-toast')).toBeVisible()
  await page.evaluate(() => {
    const dialog = document.createElement('dialog')
    dialog.id = 'external-dialog'
    dialog.textContent = 'Non-modal notice'
    document.body.append(dialog)
    dialog.show()
  })
  await expect(page.locator('.m-toast-host')).toBeVisible()
  await page.evaluate(() => {
    const dialog = document.querySelector<HTMLDialogElement>('#external-dialog')!
    dialog.close()
    dialog.showModal()
  })
  await expect(page.locator('.m-toast-host')).toBeHidden()
  await page.evaluate(() => {
    const nested = document.createElement('dialog')
    nested.id = 'nested-dialog'
    nested.textContent = 'Nested modal'
    document.body.append(nested)
    nested.showModal()
  })
  await page.waitForTimeout(5200)
  await page.evaluate(() => document.querySelector<HTMLDialogElement>('#external-dialog')!.close())
  await expect(page.locator('.m-toast-host')).toBeHidden()
  await page.evaluate(() => document.querySelector<HTMLDialogElement>('#nested-dialog')!.close())
  await expect(page.locator('.m-toast')).toBeVisible()
  await page.getByRole('button', { name: 'Dismiss notification' }).click()
  await page.evaluate(() => {
    document.querySelector('#external-dialog')!.remove()
    document.querySelector('#nested-dialog')!.remove()
  })
  expect(errors).toEqual([])
})

test('shows recovery feedback after its Sheet releases ownership', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('/playground/#/showcase/morrow')
  await page.getByRole('button', { name: 'Forgot your password?' }).click()
  const sheet = page.getByRole('dialog', { name: 'A way back in' })
  await expect(sheet).toBeVisible()
  await sheet.getByRole('textbox', { name: 'Recovery email' }).fill('demo@example.com')
  await sheet.getByRole('button', { name: 'Preview recovery' }).click()
  await expect(sheet).toHaveCount(0)
  await expect(page.locator('.m-toast')).toContainText('Recovery preview complete')
  expect(errors).toEqual([])
})

test('deactivates cached overlays, local notifications and held press feedback', async ({
  page,
}) => {
  const errors = collectErrors(page)
  await page.goto('/playground/#/checks/tabs')
  await page.locator('#retain').click()
  const draft = page.getByRole('textbox', { name: 'Cached draft', exact: true })
  await draft.fill('Only this panel')
  // External selection is legitimate even while a modal owns user input.
  const leave = () => page.locator('#last').evaluate((el: HTMLButtonElement) => el.click())
  const back = () => page.locator('#reset').click()
  for (const kind of ['Sheet', 'Dialog']) {
    await page.getByRole('button', { name: `Open cached ${kind}` }).click()
    await expect(page.getByRole('dialog', { name: `Cached ${kind}`, exact: true })).toBeVisible()
    await leave()
    await expect(page.locator('dialog[open]')).toHaveCount(0)
    await back()
    await expect(draft).toHaveValue('Only this panel')
    await expect(page.locator('dialog[open]')).toHaveCount(0)
  }
  await page.getByRole('button', { name: 'Show cached notice' }).click()
  await expect(page.locator('.m-toast')).toBeVisible()
  await leave()
  await expect(page.locator('.m-toast')).toHaveCount(0)
  await back()
  await expect(page.locator('.m-toast')).toHaveCount(0)
  await page.getByRole('button', { name: 'Show cached notice' }).click()
  await expect(page.locator('.m-toast')).toBeVisible()
  await page.getByRole('button', { name: 'Dismiss notification' }).click()
  const action = page.locator('#cached-press')
  await action.scrollIntoViewIfNeeded()
  const bounds = (await action.boundingBox())!
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(200)
  await leave()
  await page.mouse.up()
  await back()
  await expect(action).toHaveText('Cached action: 0')
  await action.click()
  await expect(action).toHaveText('Cached action: 1')
  await expect(draft).toHaveValue('Only this panel')
  expect(errors).toEqual([])
})

test('wraps composed Button content at large text sizes without losing its name or action', async ({
  page,
}, info) => {
  await page.goto('/playground/#/showcase/morrow')
  await page.setViewportSize({ width: 320, height: 900 })
  const branded = page.getByRole('button', { name: 'Continue with Studio', exact: true })
  await branded.evaluate((el: HTMLElement) => el.style.setProperty('--m-button-font-size', '36px'))
  await branded.scrollIntoViewIfNeeded()
  expect(await branded.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true)
  await expect(branded).toHaveAccessibleName('Continue with Studio')
  await branded.screenshot({ path: info.outputPath('composed-large.png') })
  await branded.click()
  await expect(page.getByRole('heading', { name: 'Hello, Alex.' })).toBeVisible()
})
