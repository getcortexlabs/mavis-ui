import { test, expect } from '@playwright/test'
const origin = process.env.MAVIS_DOCS_ORIGIN ?? 'http://127.0.0.1:4173'
for (const pt of [false, true])
  test(`creative documentation includes all six working previews: ${pt ? 'pt' : 'en'}`, async ({
    page,
  }) => {
    test.setTimeout(60000)
    for (const [id, name] of [
      ['color-picker', 'ColorPicker'],
      ['swipe-deck', 'SwipeDeck'],
      ['gauge', 'Gauge'],
      ['tour', 'Tour'],
      ['transfer-list', 'TransferList'],
      ['marquee', 'Marquee'],
    ]) {
      await page.goto(`${origin}${pt ? '/pt-BR' : ''}/components/${id}`)
      await expect(page.locator('h1')).toHaveText(name!)
      await expect(page.locator('.doc-masthead .catalog-status.new')).toHaveText(
        pt ? 'Novo' : 'New',
      )
      await expect(page.locator('.vp-doc')).toContainText(
        pt ? 'Incluído na RC.12' : 'Included in RC.12',
      )
      const iframe = page.locator('.component-preview iframe')
      await iframe.scrollIntoViewIfNeeded()
      await expect(
        page.frameLocator('.component-preview iframe').locator('[data-testid="component-preview"]'),
      ).toBeVisible()
    }
  })
