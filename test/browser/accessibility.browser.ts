import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const theme of ['mavis', 'midnight']) {
  test(`${theme} component demos pass the automated accessibility audit`, async ({ page }) => {
    test.setTimeout(60_000)
    for (const component of [
      'button',
      'input',
      'slider',
      'card',
      'text',
      'icon',
      'row',
      'column',
      'box',
      'screen',
      'reveal',
    ]) {
      await page.goto(`/playground/#/preview/${component}?theme=${theme}`)
      await expect(page.locator('.m-screen, [data-testid="component-preview"]')).toBeVisible()
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
      expect(violations, component).toEqual([])
    }
    await page.goto('/playground/#/checks/accessibility')
    await expect(page.locator('#theme')).toHaveAccessibleName(
      theme === 'midnight' ? 'Usar tema claro' : 'Usar tema escuro',
    )
    await page.getByRole('button', { name: 'Ver detalhes', exact: true }).click()
    await expect(page.locator('.m-reveal-enter-active')).toHaveCount(0)
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(violations).toEqual([])
  })
}

test('retains keyboard focus through loading and restores it when closing Reveal', async ({
  page,
}) => {
  await page.goto('/playground/#/checks/accessibility')
  const trigger = page.locator('#details')
  await trigger.focus()
  await trigger.press('Enter')
  const close = page.getByRole('button', { name: 'Fechar detalhes' })
  await close.focus()
  await close.press('Enter')
  await expect(trigger).toBeFocused()
  await expect(close).toHaveCount(0)

  const action = page.locator('#prepare')
  await action.focus()
  await action.press('Enter')
  await expect(action).toHaveAccessibleName('Preparando…')
  await expect(action).toHaveAttribute('aria-busy', 'true')
  await expect(action).toHaveAttribute('aria-disabled', 'true')
  await expect(action).toBeFocused()
  await action.press('Enter')
  await expect(page.getByText('Sessão pronta.', { exact: true })).toBeVisible()
  await expect(action).toBeFocused()
  await expect(action).toBeEnabled()
})

test('allows keyboard scrolling in a Screen without interactive children', async ({
  page,
  browserName,
}) => {
  await page.goto('/playground/#/preview/screen')
  const screen = page.getByRole('main')
  await expect(screen).toBeVisible()
  await page.evaluate(() => {
    document.body.tabIndex = -1
    document.body.focus()
  })
  await page.keyboard.press(
    browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab',
  )
  await expect(screen).toBeFocused()
  await expect(screen).toHaveCSS('outline-style', 'solid')
  await screen.press('PageDown')
  await expect.poll(() => screen.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
})

test('respects reduced motion for press feedback', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/playground/#/checks/accessibility')
  for (const id of ['theme', 'action-card']) {
    const control = page.locator(`#${id}`)
    await control.scrollIntoViewIfNeeded()
    await control.hover()
    await page.mouse.down()
    await expect(control).toHaveCSS('scale', 'none')
    await page.mouse.up()
  }
})
