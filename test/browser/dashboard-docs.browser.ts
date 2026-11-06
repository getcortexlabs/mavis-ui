import { expect, test } from '@playwright/test'
const origin = process.env.MAVIS_DOCS_ORIGIN ?? 'http://127.0.0.1:4173'
for (const pt of [false, true])
  test(`dashboard documentation marks the released components and opens live previews: ${pt}`, async ({
    page,
  }) => {
    for (const id of [
      'kanban',
      'donut-chart',
      'sparkline',
      'gradient-background',
      'particle-field',
      'confetti',
    ]) {
      await page.goto(`${origin}${pt ? '/pt-BR' : ''}/components/${id}`)
      await expect(page.locator('.doc-masthead .catalog-status.new')).toHaveText(
        pt ? 'Novo' : 'New',
      )
      await expect(page.locator('.vp-doc')).toContainText(
        pt ? 'Incluído na RC.12' : 'Included in RC.12',
      )
      const frame = page.locator('.component-preview iframe')
      await frame.scrollIntoViewIfNeeded()
      await expect(frame.contentFrame().locator('[data-testid="component-preview"]')).toBeVisible()
    }
  })
