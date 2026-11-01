import { expect, test } from '@playwright/test'

test('opens from its label, navigates without committing, cancels and restores focus', async ({
  page,
  browserName,
}) => {
  await page.goto('/playground/#/components/select')
  const trigger = page.locator('.m-select-trigger').first()
  await page.locator('label').filter({ hasText: 'Seu universo' }).click()
  const dialog = page.getByRole('dialog', { name: 'Seu universo', exact: true })
  const list = dialog.getByRole('listbox')
  await expect(list).toBeFocused()
  await expect(dialog.getByRole('option', { name: 'Design', exact: true })).toHaveAttribute(
    'data-active',
    'true',
  )
  await list.press('ArrowDown')
  await expect(dialog.getByRole('option', { name: 'Fotografia', exact: true })).toHaveAttribute(
    'data-active',
    'true',
  )
  await expect(dialog.locator('[aria-selected="true"]')).toHaveCount(0)
  await list.press('End')
  await expect(
    dialog.getByRole('option', { name: 'Arquitetura e espaços para viver' }),
  ).toHaveAttribute('data-active', 'true')
  await list.press('ArrowDown')
  await expect(dialog.getByRole('option', { name: 'Design', exact: true })).toHaveAttribute(
    'data-active',
    'true',
  )
  await list.press('f')
  await expect(dialog.getByRole('option', { name: 'Fotografia', exact: true })).toHaveAttribute(
    'data-active',
    'true',
  )
  const tab = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab'
  await list.press(tab)
  await expect(dialog.getByRole('button', { name: 'Fechar' })).toBeFocused()
  await page.keyboard.press(tab)
  await expect(list).toBeFocused()
  await list.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
  await expect(page.getByText('0 alterações', { exact: true })).toBeVisible()
  await trigger.press('ArrowDown')
  await list.press('ArrowDown')
  await list.press('Enter')
  await expect(dialog).toBeHidden()
  await expect(trigger).toContainText('Fotografia')
  await expect(trigger).toBeFocused()
  await expect(page.getByText('1 alteração', { exact: true })).toBeVisible()
  await trigger.click()
  await dialog.getByRole('option', { name: 'Fotografia', exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByText('1 alteração', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Limpar escolha' }).click()
  await expect(trigger).toContainText('Escolha um interesse')
  await expect(page.getByRole('button', { name: 'Seleção da equipe Design' })).toBeDisabled()
  await expect(page.getByRole('button', { name: /Interesse obrigatório/ })).toHaveAttribute(
    'aria-invalid',
    'true',
  )
})

test('preserves number/string values, handles parent rejection and disables the current selection', async ({
  page,
}) => {
  await page.goto('/playground/#/checks/select')
  const accepted = page.locator('#accepted')
  const dialog = page.getByRole('dialog', { name: 'Accepted choices' })
  await accepted.click()
  await dialog.getByRole('option', { name: 'Numeric one' }).click()
  await expect(page.getByText('Value: number:1; changes: 1', { exact: true })).toBeVisible()
  await accepted.click()
  await dialog.getByRole('option', { name: 'String one' }).click()
  await expect(page.getByText('Value: string:1; changes: 2', { exact: true })).toBeVisible()
  await page.locator('#reverse').click()
  await expect(accepted).toContainText('String one')
  await page.locator('#rejected').click()
  await page
    .getByRole('dialog', { name: 'Rejected choices' })
    .getByRole('option', { name: 'Numeric one' })
    .click()
  await expect(page.locator('#rejected')).toContainText('Alpha')
  await expect(page.getByText('Requests: 1', { exact: true })).toBeVisible()
  await page.locator('#missing').click()
  await expect(accepted).toContainText('Select an option')
  await page.locator('#clear').click()
  await expect(page.getByText('Value: object:; changes: 2', { exact: true })).toBeVisible()
})

test('updates the open list, ignores removed options, and closes on disable or unmount', async ({
  page,
}) => {
  await page.goto('/playground/#/checks/select')
  const trigger = page.locator('#accepted')
  const dialog = page.getByRole('dialog', { name: 'Accepted choices' })
  const external = (id: string) => page.locator(id).evaluate((el: HTMLElement) => el.click())
  await trigger.click()
  await external('#disable-option')
  await expect(dialog.getByRole('option', { name: 'Alpha' })).toHaveAttribute(
    'aria-disabled',
    'true',
  )
  await expect(dialog.getByRole('option', { name: 'Alpha' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(dialog.getByRole('option', { name: 'Numeric one' })).toHaveAttribute(
    'data-active',
    'true',
  )
  await external('#remove')
  await expect(dialog.getByRole('option', { name: 'Alpha' })).toHaveCount(0)
  await external('#reverse')
  await expect(dialog.getByRole('option').first()).toHaveText('Unavailable')
  await external('#disable')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeDisabled()
  await page.locator('#disable').click()
  await trigger.click()
  await external('#unmount')
  await expect(dialog).toHaveCount(0)
  await expect(page.getByText('Value: string:a; changes: 0', { exact: true })).toBeVisible()
  await page.locator('#unmount').click()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
})

test('keeps empty/disabled lists cancellable, cancels via backdrop, and releases on navigation', async ({
  page,
}) => {
  await page.goto('/playground/#/checks/select')
  await page.getByRole('button', { name: 'Empty choices Select an option' }).click()
  await expect(page.getByRole('dialog').getByText('Nothing here yet')).toBeVisible()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click()
  await page.getByRole('button', { name: 'All disabled Select an option' }).click()
  await expect(page.getByRole('option')).toHaveAttribute('aria-disabled', 'true')
  await page.mouse.click(12, 12)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.locator('#accepted').click()
  await page.evaluate(() => {
    location.hash = '#/showcase/profile'
  })
  await expect(page.getByRole('heading', { name: 'Do seu jeito.' })).toBeVisible()
  await expect(page.locator('dialog[open]')).toHaveCount(0)
  await page.getByRole('textbox', { name: 'Nome completo' }).fill('Marina Silva')
  await expect(page.getByRole('textbox', { name: 'Nome completo' })).toHaveValue('Marina Silva')
})

test('handles fifty options, keyboard reveal, themes and narrow screens', async ({
  page,
}, info) => {
  await page.goto('/playground/#/checks/select')
  await page.locator('#many').click()
  await page.locator('#accepted').click()
  const list = page.getByRole('listbox')
  await expect(page.getByRole('option')).toHaveCount(50)
  await list.press('End')
  await expect(page.getByRole('option', { name: 'Option 50', exact: true })).toBeInViewport()
  await list.press('Space')
  await expect(page.getByText('Value: number:49; changes: 1', { exact: true })).toBeVisible()
  await page.locator('#accepted').click()
  await expect(page.getByRole('option', { name: 'Option 50', exact: true })).toBeInViewport()
  await list.press('Escape')
  await page.goto('/playground/#/components/select')
  for (const theme of ['mavis', 'midnight']) {
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await page.getByRole('button', { name: 'Seu universo Escolha um interesse' }).click()
      const dialog = page.getByRole('dialog', { name: 'Seu universo', exact: true })
      await expect(dialog).toHaveCSS('translate', '0px')
      expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
      await page.screenshot({ path: info.outputPath(`select-${theme}-${width}.png`) })
      await page.keyboard.press('Escape')
      await expect(dialog).toBeHidden()
    }
    if (theme === 'mavis') await page.getByRole('button', { name: 'Trocar tema' }).click()
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.m-select-trigger').first()).toHaveCSS('transition-duration', '0s')
  await page.setViewportSize({ width: 320, height: 900 })
  await page.locator('.m-select-trigger').first().click()
  await page
    .locator('.m-select-option span')
    .evaluateAll((els) => els.forEach((el) => ((el as HTMLElement).style.fontSize = '32px')))
  expect(await page.getByRole('dialog').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  )
  await page.getByRole('option', { name: 'Arquitetura e espaços para viver' }).click()
  expect(await page.getByRole('main').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
})

test('saves and discards Select with the other Profile fields', async ({ page }) => {
  await page.goto('/playground/#/showcase/profile')
  const trigger = page.getByRole('button', { name: 'Seu universo Design' })
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('nova@exemplo.com')
  await trigger.click()
  await page.getByRole('option', { name: 'Fotografia', exact: true }).click()
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(page.getByText('Tudo com a sua cara.', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Seu universo Fotografia' }).click()
  await page.getByRole('option', { name: 'Arquitetura', exact: true }).click()
  await page.getByRole('button', { name: 'Descartar alterações' }).click()
  await expect(page.getByRole('button', { name: 'Seu universo Fotografia' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'E-mail', exact: true })).toHaveValue(
    'nova@exemplo.com',
  )
})
