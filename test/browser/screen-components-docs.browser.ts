import { test, expect } from '@playwright/test'

const docsOrigin = process.env.MAVIS_DOCS_ORIGIN ?? 'http://127.0.0.1:4173'
for (const pt of [false, true])
  test(`screen component documentation exposes unreleased examples: ${pt ? 'pt' : 'en'}`, async ({
    page,
  }) => {
    for (const name of [
      'collapsible-header',
      'refresh-control',
      'composer',
      'speed-dial',
      'pin-input',
      'animated-text',
    ]) {
      await page.goto(`${docsOrigin}${pt ? '/pt-BR' : ''}/components/${name}`)
      const status = page.locator('.doc-masthead .catalog-status.new')
      await expect(status).toHaveText(pt ? 'Novo' : 'New')
      await expect(status).toHaveAttribute(
        'title',
        new RegExp(pt ? 'Em desenvolvimento' : 'In development'),
      )
      await expect(
        page.frameLocator('.component-preview iframe').locator('[data-testid="component-preview"]'),
      ).toBeVisible()
    }
  })
