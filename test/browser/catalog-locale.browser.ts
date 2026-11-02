import { expect, test } from '@playwright/test'

test('switches catalog and reference copy without resetting editing', async ({ page }) => {
  await page.goto('/playground/#/?lang=en')
  await expect(page.getByRole('heading', { name: 'Components', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Explore Input', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Usage' })).toBeVisible()
  const editor = page.getByRole('textbox', { name: 'Name', exact: true })
  await editor.fill('My own text')
  const handle = await editor.elementHandle()
  await page.getByRole('button', { name: 'Language', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Como usar' })).toBeVisible()
  const translated = page.getByRole('textbox', { name: 'Nome', exact: true })
  await expect(translated).toHaveValue('My own text')
  expect(await handle!.evaluate((el) => el.isConnected)).toBe(true)
  await page.getByRole('button', { name: 'Idioma', exact: true }).click()
  await expect(editor).toHaveValue('My own text')
})

test('shows translated options and keeps Web launcher selection unavailable', async ({ page }) => {
  await page.goto('/playground/#/showcase/help?lang=en')
  await expect(page.getByRole('button', { name: /How do I make my profile/ })).toBeVisible()
  await page.goto('/playground/#/showcase/identity?lang=en')
  await expect(page.getByText('Try it in the app', { exact: true })).toBeVisible()
  for (const button of await page.getByRole('button', { name: /Use (Mavis|Midnight|Azure)/ }).all())
    await expect(button).toBeDisabled()
})
