import { expect, test } from '@playwright/test'

test('focuses direct routes and the destination after navigation', async ({ page }) => {
  await page.goto('/playground/#/checks/screen/next')
  await expect(page.getByRole('main')).toBeFocused()
  await page.getByRole('button', { name: 'Voltar à edição' }).click()
  await expect(page).toHaveURL(/#\/checks\/screen$/)
  await expect(page.getByRole('main')).toBeFocused()
  await page.getByRole('button', { name: 'Próxima tela' }).click()
  await expect(page.getByRole('main')).toBeFocused()
  await page.goBack()
  await expect(page).toHaveURL(/#\/checks\/screen$/)
  await expect(page.getByRole('main')).toBeFocused()
})

test('keeps an editable field visible when the viewport contracts', async ({
  page,
  browserName,
}, info) => {
  await page.goto('/playground/#/checks/screen')
  await page.getByRole('button', { name: 'Editar nome' }).click()
  const input = page.getByRole('textbox', { name: 'Nome da sessão' })
  await expect(input).toBeFocused()
  await input.fill('Minha sessão')
  for (const [width, height] of [
    [390, 420],
    [844, 390],
    [390, 844],
  ]) {
    await page.setViewportSize({ width: width!, height: height! })
    await expect
      .poll(async () => {
        const bounds = await input.boundingBox()
        return bounds && bounds.y >= 0 && bounds.y + bounds.height <= height! + 1
      })
      .toBe(true)
    await expect(input).toBeFocused()
    await page.screenshot({ path: info.outputPath(`screen-input-${width}-${height}.png`) })
  }
  if (browserName === 'chromium') {
    const client = await page.context().newCDPSession(page)
    const height = (await page.getByRole('main').boundingBox())!.height
    await client.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 })
    await expect.poll(() => page.evaluate(() => visualViewport!.scale)).toBe(2)
    expect((await page.getByRole('main').boundingBox())!.height).toBe(height)
    await client.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 })
    await expect.poll(() => page.evaluate(() => visualViewport!.scale)).toBe(1)
    await client.detach()
  }
  await page.getByRole('button', { name: 'Salvar nome' }).click()
  await expect(page.getByText('Nome salvo: Minha sessão')).toBeVisible()
  await expect(input).not.toBeFocused()
  await expect(page.locator('#screen-end')).toBeVisible()
})

test('releases viewport listeners when leaving a screen', async ({ page }) => {
  await page.goto('/playground/#/checks/screen')
  const previous = await page.getByRole('main').elementHandle()
  await expect
    .poll(() => previous!.evaluate((el) => el.style.getPropertyValue('--m-viewport-height')))
    .toBe('844px')
  await page.getByRole('button', { name: 'Próxima tela' }).click()
  await expect(page.locator('#screen-next')).toBeVisible()
  await page.setViewportSize({ width: 390, height: 420 })
  await expect(page.getByRole('main')).toHaveCSS('min-height', '420px')
  expect(await previous!.evaluate((el) => el.isConnected)).toBe(false)
  expect(await previous!.evaluate((el) => el.style.getPropertyValue('--m-viewport-height'))).toBe(
    '844px',
  )
  await previous!.dispose()
})
