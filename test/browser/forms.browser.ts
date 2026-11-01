import { test, expect, type Page } from '@playwright/test'

const state = (page: Page) =>
  page.locator('#form-state').evaluate((el) => JSON.parse(el.textContent!))

test.beforeEach(async ({ page }) => {
  await page.goto('/playground/#/checks/forms')
})

test('routes editor attributes, ARIA and listeners while preserving the wrapper and model', async ({
  page,
}) => {
  const email = page.getByLabel('Form email', { exact: true })
  await expect(email).toHaveAttribute('name', 'email')
  await expect(email).toHaveAttribute('autocomplete', 'email')
  await expect(email).toHaveAttribute('inputmode', 'email')
  await expect(email).toHaveAttribute('required', '')
  await expect(email).toHaveAttribute('aria-controls', 'email-suggestions')
  await expect(email).toHaveAttribute('aria-describedby', 'email-policy form-email-message')
  const wrapper = page.locator('.consumer-field')
  await expect(wrapper).toHaveCSS('margin-bottom', '12px')
  for (const attr of [
    'name',
    'autocomplete',
    'inputmode',
    'required',
    'aria-controls',
    'aria-describedby',
  ]) {
    expect(await wrapper.getAttribute(attr)).toBeNull()
  }
  await email.fill('mavis@example.com')
  await email.press('Tab')
  expect(await state(page)).toMatchObject({
    email: 'mavis@example.com',
    edits: 1,
    changes: 1,
    lastKeyTarget: 'INPUT',
  })
  await page.getByRole('button', { name: 'Toggle field error' }).click()
  await expect(email).toHaveAttribute('aria-invalid', 'true')
  await expect(page.locator('#form-email-message')).toHaveText('Review email')
  await page.getByRole('button', { name: 'Toggle field error' }).click()
  await page.getByRole('button', { name: 'Remove field help' }).click()
  await expect(email).toHaveAttribute('aria-describedby', 'email-policy')
  await page.getByRole('button', { name: 'Change editor attributes' }).click()
  await expect(email).toHaveAttribute('name', 'contact')
  await expect(email).toHaveAttribute('autocomplete', 'username')
  await expect(email).toHaveAttribute('inputmode', 'text')
  expect(await email.getAttribute('required')).toBeNull()
  const bio = page.getByLabel('Form bio', { exact: true })
  await expect(bio).toHaveAttribute('name', 'bio')
  await expect(bio).toHaveAttribute('autocomplete', 'off')
  await expect(bio).toHaveAttribute('inputmode', 'text')
  const description = await bio.getAttribute('aria-describedby')
  expect(description?.split(' ')).toHaveLength(2)
  expect(description).toMatch(/^bio-policy m-input-.+-message$/)
})

test('uses browser validation and submits exactly once for click and Enter with a submitter', async ({
  page,
}) => {
  const email = page.getByLabel('Form email', { exact: true })
  const save = page.locator('#form-save')
  await expect(save).toHaveAttribute('type', 'submit')
  await expect(page.locator('#plain-action')).toHaveAttribute('type', 'button')
  await save.click()
  expect(await state(page)).toMatchObject({ submits: 0, invalid: 1 })
  await expect(email).toBeFocused()
  await email.fill('invalid')
  await email.press('Enter')
  expect(await state(page)).toMatchObject({ submits: 0, invalid: 2 })
  await email.fill('mavis@example.com')
  await save.click()
  expect(await state(page)).toMatchObject({
    submits: 1,
    actions: 0,
    submitter: 'form-save',
    data: { email: 'mavis@example.com', bio: 'Initial bio', intent: 'save' },
  })
  await email.press('Enter')
  expect(await state(page)).toMatchObject({ submits: 2, actions: 0 })
  await page.locator('#plain-action').click()
  expect(await state(page)).toMatchObject({ submits: 2 })
})

test('preserves component submit ownership and allows a caller to cancel Enter', async ({
  page,
}) => {
  const email = page.getByLabel('Form email', { exact: true })
  await email.fill('mavis@example.com')
  await page.getByRole('button', { name: 'Toggle component submit' }).click()
  await email.press('Enter')
  expect(await state(page)).toMatchObject({ submits: 0, actions: 1 })
  await page.getByRole('button', { name: 'Toggle Enter cancellation' }).click()
  await email.press('Enter')
  expect(await state(page)).toMatchObject({ submits: 0, actions: 1 })
  await page.getByRole('button', { name: 'Toggle Enter cancellation' }).click()
  await page.getByRole('button', { name: 'Toggle component submit' }).click()
  await email.press('Enter')
  expect(await state(page)).toMatchObject({ submits: 1, actions: 1 })
})

test('blocks loading and disabled actions without losing focus on the loading button', async ({
  page,
}) => {
  const email = page.getByLabel('Form email', { exact: true })
  await email.fill('mavis@example.com')
  const save = page.locator('#form-save')
  await page.getByRole('button', { name: 'Toggle form loading' }).click()
  await save.focus()
  await expect(save).toBeFocused()
  await save.press('Enter')
  await save.press('Space')
  await save.evaluate((el: HTMLButtonElement) => el.click())
  await email.press('Enter')
  await page.locator('#form-reset').evaluate((el: HTMLButtonElement) => el.click())
  expect(await state(page)).toMatchObject({ submits: 0, resets: 0, email: 'mavis@example.com' })
  await page.getByRole('button', { name: 'Toggle form loading' }).click()
  await page.getByRole('button', { name: 'Toggle submit disabled' }).click()
  await expect(save).toBeDisabled()
  await email.press('Enter')
  expect(await state(page)).toMatchObject({ submits: 0 })
  await page.getByRole('button', { name: 'Toggle submit disabled' }).click()
  await email.press('Enter')
  expect(await state(page)).toMatchObject({ submits: 1 })
})

test('preserves IME actions and multiline newlines', async ({ page }) => {
  const email = page.getByLabel('Form email', { exact: true })
  await page.getByRole('button', { name: 'Toggle component submit' }).click()
  await email.evaluate((el) => {
    el.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        isComposing: true,
        bubbles: true,
        cancelable: true,
      }),
    )
    el.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', keyCode: 229, bubbles: true, cancelable: true }),
    )
  })
  expect(await state(page)).toMatchObject({ submits: 0, actions: 0 })
  const bio = page.getByLabel('Form bio', { exact: true })
  await bio.fill('First')
  await bio.press('End')
  await bio.press('Enter')
  await bio.pressSequentially('Second')
  await expect(bio).toHaveValue('First\nSecond')
  expect(await state(page)).toMatchObject({ submits: 0, actions: 0, bio: 'First\nSecond' })
})

test('keeps reset synchronized with controlled models and external writes', async ({ page }) => {
  const email = page.getByLabel('Form email', { exact: true })
  const bio = page.getByLabel('Form bio', { exact: true })
  await email.fill('changed@example.com')
  await bio.fill('Changed bio')
  await page.locator('#form-reset').click()
  await expect(email).toHaveValue('')
  await expect(bio).toHaveValue('Initial bio')
  expect(await state(page)).toMatchObject({ email: '', bio: 'Initial bio', resets: 1 })
  await page.getByRole('button', { name: 'Toggle reset ownership' }).click()
  await email.fill('kept@example.com')
  await bio.fill('Kept bio')
  await page.locator('#form-reset').click()
  await expect(email).toHaveValue('kept@example.com')
  await expect(bio).toHaveValue('Kept bio')
  expect(await state(page)).toMatchObject({ email: 'kept@example.com', bio: 'Kept bio', resets: 2 })
  await page.getByRole('button', { name: 'Write form models' }).click()
  await page.locator('#account-form').evaluate((el: HTMLFormElement) => el.reset())
  await expect(email).toHaveValue('external@example.com')
  await expect(bio).toHaveValue('External bio')
  expect(await state(page)).toMatchObject({
    email: 'external@example.com',
    bio: 'External bio',
    resets: 3,
  })
})

test('honors explicit form ownership and changes to that association', async ({ page }) => {
  const external = page.getByLabel('External code', { exact: true })
  await expect(external).toHaveAttribute('form', 'external-form')
  await external.fill('outside-form')
  await page.getByRole('button', { name: 'Submit external' }).click()
  expect(await state(page)).toMatchObject({ externalData: { code: 'outside-form' } })
  await external.fill('enter-from-outside')
  await external.press('Enter')
  expect(await state(page)).toMatchObject({ externalData: { code: 'enter-from-outside' } })
  await page.getByRole('button', { name: 'Change editor attributes' }).click()
  await expect(external).toHaveAttribute('form', 'account-form')
  await external.press('Enter')
  expect(await state(page)).toMatchObject({
    submits: 1,
    data: { contact: '', code: 'enter-from-outside' },
  })
})

test('focuses and blurs through public handles and refuses disabled focus', async ({ page }) => {
  const email = page.getByLabel('Form email', { exact: true })
  await page.getByRole('button', { name: 'Focus form email' }).click()
  await expect(email).toBeFocused()
  await page.getByRole('button', { name: 'Blur form email' }).click()
  await expect(email).not.toBeFocused()
  await page.getByRole('button', { name: 'Toggle editor disabled' }).click()
  await page.getByRole('button', { name: 'Focus form email' }).click()
  await expect(email).not.toBeFocused()
  await expect(email).toBeDisabled()
  await page.getByRole('button', { name: 'Focus form bio' }).click()
  await expect(page.getByLabel('Form bio', { exact: true })).toBeFocused()
})
