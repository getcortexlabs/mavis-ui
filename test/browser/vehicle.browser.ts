import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/playground/#/showcase/vehicle')
  await expect(page.getByRole('heading', { name: 'O dia é seu.' })).toBeVisible()
})

test('keeps theme changes reactive and both themes usable at narrow and wide widths', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const main = page.getByRole('main')
  await expect(main).toHaveCSS('background-color', 'rgb(250, 247, 250)')
  await page.screenshot({ path: info.outputPath('vehicle-light.png'), fullPage: true })
  await page.getByRole('button', { name: 'Trocar tema' }).click()
  await expect(main).toHaveCSS('background-color', 'rgb(21, 18, 28)')
  await page.screenshot({ path: info.outputPath('vehicle-dark.png'), fullPage: true })
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(await main.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
    await expect(page.getByRole('button', { name: 'Desligar clima' })).toBeVisible()
  }
  expect(errors).toEqual([])
})

test('supports fractional slider input, keyboard navigation and disabled controls', async ({
  page,
  browserName,
}) => {
  const slider = page.getByRole('slider', { name: 'Temperatura da cabine' })
  await slider.focus()
  await slider.press('ArrowRight')
  await expect(slider).toHaveAttribute('aria-valuenow', '21.5')
  await expect(page.getByText('21.5°', { exact: true })).toBeVisible()
  await slider.press('End')
  await expect(slider).toHaveAttribute('aria-valuenow', '28')
  await slider.press('Home')
  await expect(slider).toHaveAttribute('aria-valuenow', '16')
  // macOS WebKit uses Option-Tab to traverse all controls with default keyboard settings.
  await slider.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
  const climate = page.getByRole('button', { name: 'Desligar clima' })
  await expect(climate).toBeFocused()
  await expect(climate).toHaveCSS('outline-style', 'solid')
  await climate.press('Enter')
  await expect(slider).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Ligar clima' })).toBeFocused()
  await page.getByRole('button', { name: 'Ligar clima' }).press('Space')
  await expect(slider).toBeEnabled()
})

test('shares state across routes and exposes loading and disabled states', async ({ page }) => {
  await page.getByRole('button', { name: 'Destrancar', exact: true }).click()
  await page.getByRole('button', { name: 'Meu veículo ↗' }).click()
  await expect(page).toHaveURL(/#\/showcase\/vehicle\/details$/)
  await expect(page.getByRole('heading', { name: 'Seu próximo caminho.' })).toBeVisible()
  await expect(page.getByRole('main')).toBeFocused()
  await expect(page.getByRole('button', { name: 'Atualização indisponível' })).toBeDisabled()
  await page.getByRole('button', { name: 'Sincronizar', exact: true }).click()
  const loading = page.getByRole('button', { name: 'Sincronizando…' })
  await expect(loading).toBeDisabled()
  await expect(loading).toHaveAttribute('aria-busy', 'true')
  await expect(page.getByRole('button', { name: 'Sincronizado', exact: true })).toBeEnabled()
  await page.goBack()
  await expect(page.getByRole('button', { name: 'Trancar', exact: true })).toBeVisible()
  await expect(page.getByText('Veículo destrancado · Demonstração')).toBeVisible()
})

test('handles repeated reveal toggles and updates reduced motion while mounted', async ({
  page,
}) => {
  const toggle = page.getByRole('button', { name: 'Preferências de carregamento' })
  const charge = page.getByRole('slider', { name: 'Limite de carregamento' })
  await toggle.click()
  await expect(charge).toBeVisible()
  await charge.focus()
  await charge.press('ArrowRight')
  await expect(charge).toHaveAttribute('aria-valuenow', '85')
  await toggle.click()
  await expect(charge).toHaveCount(0)
  await toggle.click()
  await expect(charge).toHaveAttribute('aria-valuenow', '85')
  await toggle.click()
  await toggle.click({ force: true })
  await expect(charge).toBeVisible()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(toggle).toHaveCSS('transition-duration', '0s')
  await toggle.click()
  await expect(charge).toHaveCount(0)
  await toggle.click()
  await expect(charge).toBeVisible()
  const reveal = charge.locator('xpath=../..')
  await expect(reveal).toHaveCSS('opacity', '1')
  await expect(reveal).toHaveCSS('translate', 'none')
})

test('releases press feedback and honors reduced motion', async ({ page }) => {
  const button = page.getByRole('button', { name: 'Trocar tema' })
  const bounds = (await button.boundingBox())!
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
  await page.mouse.down()
  await expect
    .poll(() => button.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).a))
    .toBeCloseTo(0.97, 3)
  await page.mouse.up()
  await expect
    .poll(() => button.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).a))
    .toBeCloseTo(1, 3)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.mouse.down()
  await expect
    .poll(() => button.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).a))
    .toBeCloseTo(0.97, 3)
  await page.mouse.up()
})

test('loads the details route directly and returns to the vehicle', async ({ page }) => {
  await page.goto('/playground/#/showcase/vehicle/details')
  await expect(page.getByRole('heading', { name: 'Seu próximo caminho.' })).toBeVisible()
  await page.getByRole('button', { name: '← Veículo' }).click()
  await expect(page.getByRole('heading', { name: 'O dia é seu.' })).toBeVisible()
})
