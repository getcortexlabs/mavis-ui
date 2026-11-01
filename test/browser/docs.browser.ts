import { expect, test } from '@playwright/test'

const examples = [
  ['button', 'Primary', 'Primary'],
  ['input', 'Name', 'Nome'],
  ['switch', 'Notifications', 'Notificações'],
  ['tabs', 'Overview', 'Visão geral'],
  ['list-item', 'Choose a row to continue.', 'Escolha uma linha para continuar.'],
  ['separator', 'Change orientation', 'Alternar orientação'],
  ['avatar', 'Image', 'Imagem'],
  ['badge', 'New idea', 'Nova ideia'],
  ['accordion', 'Helpful', 'Foi útil'],
  ['segmented-control', 'Day', 'Dia'],
  ['progress', 'Advance', 'Avançar'],
  ['alert', 'View details', 'Ver detalhes'],
  ['skeleton', 'Show content', 'Mostrar conteúdo'],
  ['dialog', 'Publish collection', 'Publicar coleção'],
  ['toast', 'Success', 'Sucesso'],
  ['select', 'Your world', 'Seu universo'],
  ['radio', 'Reading rhythm', 'Ritmo de leitura'],
  ['checkbox', 'All topics', 'Todos os assuntos'],
  ['slider', 'Volume', 'Volume'],
  ['card', 'A space of your own.', 'Um espaço seu.'],
  ['text', 'Hello.', 'Olá.'],
  ['icon', 'Search', 'Buscar'],
  ['row', 'Gap: md', 'Gap: md'],
  ['column', 'Align: stretch', 'Align: stretch'],
  ['box', 'Background layer', 'Camada de fundo'],
  ['screen', 'A whole screen.', 'Uma tela inteira.'],
  ['sheet', 'Open sheet', 'Abrir sheet'],
  ['reveal', 'Show details', 'Mostrar detalhes'],
] as const

for (const language of ['en', 'pt'] as const) {
  test(`renders every ${language} component page with its real shared example`, async ({
    page,
  }) => {
    test.setTimeout(90_000) // Each case visits every component page and its iframe.
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    const prefix = language === 'pt' ? '/pt-BR' : ''
    for (const [id, english, portuguese] of examples) {
      await page.goto(`http://127.0.0.1:4173${prefix}/components/${id}`)
      await expect(page.locator('h1')).toHaveText(
        id === 'list-item'
          ? 'ListItem'
          : id === 'segmented-control'
            ? 'Segmented Control'
            : id[0]!.toUpperCase() + id.slice(1),
      )
      await page.locator('.component-preview iframe').scrollIntoViewIfNeeded()
      const preview = page.frameLocator('.component-preview iframe')
      await expect(
        preview.getByText(language === 'pt' ? portuguese : english, { exact: true }).first(),
      ).toBeVisible()
      await page.locator('details summary').click()
      await expect(page.locator('details')).toContainText('<template>')
      await expect(page.locator('.vp-doc')).not.toContainText('Code snippet path not found')
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      )
    }
    expect(errors).toEqual([])
  })
}

test('switches preview themes without resetting the example or changing the site theme', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('http://127.0.0.1:4173/pt-BR/components/button')
  await page.locator('.component-preview iframe').scrollIntoViewIfNeeded()
  const preview = page.frameLocator('.component-preview iframe')
  await expect(preview.getByRole('button', { name: 'Primary', exact: true })).toHaveCSS(
    'font-family',
    /sans-serif/,
  )
  const siteTheme = await page.locator('html').getAttribute('class')
  await preview.getByRole('button', { name: 'Primary', exact: true }).click()
  await expect(preview.getByText('1 clique', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Midnight', exact: true }).click()
  await expect(preview.getByText('1 clique', { exact: true })).toBeVisible()
  await expect(preview.getByRole('button', { name: 'Primary', exact: true })).toHaveCSS(
    'background-color',
    'rgb(242, 169, 200)',
  )
  expect(await page.locator('html').getAttribute('class')).toBe(siteTheme)
  await page.screenshot({
    path: info.outputPath('docs-button-desktop.png'),
    fullPage: true,
    animations: 'disabled',
  })
  await page.setViewportSize({ width: 320, height: 844 })
  await expect
    .poll(() => preview.locator('body').evaluate((el) => el.scrollHeight <= innerHeight))
    .toBe(true)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({
    path: info.outputPath('docs-button-mobile.png'),
    fullPage: true,
    animations: 'disabled',
  })
})

test('presents the component gallery with working links and both site themes', async ({
  page,
}, info) => {
  await page.goto('http://127.0.0.1:4173/pt-BR/components/')
  await expect(page.locator('.gallery-card')).toHaveCount(28)
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({
      path: info.outputPath(`docs-gallery-${width}.png`),
      fullPage: true,
      animations: 'disabled',
    })
  }
  await page.locator('.VPNavBarAppearance .VPSwitchAppearance').click()
  await page.screenshot({
    path: info.outputPath('docs-gallery-dark.png'),
    fullPage: true,
    animations: 'disabled',
  })
  await page
    .locator('.gallery-card')
    .filter({ has: page.getByRole('heading', { name: 'Slider', exact: true }) })
    .click()
  await expect(page).toHaveURL(/\/components\/slider$/)
})
