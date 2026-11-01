import { expect, test } from '@playwright/test'

test('activates a row from its leading surface and keyboard, blocks disabled rows and preserves child actions', async ({
  page,
}) => {
  await page.goto('/playground/#/components/list-item')
  const person = page.getByRole('button', {
    name: 'Abrir Marina Costa, Design, disponível',
    exact: true,
  })
  await person.click({ position: { x: 24, y: 24 } })
  await expect(page.locator('#list-selection')).toHaveText('Selecionado: Marina Costa')
  const library = page.getByRole('button', { name: /^Biblioteca de ideias/ })
  await library.focus()
  await library.press('Enter')
  await expect(page.locator('#list-selection')).toHaveText('Selecionado: Biblioteca de ideias')
  await person.focus()
  await person.press('Space')
  await expect(page.locator('#list-selection')).toHaveText('Selecionado: Marina Costa')
  await expect(person).toHaveCSS('outline-style', 'solid')
  const disabled = page.getByRole('button', { name: /^Arquivo da equipe/ })
  await expect(disabled).toBeDisabled()
  await expect(disabled).toHaveAttribute('tabindex', '-1')
  await disabled.click({ force: true })
  await expect(page.locator('#list-selection')).toHaveText('Selecionado: Marina Costa')
  await page.getByRole('button', { name: 'Favoritar', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Remover favorito', exact: true })).toBeVisible()
  await expect(page.locator('#list-selection')).toHaveText('Selecionado: Marina Costa')
})

test('fits automatic separators inside padding and swaps the explicit line orientation', async ({
  page,
}) => {
  await page.goto('/playground/#/components/separator')
  const horizontal = page.locator('#separator-horizontal'),
    vertical = page.locator('#separator-vertical'),
    changing = page.locator('#separator-changing')
  await expect(horizontal).toHaveCSS('height', '1px')
  const bounds = await horizontal.boundingBox(),
    parent = await horizontal.locator('..').boundingBox()
  expect(bounds!.x - parent!.x).toBeGreaterThanOrEqual(32)
  expect(parent!.x + parent!.width - bounds!.x - bounds!.width).toBeGreaterThanOrEqual(32)
  await expect(vertical).toHaveCSS('width', '1px')
  await expect(vertical).toHaveCSS('height', '56px')
  for (const line of [horizontal, vertical, changing]) {
    await expect(line).toHaveAttribute('aria-hidden', 'true')
    await expect(line).toHaveAttribute('inert', '')
  }
  await expect(changing).toHaveCSS('width', '80px')
  await expect(changing).toHaveCSS('height', '1px')
  await page.getByRole('button', { name: 'Alternar orientação' }).click()
  await expect(changing).toHaveCSS('width', '1px')
  await expect(changing).toHaveCSS('height', '80px')
  await page.getByRole('button', { name: 'Alternar orientação' }).click()
  await expect(changing).toHaveCSS('width', '80px')
  await expect(changing).toHaveCSS('height', '1px')
})

test('preserves Team favorites through member details and availability filters', async ({
  page,
}) => {
  await page.goto('/playground/#/showcase/team')
  const member = page.getByRole('button', { name: /^Marina Costa, Design, disponível/ })
  await member.focus()
  await member.press('Enter')
  const details = page.getByRole('dialog', { name: 'Marina Costa', exact: true })
  await expect(details).toBeVisible()
  await details.getByRole('button', { name: 'Favoritar contato', exact: true }).click()
  await expect(details.getByText('Contato salvo nos favoritos desta sessão.')).toBeVisible()
  await details.getByRole('button', { name: 'Fechar', exact: true }).click()
  await expect(member).toHaveAccessibleName('Marina Costa, Design, disponível, favorito')
  await expect(member).toBeFocused()
  await page.getByRole('tab', { name: 'Disponíveis (3)' }).click()
  await expect(page.getByRole('button', { name: /^Lucas Mendes,/ })).toHaveCount(0)
  await member.click()
  await details.getByRole('button', { name: 'Remover favorito', exact: true }).click()
  await page.keyboard.press('Escape')
  await expect(member).toHaveAccessibleName('Marina Costa, Design, disponível')
  await page.getByRole('tab', { name: 'Todas (4)' }).click()
  await expect(page.getByRole('button', { name: /^Lucas Mendes,/ })).toBeVisible()
})

test('reviews rows, separators and Team at narrow widths in both themes', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.emulateMedia({ colorScheme: 'light' })
  for (const path of ['components/list-item', 'components/separator', 'showcase/team']) {
    await page.goto(`/playground/#/${path}`)
    await page.reload()
    for (const theme of ['mavis', 'midnight']) {
      for (const width of [320, 390, 1440]) {
        await page.setViewportSize({ width, height: 1100 })
        expect(
          await page.getByRole('main').evaluate((el) => el.scrollWidth <= el.clientWidth),
        ).toBe(true)
        await page.screenshot({
          path: info.outputPath(`${path.replace('/', '-')}-${theme}-${width}.png`),
        })
      }
      if (theme === 'mavis') await page.getByRole('button', { name: 'Trocar tema' }).click()
    }
  }
  await page.setViewportSize({ width: 320, height: 1000 })
  const row = page.getByRole('button', { name: /^Marina Costa,/ })
  const before = await row.boundingBox()
  await row.evaluate((el) => {
    for (const text of el.querySelectorAll<HTMLElement>('p')) text.style.fontSize = '32px'
  })
  await expect.poll(async () => (await row.boundingBox())!.height).toBeGreaterThan(before!.height)
  expect(await page.getByRole('main').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
  await page.screenshot({ path: info.outputPath('team-large-text.png') })
  expect(errors).toEqual([])
})
