import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 390, height: 480 }, video: 'on' })

for (const language of ['en', 'pt'] as const) {
  test(`loading resources, retained reveal and Sheet scrolling in ${language}`, async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`/playground/#/showcase/lustre?lang=${language}`)
    const busy = page.locator('#lustre-busy')
    await expect(busy).toHaveAccessibleName(
      language === 'en' ? 'Preparing your edition…' : 'Preparando sua edição…',
    )
    await expect(busy).toBeDisabled()
    for (const style of ['bars', 'ring', 'dots']) {
      await page.locator(`#lustre-loader-${style}`).click()
      await expect(busy).toHaveAttribute('aria-busy', 'true')
    }
    await page.locator('#lustre-loading-toggle').click()
    await expect(busy).toBeEnabled()
    const toggle = page.locator('#lustre-circle-toggle'),
      panel = page.locator('#lustre-circle')
    await toggle.click()
    await expect(panel).toHaveCSS('visibility', 'hidden')
    await toggle.click()
    await expect(panel).toBeVisible()
    await expect(panel).not.toHaveAttribute('inert', '')
    await page.goto(`/playground/#/preview/sheet?lang=${language}`)
    await page
      .getByRole('button', {
        name: language === 'en' ? 'Full screen' : 'Tela inteira',
        exact: true,
      })
      .click()
    const sheet = page.getByRole('dialog')
    const body = sheet.locator('.m-sheet-body')
    const panelY = () =>
      sheet
        .locator('.m-sheet-panel')
        .evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42)
    await expect.poll(panelY).toBe(0)
    // Begin in scrolled content. One pointer crosses the top edge, moves the
    // sheet, then reverses far enough to return the remaining delta to content.
    const start = await body.evaluate((el) => {
      el.scrollTop = 50
      const rect = el.getBoundingClientRect()
      return { x: rect.left + 12, y: rect.top + 95, scroll: el.scrollTop }
    })
    expect(start.scroll).toBeGreaterThan(0)
    await page.mouse.move(start.x, start.y)
    await page.mouse.down()
    await page.mouse.move(start.x, start.y + 120, { steps: 16 })
    await expect.poll(() => body.evaluate((el) => el.scrollTop)).toBe(0)
    await expect.poll(panelY).toBeGreaterThan(20)
    await page.mouse.move(start.x, start.y - 35, { steps: 20 })
    await expect.poll(panelY).toBe(0)
    await expect.poll(() => body.evaluate((el) => el.scrollTop)).toBeGreaterThan(10)
    await page.mouse.up()
    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()
    expect(errors).toEqual([])
  })
}
