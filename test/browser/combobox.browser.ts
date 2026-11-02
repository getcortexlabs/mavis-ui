import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('combobox keeps editing separate from typed selection and preserves focus', async ({
  page,
}) => {
  await page.goto('/playground/#/checks/combobox')
  const input = page.getByRole('combobox', { name: 'Search choices' })
  await input.focus()
  await expect(page.getByRole('option')).toHaveCount(4)
  await expect(
    page.getByText('Query: Alpha; requests: 0; cancelled: 0', { exact: true }),
  ).toBeVisible()
  await input.press('ArrowDown')
  await input.press('ArrowDown')
  await expect(page.getByText('Value: string:a; changes: 0', { exact: true })).toBeVisible()
  await input.press('Enter')
  await expect(input).toHaveValue('Numeric one')
  await expect(input).toBeFocused()
  await expect(page.getByText('Value: number:1; changes: 1', { exact: true })).toBeVisible()
  await input.fill('other')
  await expect(page.getByRole('option', { name: 'String one', exact: true })).toBeVisible()
  await page.getByRole('option', { name: 'String one', exact: true }).click()
  await expect(input).toBeFocused()
  await expect(page.getByText('Value: string:1; changes: 2', { exact: true })).toBeVisible()
  await input.fill('cancel me')
  await input.press('Escape')
  await expect(input).toHaveValue('String one')
  await expect(page.getByRole('listbox')).toHaveCount(0)
  await page.getByRole('button', { name: 'Clear selection' }).click()
  await expect(input).toHaveValue('')
  await expect(page.getByText('Value: object:; changes: 3', { exact: true })).toBeVisible()
})

test('combobox retries failure, ignores late results and bounds keyboard-visible options', async ({
  page,
}) => {
  await page.goto('/playground/#/checks/combobox')
  const input = page.getByRole('combobox')
  await input.fill('slow')
  await expect(page.getByText(/requests: 1;/)).toBeVisible()
  await input.fill('fast')
  await expect(page.getByRole('option', { name: 'Numeric one' })).toBeVisible()
  await page.waitForTimeout(900)
  await expect(page.getByRole('option', { name: 'Obsolete response' })).toHaveCount(0)
  await page.locator('#fail-query').evaluate((element: HTMLElement) => element.click())
  await input.fill('failure')
  await expect(page.getByText('Could not load results.')).toBeVisible()
  await input.press('Enter')
  await expect(page.getByRole('option', { name: 'Numeric one' })).toBeVisible()
  await input.fill('empty')
  await expect(page.getByText('No results', { exact: true })).toBeVisible()
  await input.fill('many')
  await expect(page.getByRole('option')).toHaveCount(50)
  await expect(page.getByText('Refine your search to see more results.')).toBeVisible()
  for (let i = 0; i < 50; i++) await input.press('ArrowDown')
  await expect(page.getByRole('option', { name: 'Option 50', exact: true })).toBeInViewport()
  await input.press('Enter')
  await expect(input).toHaveValue('Option 50')
})

test('combobox respects query rejection, IME, disabled and navigation cleanup', async ({
  page,
}) => {
  await page.goto('/playground/#/checks/combobox')
  const input = page.getByRole('combobox')
  await page.locator('#reject-query').evaluate((element: HTMLElement) => element.click())
  await input.fill('rejected')
  await expect(input).toHaveValue('Alpha')
  await expect(page.getByText(/requests: 0;/)).toBeVisible()
  await page.locator('#reject-query').evaluate((element: HTMLElement) => element.click())
  await expect(page.getByText('Accept: true', { exact: true })).toBeVisible()
  await input.focus()
  await input.dispatchEvent('compositionstart')
  await input.fill('日本')
  await expect(page.getByText(/requests: 0;/)).toBeVisible()
  await input.dispatchEvent('keydown', { key: 'Enter', isComposing: true })
  await expect(page.getByText('Value: string:a; changes: 0', { exact: true })).toBeVisible()
  await input.dispatchEvent('compositionend', { data: '日本' })
  await expect(page.getByText(/requests: 1;/)).toBeVisible()
  await input.fill('slow')
  await expect(page.getByText(/requests: 2;/)).toBeVisible()
  await page.locator('#disable-query').evaluate((element: HTMLElement) => element.click())
  await expect(input).toBeDisabled()
  await expect(page.getByRole('listbox')).toHaveCount(0)
  await page.locator('#disable-query').click()
  await input.fill('next')
  await page.locator('#unmount-query').evaluate((element: HTMLElement) => element.click())
  await expect(input).toHaveCount(0)
  await page.waitForTimeout(900)
  await expect(page.getByRole('listbox')).toHaveCount(0)
})

test('combobox stays within a narrow Sheet and gives Escape to its owner after cancelling', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await page.goto('/playground/#/checks/combobox')
  await page.locator('#sheet-query').click()
  const dialog = page.getByRole('dialog', { name: 'Search overlay' })
  const input = dialog.getByRole('combobox', { name: 'Overlay search' })
  await input.fill('many')
  await expect(dialog.getByRole('option')).toHaveCount(50)
  const popup = dialog.locator('.m-combobox-popup')
  await expect(popup).toBeVisible()
  const rect = await popup.boundingBox()
  expect(rect).not.toBeNull()
  expect(rect!.x).toBeGreaterThanOrEqual(0)
  expect(rect!.x + rect!.width).toBeLessThanOrEqual(320)
  expect(rect!.y).toBeGreaterThanOrEqual(0)
  expect(rect!.y + rect!.height).toBeLessThanOrEqual(640)
  await input.press('ArrowUp')
  await expect(dialog.getByRole('option', { name: 'Option 50', exact: true })).toBeInViewport()
  await input.press('Enter')
  await expect(dialog).toBeVisible()
  await expect(input).toHaveValue('Option 50')
  await expect(input).toBeFocused()
  await input.fill('cancel')
  await input.press('Escape')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('listbox')).toHaveCount(0)
  await input.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(page.locator('.m-combobox-popup')).toHaveCount(0)
})

test('combobox does not submit HTML forms and closes when focus leaves through Clear', async ({
  page,
  browserName,
}) => {
  await page.goto('/playground/#/checks/combobox')
  await page
    .locator('.m-combobox')
    .first()
    .evaluate((component) => {
      const form = document.createElement('form')
      form.id = 'combobox-form'
      form.dataset.submits = '0'
      form.addEventListener('submit', (event) => {
        event.preventDefault()
        form.dataset.submits = String(Number(form.dataset.submits) + 1)
      })
      component.parentElement!.insertBefore(form, component)
      form.append(component)
      const submit = document.createElement('button')
      submit.type = 'submit'
      submit.textContent = 'Submit fixture'
      form.append(submit)
    })
  const input = page.getByRole('combobox')
  const submit = page.getByRole('button', { name: 'Submit fixture' })
  const original = await submit.boundingBox()
  await input.focus()
  await expect(page.getByRole('option')).toHaveCount(4)
  expect((await submit.boundingBox())?.y).toBe(original?.y)
  await input.press('Enter')
  await expect(page.locator('#combobox-form')).toHaveAttribute('data-submits', '0')
  await input.press('ArrowDown')
  await input.press('Enter')
  await expect(page.locator('#combobox-form')).toHaveAttribute('data-submits', '0')
  await input.click()
  const tab = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab'
  await input.press(tab)
  await expect(page.getByRole('button', { name: 'Clear selection' })).toBeFocused()
  await page.keyboard.press(tab)
  await expect(submit).toBeFocused()
  await expect(page.getByRole('listbox')).toHaveCount(0)
  await submit.press('Enter')
  await expect(page.locator('#combobox-form')).toHaveAttribute('data-submits', '1')
})

test('combobox popup stays readable in both themes and narrow layouts', async ({ page }) => {
  await page.goto('/playground/#/components/combobox')
  const input = page.getByRole('combobox', { name: 'Município', exact: true })
  for (const theme of ['light', 'dark']) {
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await input.fill('a')
      await expect(page.getByRole('option').first()).toBeVisible()
      const bounds = await page.locator('.m-combobox-popup').boundingBox()
      expect(bounds!.x).toBeGreaterThanOrEqual(0)
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
      expect(bounds!.y).toBeGreaterThanOrEqual(0)
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(900)
      expect(
        await page
          .locator('.m-combobox-popup')
          .evaluate((element) => element.scrollWidth <= element.clientWidth),
      ).toBe(true)
      const audit = await new AxeBuilder({ page })
        .include('.m-combobox')
        .include('.m-combobox-popup')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()
      expect(audit.violations).toEqual([])
      await input.press('Escape')
    }
    if (theme === 'light') await page.getByRole('button', { name: 'Trocar tema' }).click()
  }
})
