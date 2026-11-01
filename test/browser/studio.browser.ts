import { test, expect } from '@playwright/test'

test('keeps brand and nested scopes independent across live appearance changes and overlays', async ({
  page,
}, info) => {
  await page.goto('/playground/#/showcase/studio')
  const headline = page.locator('#studio-headline')
  const outside = page.getByRole('button', { name: '← Showcase', exact: true })
  const outerColor = await outside.evaluate((el) => getComputedStyle(el).color)
  const note = page.locator('#studio-note')
  const noteColor = await note.evaluate((el) => getComputedStyle(el).backgroundColor)
  await expect(headline).toHaveText('Menos pressa. Mais presença.')
  await expect(headline.locator('em')).toHaveText('Mais presença.')
  await expect(headline).toHaveCSS('font-family', /Georgia/)
  await expect(page.getByLabel('Seu e-mail', { exact: true })).toHaveCSS('font-size', '17px')
  await page.getByRole('button', { name: 'Edição noturna' }).click()
  await expect(outside).toHaveCSS('color', outerColor)
  await expect(note).toHaveCSS('background-color', noteColor)
  const accent = await headline.locator('em').evaluate((el) => getComputedStyle(el).color)
  await page.getByRole('button', { name: 'Conheça a edição' }).click()
  const sheet = page.getByRole('dialog', { name: 'Nesta edição' })
  await expect(sheet).toBeVisible()
  await expect(sheet.locator('em')).toHaveCSS('color', accent)
  await expect(sheet.locator('em')).toHaveCSS('font-family', /Georgia/)
  await sheet.getByRole('button', { name: 'Voltar à edição' }).click()
  await expect(sheet).toBeHidden()
  await page.getByLabel('Seu e-mail', { exact: true }).fill('reader@example.com')
  await expect(page.getByLabel('Seu e-mail', { exact: true })).toHaveValue('reader@example.com')
  await page.getByRole('button', { name: 'Quero receber a carta' }).click()
  const dialog = page.getByRole('dialog', { name: 'Um lugar na sua semana' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('heading')).toHaveCSS('font-family', /Georgia/)
  await dialog.getByRole('button', { name: 'Sim, quero receber' }).click()
  await expect(page.getByText('Seu lugar está guardado.', { exact: true })).toBeVisible()
  await expect(page.getByText('Uma boa leitura chega no domingo.', { exact: true })).toHaveCSS(
    'font-family',
    /Avenir/,
  )
  await page.screenshot({ path: info.outputPath('studio-confirmed.png') })
})

test('wraps one semantic heading and exposes inner editor tokens at narrow and wide widths', async ({
  page,
}, info) => {
  await page.goto('/playground/#/showcase/studio')
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const mode of ['light', 'dark']) {
      if (mode === 'dark') await page.getByRole('button', { name: 'Edição noturna' }).click()
      await page.locator('#studio-headline').scrollIntoViewIfNeeded()
      expect(
        await page.getByRole('main').evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
      ).toBe(true)
      await expect(page.locator('#studio-headline')).toHaveCount(1)
      await expect(page.locator('#studio-feature')).toHaveCSS('box-shadow', /24px/)
      await page.screenshot({ path: info.outputPath(`atelier-${mode}-${width}.png`) })
      if (mode === 'dark') await page.getByRole('button', { name: 'Edição diurna' }).click()
    }
  }
  const input = page.getByLabel('Seu e-mail', { exact: true })
  await page.locator('.m-input').evaluate((el) => {
    const style = (el as HTMLElement).style
    style.setProperty('--m-input-font-size', '21px')
    style.setProperty('--m-input-padding-x', '25px')
  })
  await expect(input).toHaveCSS('font-size', '21px')
  await expect(input).toHaveCSS('padding-left', '25px')
  await expect(input).toHaveCSS('padding-right', '25px')
  await page.locator('#studio-headline').evaluate((el) => {
    ;(el as HTMLElement).style.fontSize = '30px'
  })
  await expect(page.locator('#studio-headline')).toHaveCSS('font-size', '30px')
})
