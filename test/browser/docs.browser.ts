import { expect, test } from '@playwright/test'

const examples = [
  ['button', 'Primary', 'Primary'],
  ['slider', 'Volume', 'Volume'],
  ['card', 'A space of your own.', 'Um espaço seu.'],
  ['text', 'Hello.', 'Olá.'],
  ['row', 'Gap: md', 'Gap: md'],
  ['column', 'Align: stretch', 'Align: stretch'],
  ['box', 'Background layer', 'Camada de fundo'],
  ['screen', 'A whole screen.', 'Uma tela inteira.'],
  ['reveal', 'Show details', 'Mostrar detalhes'],
] as const

for (const language of ['en', 'pt'] as const) {
  test(`renders every ${language} component page with its real shared example`, async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    const prefix = language === 'pt' ? '/pt-BR' : ''
    for (const [id, english, portuguese] of examples) {
      await page.goto(`http://127.0.0.1:4173${prefix}/components/${id}`)
      await expect(page.locator('h1')).toHaveText(id[0]!.toUpperCase() + id.slice(1))
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
    'rgb(210, 250, 122)',
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
