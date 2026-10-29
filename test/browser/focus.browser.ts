import { expect, test } from '@playwright/test'

test('composes all nine components with controlled state and shared action semantics', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/playground/#/showcase')
  await page.getByRole('button', { name: 'Explorar foco ↗' }).click()
  await expect(page.getByRole('heading', { name: 'Seu momento.' })).toBeVisible()
  const rain = page.getByRole('button', { name: 'Selecionar Chuva' })
  await rain.click({ position: { x: 16, y: 16 } })
  await expect(rain.getByText('Selecionado', { exact: true })).toBeVisible()
  const duration = page.getByRole('slider', { name: 'Duração da sessão' })
  await duration.focus()
  await duration.press('ArrowRight')
  await expect(duration).toHaveAttribute('aria-valuenow', '45')
  await page.getByRole('button', { name: 'Ver detalhes', exact: true }).click()
  await expect(page.getByText('45 minutos · Chuva', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Trocar tema' }).click()
  await expect(duration).toHaveAttribute('aria-valuenow', '45')
  await expect(rain.getByText('Selecionado', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Preparar sessão', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Preparando…' })).toBeDisabled()
  await expect(duration).toBeDisabled()
  await expect(rain).toHaveAttribute('aria-disabled', 'true')
  await expect(page.getByText('Sessão pronta: 45 minutos · Chuva.', { exact: true })).toBeVisible()
  await expect(duration).toBeEnabled()
  await page.getByRole('button', { name: 'Ocultar detalhes', exact: true }).click()
  await expect(page.getByText('45 minutos · Chuva', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Ver detalhes', exact: true }).click()
  await expect(page.getByText('45 minutos · Chuva', { exact: true })).toBeVisible()
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    const main = page.getByRole('main')
    expect(await main.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
    await main.evaluate((el) => {
      el.scrollTop = 0
    })
    await page.screenshot({ path: info.outputPath(`focus-dark-${width}.png`) })
  }
  await page.getByRole('button', { name: 'Trocar tema' }).click()
  await page.setViewportSize({ width: 390, height: 1000 })
  await page.getByRole('main').evaluate((el) => {
    el.scrollTop = 0
  })
  await page.screenshot({ path: info.outputPath('focus-light.png') })
  await page.getByRole('button', { name: '← Showcase', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Showcase', exact: true })).toBeVisible()
  expect(errors).toEqual([])
})
