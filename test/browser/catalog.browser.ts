import { expect, test } from '@playwright/test'

const components = [
  'Button',
  'Input',
  'Switch',
  'Checkbox',
  'Radio',
  'Select',
  'Slider',
  'Card',
  'Text',
  'Icon',
  'Row',
  'Column',
  'Box',
  'Screen',
  'Sheet',
  'Reveal',
]

test('opens on the component catalog and reaches every shared example', async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/playground/')
  await expect(page.getByRole('heading', { name: 'Componentes', exact: true })).toBeVisible()
  await expect(page.getByRole('main')).toHaveCSS('background-color', 'rgb(250, 247, 250)')
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    expect(await page.getByRole('main').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    )
    await page.screenshot({ path: info.outputPath(`catalog-home-${width}.png`), fullPage: true })
  }
  await page.setViewportSize({ width: 390, height: 844 })
  for (const name of components) {
    await page.getByRole('button', { name: `Explorar ${name}` }).click()
    await expect(page).toHaveURL(new RegExp(`/components/${name.toLowerCase()}$`))
    await expect(
      page.getByRole('heading', {
        name: name === 'Screen' ? 'Uma tela inteira.' : name,
        exact: true,
      }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Como usar', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Propriedades', exact: true })).toBeVisible()
    expect(await page.getByRole('main').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    )
    await page.getByRole('button', { name: '← Componentes', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Componentes', exact: true })).toBeVisible()
  }
  await page.getByRole('button', { name: 'Showcase ↗' }).click()
  await expect(page.getByRole('heading', { name: 'Showcase', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Explorar veículo ↗' }).click()
  await expect(page).toHaveURL(/\/showcase\/vehicle$/)
  await expect(page.getByRole('slider', { name: 'Temperatura da cabine' })).toBeVisible()
  expect(errors).toEqual([])
})

test('opens a component from the card surface and from the keyboard', async ({ page }, info) => {
  await page.goto('/playground/')
  const card = page.getByRole('button', { name: 'Explorar Button', exact: true })
  await card.click({ position: { x: 24, y: 24 } })
  await expect(page).toHaveURL(/\/components\/button$/)
  await page.getByRole('button', { name: '← Componentes' }).click()
  await page.getByRole('button', { name: 'Showcase ↗' }).focus()
  await page.keyboard.press('Tab')
  await expect(card).toBeFocused()
  await card.press('Enter')
  await expect(page).toHaveURL(/\/components\/button$/)
  await page.getByRole('button', { name: '← Componentes' }).click()
  await page.getByRole('button', { name: 'Showcase ↗' }).focus()
  await page.keyboard.press('Tab')
  await expect(card).toBeFocused()
  await expect(card).toHaveCSS('outline-style', 'solid')
  await card.press('Space')
  await expect(page).toHaveURL(/\/components\/button$/)
  await expect(page.getByRole('heading', { name: 'Eventos', exact: true })).toBeVisible()
  await expect(page.locator('.component-code')).toHaveCSS('white-space', 'pre-wrap')
  await expect(page.getByText('variant', { exact: true })).toBeVisible()
  await expect(page.getByText('primary | secondary | ghost', { exact: true })).toBeVisible()
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    expect(await page.getByRole('main').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    )
    await page.screenshot({
      path: info.outputPath(`component-reference-${width}.png`),
      fullPage: true,
    })
    await page.locator('.component-reference').screenshot({
      path: info.outputPath(`component-properties-${width}.png`),
    })
  }
  await page.goto('/playground/#/components/card')
  await page.getByRole('button', { name: '+ Layout e espaçamento', exact: true }).click()
  await expect(page.getByText('paddingX / paddingY', { exact: true })).toBeVisible()
})

test('keeps component state when changing themes and handles loading', async ({ page }, info) => {
  await page.goto('/playground/#/components/button')
  await page.getByRole('button', { name: 'Primary', exact: true }).click()
  await expect(page.getByText('1 clique', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Trocar tema' }).click()
  await expect(page.getByText('1 clique', { exact: true })).toBeVisible()
  await expect(page.getByRole('main')).toHaveCSS('background-color', 'rgb(21, 18, 28)')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Salvando…' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Salvo', exact: true })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Indisponível' })).toBeDisabled()
  await page.screenshot({ path: info.outputPath('catalog-button.png'), fullPage: true })
})

test('follows the device appearance until a theme is chosen', async ({ page }) => {
  const main = page.getByRole('main')
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/playground/#/')
  await expect(main).toHaveCSS('background-color', 'rgb(21, 18, 28)')
  await expect(page.getByRole('button', { name: 'Trocar tema' })).toHaveText('◐ Claro')
  await page.getByRole('button', { name: 'Trocar tema' }).click()
  await expect(main).toHaveCSS('background-color', 'rgb(250, 247, 250)')
  await page.emulateMedia({ colorScheme: 'light' })
  await page.emulateMedia({ colorScheme: 'dark' })
  await expect(main).toHaveCSS('background-color', 'rgb(250, 247, 250)')
  await expect(page.getByRole('button', { name: 'Trocar tema' })).toHaveText('◐ Sistema')
  await page.getByRole('button', { name: 'Trocar tema' }).click()
  await expect(main).toHaveCSS('background-color', 'rgb(21, 18, 28)')
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(main).toHaveCSS('background-color', 'rgb(250, 247, 250)')
  await expect(page.getByRole('button', { name: 'Trocar tema' })).toHaveText('◐ Escuro')
})

test('preserves the old vehicle link as a redirect into Showcase', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/garage/#/details')
  await expect(page).toHaveURL(/\/playground\/#\/showcase\/vehicle\/details$/)
  await expect(page.getByRole('heading', { name: 'Seu próximo caminho.' })).toBeVisible()
})
