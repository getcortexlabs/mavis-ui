import { expect, test } from '@playwright/test'

test('keeps external values intact and blocks editing while disabled or readonly', async ({
  page,
}) => {
  await page.goto('/playground/#/checks/input')
  const field = page.getByLabel('Value', { exact: true })
  await page.getByRole('button', { name: 'External reset', exact: true }).click()
  await expect(field).toHaveValue('012345')
  await expect(page.locator('#input-check-state')).toContainText('012345')
  await page.getByRole('button', { name: 'Short reset', exact: true }).click()
  await field.focus()
  await field.evaluate((el: HTMLInputElement) =>
    el.setSelectionRange(el.value.length, el.value.length),
  )
  await field.pressSequentially('cde')
  await expect(field).toHaveValue('abc')
  await page.getByRole('button', { name: 'Disable', exact: true }).click()
  await page.getByRole('button', { name: 'Focus', exact: true }).click()
  await expect(field).not.toBeFocused()
  await expect(field).toBeDisabled()
  await page.getByRole('button', { name: 'Enable', exact: true }).click()
  await page.getByRole('button', { name: 'Read only', exact: true }).click()
  await expect(field).not.toBeEditable()
  await page.getByRole('button', { name: 'Editable', exact: true }).click()
  await page.getByRole('button', { name: 'Focus', exact: true }).click()
  await expect(field).toBeFocused()
  await page.getByRole('button', { name: 'Blur', exact: true }).click()
  await expect(page.locator('#input-check-state')).toContainText('blurred')
  await page.setViewportSize({ width: 390, height: 500 })
  const bio = page.getByLabel('Multiline', { exact: true })
  await bio.focus()
  await bio.fill('one\ntwo\nthree\nfour\nfive\nsix')
  await expect
    .poll(() => bio.evaluate((el) => el.getBoundingClientRect().bottom <= innerHeight - 8))
    .toBe(true)
})

test('edits text without moving the caret, handles composition and preserves multiline input', async ({
  page,
}) => {
  await page.goto('/playground/#/preview/input')
  const name = page.getByLabel('Nome', { exact: true })
  await name.fill('Marina')
  await name.evaluate((el: HTMLInputElement) => el.setSelectionRange(3, 3))
  await name.pressSequentially('X')
  await expect(name).toHaveValue('MarXina')
  expect(await name.evaluate((el: HTMLInputElement) => el.selectionStart)).toBe(4)
  await name.evaluate((el: HTMLInputElement) => {
    el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
    el.value = '日本'
    el.dispatchEvent(new InputEvent('input', { bubbles: true, data: '日本', isComposing: true }))
    el.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true }),
    )
  })
  await expect(page.getByText('Enviado: 日本')).toHaveCount(0)
  await name.dispatchEvent('compositionend', { data: '日本' })
  await name.press('Enter')
  await expect(page.getByText('Enviado: 日本')).toBeVisible()
  const bio = page.getByLabel('Bio', { exact: true })
  await bio.fill('Primeira')
  await bio.press('End')
  await bio.press('Enter')
  await bio.pressSequentially('Segunda')
  await expect(bio).toHaveValue('Primeira\nSegunda')
  await bio.fill('x'.repeat(160))
  await bio.pressSequentially('y')
  await expect(bio).toHaveValue('x'.repeat(160))
  await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'password')
  await expect(page.getByLabel('Identificador', { exact: true })).not.toBeEditable()
  await expect(page.getByLabel('Convite', { exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Restaurar', exact: true }).click()
  await expect(name).toHaveValue('Marina Costa')
  await page.getByRole('button', { name: 'Focar nome', exact: true }).click()
  await expect(name).toBeFocused()
})

test('validates a profile, moves focus, saves locally and keeps both themes responsive', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/playground/#/showcase')
  await page.getByRole('button', { name: 'Explorar perfil ↗' }).click()
  const name = page.getByLabel('Nome completo', { exact: true })
  const email = page.getByLabel('E-mail', { exact: true })
  const bio = page.getByLabel('Sobre você', { exact: true })
  await name.fill('')
  await email.fill('invalido')
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(name).toBeFocused()
  await expect(name).toHaveAttribute('aria-invalid', 'true')
  await name.fill('Rafa Augusto')
  await name.press('Enter')
  await expect(email).toBeFocused()
  await email.fill('rafa@exemplo.com')
  await email.press('Enter')
  await expect(bio).toBeFocused()
  await bio.fill('Criando interfaces.\nUm detalhe de cada vez.')
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(page.locator('.m-toast-message')).toHaveText('Perfil salvo nesta demonstração.')
  await expect(bio).not.toBeFocused()
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
  await expect(page.locator('.m-reveal-enter-active')).toHaveCount(0)
  for (const theme of ['light', 'dark']) {
    if (theme === 'dark') await page.getByRole('button', { name: 'Trocar tema' }).click()
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      const main = page.getByRole('main')
      expect(await main.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
      await expect(name).toHaveValue('Rafa Augusto')
      await main.evaluate((el) => {
        el.scrollTop = 0
      })
      await page.screenshot({ path: info.outputPath(`profile-${theme}-${width}.png`) })
    }
  }
  await name.fill('Unsaved')
  await page.getByRole('button', { name: 'Descartar alterações' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Descartar', exact: true }).click()
  await expect(name).toHaveValue('Rafa Augusto')
  await bio.fill(Array(12).fill('Texto longo para crescer com o campo.').join('\n'))
  expect(await bio.evaluate((el) => el.scrollHeight <= el.clientHeight + 1)).toBe(true)
  expect(errors).toEqual([])
})
