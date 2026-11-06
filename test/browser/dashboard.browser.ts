import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
const ids = [
  'kanban',
  'donut-chart',
  'sparkline',
  'gradient-background',
  'particle-field',
  'confetti',
]
const preview = (id: string) => `/playground/#/preview/${id}?lang=en`

test('board transfers preserve hidden cards, capacity and focus', async ({ page }) => {
  await page.goto(preview('kanban'))
  await page.getByRole('textbox', { name: 'Filter projects' }).fill('Botanical')
  await page
    .locator('[data-kanban-card="identity"]')
    .getByRole('button', { name: 'Move card', exact: true })
    .click()
  await page.getByRole('menuitem', { name: 'Making', exact: true }).click()
  await expect(page.locator('#kanban-result')).toHaveText('identity:making')
  await expect(page.locator('#kanban-order')).toContainText('web:making')
  await expect(page.locator('[data-kanban-handle="identity"]')).toBeFocused()
  await page.getByRole('textbox', { name: 'Filter projects' }).fill('Field')
  await page
    .locator('[data-kanban-card="editorial"]')
    .getByRole('button', { name: 'Move card', exact: true })
    .click()
  await expect(page.getByRole('menuitem', { name: 'Making', exact: true })).toBeDisabled()
  await page.keyboard.press('Escape')
  await page.getByRole('textbox', { name: 'Filter projects' }).fill('')
  await expect(page.locator('[data-kanban-card]')).toHaveCount(4)
})
test('board drag tracks continuously, commits across columns and cancels with Escape', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.goto(preview('kanban'))
  const handle = page.locator('[data-kanban-handle="identity"]')
  await handle.scrollIntoViewIfNeeded()
  await page.evaluate(() => document.fonts.ready)
  const start = (await handle.boundingBox())!,
    target = (await page.locator('[data-kanban-column="done"]').boundingBox())!
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2)
  await page.mouse.down()
  await page.mouse.move(start.x + start.width / 2 + 70, start.y + start.height / 2 + 20, {
    steps: 8,
  })
  await expect
    .poll(() =>
      page
        .locator('[data-kanban-card="identity"] > .m-box')
        .evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41),
    )
    .toBeGreaterThan(40)
  await page.keyboard.press('Escape')
  await page.mouse.up()
  await expect(page.locator('#kanban-order')).toContainText('identity:ideas')
  const reset = (await handle.boundingBox())!
  await page.mouse.move(reset.x + reset.width / 2, reset.y + reset.height / 2)
  await page.mouse.down()
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 16 })
  await page.mouse.up()
  await expect(page.locator('#kanban-result')).toHaveText('identity:done')
})
test('board keyboard reorder and disabled state follow the same contract', async ({ page }) => {
  await page.goto(preview('kanban'))
  const handle = page.locator('[data-kanban-handle="editorial"]')
  await handle.focus()
  await handle.press('ArrowUp')
  await expect(
    page.locator('[data-kanban-column="ideas"] [data-kanban-card]').first(),
  ).toHaveAttribute('data-kanban-card', 'editorial')
  await handle.press('ArrowRight')
  await expect(page.locator('#kanban-result')).toHaveText('editorial:making')
  await page.getByRole('switch', { name: 'Lock board' }).click()
  await expect(page.locator('[data-kanban-handle="editorial"]')).toBeDisabled()
})
test('donut selection and data changes keep canonical values, including zero', async ({ page }) => {
  await page.goto(preview('donut-chart'))
  await page.getByRole('button', { name: 'Design · 54 · 54%', exact: true }).click()
  await expect(page.locator('#donut-selection')).toHaveText('design')
  await expect(page.locator('#studio-donut .m-box[style*="opacity: 0.35"]').first()).toHaveCSS(
    'opacity',
    '0.35',
  )
  await page.getByRole('button', { name: 'Another week', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Design · 36 · 36%', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(() => page.locator('#studio-donut svg').count()).toBeGreaterThan(4)
  await page.getByRole('switch', { name: 'Empty week' }).click()
  await expect(page.getByText('A fresh start', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Design · 0 · 0%', exact: true })).toBeVisible()
})
test('sparkline disclosure retains gaps and updates accessible values', async ({ page }) => {
  await page.goto(preview('sparkline'))
  const chart = page.locator('#studio-sparkline')
  await chart.getByRole('button', { name: 'View data' }).click()
  await expect(chart.getByText('Day 4: 19', { exact: true })).toBeVisible()
  await page.getByRole('switch', { name: 'Missing reading' }).click()
  await expect(chart.getByText('Day 4: —', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'New readings' }).click()
  await expect(chart.getByText('Day 7: 72', { exact: true })).toBeVisible()
  const plot = chart.locator('[data-sparkline-plot]')
  await expect(plot).toHaveCSS('height', '64px')
  const bounds = await plot.boundingBox()
  for (const svg of await plot.locator('[data-jolt-effect="shape"] svg').all()) {
    const painted = await svg.boundingBox()
    expect(painted!.height).toBeLessThanOrEqual(bounds!.height + 1)
    expect(painted!.y + painted!.height).toBeLessThanOrEqual(bounds!.y + bounds!.height + 1)
  }
})
test('gradient palettes and motion controls preserve an editor', async ({ page }) => {
  await page.goto(preview('gradient-background'))
  const editor = page.getByRole('textbox', { name: 'A thought to keep' })
  await editor.fill('Keep the draft')
  await page.getByRole('button', { name: 'Change atmosphere' }).click()
  await page.getByRole('switch', { name: 'Continuous motion' }).click()
  await page.getByRole('switch', { name: 'Continuous motion' }).click()
  await expect(editor).toHaveValue('Keep the draft')
  await expect(page.locator('#studio-gradient')).toHaveCSS('background-image', /38, 56, 72/)
})
test('particle emission is opt-in, bounded and released on pause', async ({ page }) => {
  await page.goto(preview('particle-field'))
  const field = page.locator('#studio-particles')
  await expect(field.locator('canvas')).toHaveCount(0)
  await page.getByRole('switch', { name: 'Play particles' }).click()
  await expect(field.locator('canvas')).toHaveCount(1)
  await page.getByRole('switch', { name: 'Play particles' }).click()
  await expect(field.locator('canvas')).toHaveCount(0)
})
test('confetti is explicit, repeatable and removed when disabled', async ({ page }) => {
  await page.goto(preview('confetti'))
  const root = page.locator('[data-jolt-effect="confetti"]')
  await expect(root.locator('canvas')).toHaveCount(0)
  await page.getByRole('button', { name: 'Publish the project' }).click()
  await expect(root.locator('canvas')).toHaveCount(1)
  await expect(page.locator('#confetti-status')).toHaveText('Published. You made it.')
  await page.getByRole('button', { name: 'Publish the project' }).click()
  await expect(root.locator('canvas')).toHaveCount(1)
  await page.getByRole('switch', { name: 'Disable celebration' }).click()
  await expect(root.locator('canvas')).toHaveCount(0)
})
test('reduced motion suppresses decorative emitters without suppressing success', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(preview('confetti'))
  await page.getByRole('button', { name: 'Publish the project' }).click()
  await expect(page.locator('#confetti-status')).toHaveText('Published. You made it.')
  await expect(page.locator('[data-jolt-effect="confetti"] canvas')).toHaveCount(0)
  await page.goto(preview('particle-field'))
  await page.getByRole('switch', { name: 'Play particles' }).click()
  await expect(page.locator('#studio-particles canvas')).toHaveCount(0)
})
for (const id of ids)
  test(`${id} is responsive and exposes accessible controls`, async ({ page }, info) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(preview(id))
    const target = {
      kanban: 'studio-kanban',
      'donut-chart': 'studio-donut',
      sparkline: 'studio-sparkline',
      'gradient-background': 'studio-gradient',
      'particle-field': 'studio-particles',
      confetti: 'studio-confetti',
    }[id]!
    await expect(page.locator('#' + target)).toBeVisible()
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1100 })
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        .toBe(true)
      if (id === 'gradient-background' || id === 'particle-field') {
        const surface = page.locator('#' + target)
        const bounds = (await surface.boundingBox())!
        for (const text of await surface.locator('.m-text').all()) {
          const content = (await text.boundingBox())!
          expect(content.y).toBeGreaterThanOrEqual(bounds.y)
          expect(content.y + content.height).toBeLessThanOrEqual(bounds.y + bounds.height + 1)
        }
      }
    }
    const audit = await new AxeBuilder({ page })
      .include('[data-testid="component-preview"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(audit.violations).toEqual([])
    await page.screenshot({ path: info.outputPath(`${id}-desktop.png`), fullPage: true })
    await page.setViewportSize({ width: 390, height: 1000 })
    await page.screenshot({ path: info.outputPath(`${id}-mobile.png`), fullPage: true })
    expect(errors).toEqual([])
  })
