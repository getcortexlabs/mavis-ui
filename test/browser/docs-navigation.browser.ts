import { expect, test } from '@playwright/test'
const docsOrigin = process.env.MAVIS_DOCS_ORIGIN ?? 'http://127.0.0.1:4173'

for (const pt of [false, true]) {
  test(`documentation categories navigate by keyboard and expose release status: ${pt ? 'pt' : 'en'}`, async ({
    page,
  }, info) => {
    const prefix = pt ? '/pt-BR' : ''
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto(`${docsOrigin}${prefix}/components/data-table`)
    const sidebar = page.locator('.VPSidebar')
    const data = sidebar.locator('.VPSidebarItem.level-0').filter({
      has: page.locator('.catalog-category', {
        hasText: pt ? 'Dados e coleções' : 'Data & collections',
      }),
    })
    await expect(data).not.toHaveClass(/collapsed/)
    await expect(data.locator('.catalog-count')).toHaveText('6')
    await expect(sidebar.locator('.catalog-status.new')).toHaveCount(12)
    await expect(sidebar.locator('.catalog-status.updated')).toHaveCount(40)
    await expect(sidebar.locator('.catalog-legend')).toContainText('Mavis 0.1.0-rc.11.1')
    await expect(page.locator('.doc-masthead .catalog-status.updated')).toHaveText(
      pt ? 'Atualizado' : 'Updated',
    )
    const base = sidebar
      .locator('.VPSidebarItem.level-0')
      .filter({ has: page.locator('.catalog-category', { hasText: /^Base$/ }) })
    await expect(base).toHaveClass(/collapsed/)
    await base.locator(':scope > .item').focus()
    await page.keyboard.press('Enter')
    await expect(base.getByRole('link', { name: 'Accordion', exact: true })).toBeVisible()
    await base.getByRole('link', { name: 'Accordion', exact: true }).click()
    await expect(page.locator('h1')).toHaveText('Accordion')
    await expect(
      page
        .frameLocator('.component-preview iframe')
        .getByText(pt ? 'Foi útil' : 'Helpful', { exact: true })
        .first(),
    ).toBeVisible()
    await expect(base).not.toHaveClass(/collapsed/)
    await page.locator('.VPNavBarAppearance .VPSwitchAppearance').click()
    await page.screenshot({
      path: info.outputPath('categories-desktop.png'),
      animations: 'disabled',
    })

    await page.setViewportSize({ width: 390, height: 844 })
    await page.getByRole('button', { name: 'Menu', exact: true }).click()
    const compositions = sidebar.locator('.VPSidebarItem.level-0').filter({
      has: page.locator('.catalog-category', {
        hasText: pt ? /^Composições$/ : /^Compositions$/,
      }),
    })
    await compositions.locator(':scope > .item').click()
    await compositions
      .getByRole('link', { name: pt ? 'Formulário de autenticação' : 'Auth form', exact: true })
      .click()
    await expect(page).toHaveURL(new RegExp(`${prefix}/showcase/morrow$`))
    await expect(page.locator('h1')).toHaveText('Morrow')
    await expect(sidebar).not.toHaveClass(/open/)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.goto(`${docsOrigin}${prefix}/compositions/`)
    await expect(page.locator('.vp-doc table tbody tr')).toHaveCount(5)
    await expect(page.locator('.vp-doc')).toContainText(
      pt ? 'demonstrações locais' : 'local demonstrations',
    )
    await page.getByRole('button', { name: 'Menu', exact: true }).click()
    await expect(sidebar).toHaveClass(/open/)
    await page.screenshot({
      path: info.outputPath('categories-mobile.png'),
      animations: 'disabled',
    })
  })
}
