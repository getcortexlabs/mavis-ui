import { expect, test } from '@playwright/test'

test('changes once from label, thumb and keyboard, and accepts external reset', async ({
  page,
  browserName,
}) => {
  const tab = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab'
  await page.goto('/playground/#/components/switch')
  const notifications = page.getByRole('switch', { name: 'Notificações', exact: true })
  const digest = page.getByRole('switch', { name: 'Resumo semanal por e-mail' })
  await expect(notifications).toBeChecked()
  await expect(digest).not.toBeChecked()
  await notifications.getByText('Notificações', { exact: true }).click()
  await expect(notifications).not.toBeChecked()
  await expect(page.getByText('1 alteração', { exact: true })).toBeVisible()
  await notifications.locator('.m-switch-track').click()
  await expect(notifications).toBeChecked()
  await notifications.press('Space')
  await expect(notifications).not.toBeChecked()
  await notifications.press('Enter')
  await expect(notifications).toBeChecked()
  await notifications.press(tab)
  await expect(digest).toBeFocused()
  await expect(digest).toHaveCSS('outline-style', 'solid')
  await digest.press('Space')
  await expect(digest).toBeChecked()
  await expect(page.getByText('5 alterações', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Restaurar', exact: true }).click()
  await expect(digest).not.toBeChecked()
  await expect(notifications).toBeChecked()
  await expect(page.getByText('5 alterações', { exact: true })).toBeVisible()
  await expect(page.getByRole('switch', { name: 'Alertas de segurança' })).toBeDisabled()
  await expect(page.getByRole('switch', { name: 'Acesso antecipado' })).toBeDisabled()
  await digest.focus()
  await page.keyboard.press(tab)
  await expect(page.getByRole('button', { name: 'Restaurar', exact: true })).toBeFocused()
})

test('wraps labels, keeps value through theme changes and disables CSS motion', async ({
  page,
}, info) => {
  await page.goto('/playground/#/components/switch')
  const notifications = page.getByRole('switch', { name: 'Notificações', exact: true })
  await notifications.click()
  for (const theme of ['mavis', 'midnight']) {
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      expect(await page.getByRole('main').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
        true,
      )
      await expect(notifications).not.toBeChecked()
      await page.screenshot({ path: info.outputPath(`switch-${theme}-${width}.png`) })
    }
    if (theme === 'mavis') await page.getByRole('button', { name: 'Trocar tema' }).click()
  }
  await page.setViewportSize({ width: 320, height: 1000 })
  await page.locator('.m-switch').evaluateAll((switches) => {
    for (const el of switches) (el as HTMLElement).style.fontSize = '32px'
  })
  expect(await page.getByRole('main').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
  const label = notifications.locator('span').first()
  const track = notifications.locator('.m-switch-track')
  const labelBounds = await label.boundingBox()
  const trackBounds = await track.boundingBox()
  expect(labelBounds!.x + labelBounds!.width).toBeLessThan(trackBounds!.x)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(notifications.locator('.m-switch-thumb')).toHaveCSS('transition-duration', '0s')
  await notifications.click()
  await expect(notifications).toBeChecked()
})

test('saves and discards preferences with the profile', async ({ page, browserName }) => {
  const tab = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab'
  await page.goto('/playground/#/showcase/profile')
  const notifications = page.getByRole('switch', { name: 'Notificações', exact: true })
  await notifications.click()
  await page.getByRole('button', { name: 'Descartar alterações' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Descartar', exact: true }).click()
  await expect(notifications).toBeChecked()
  await notifications.click()
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(page.locator('.m-toast-message')).toHaveText('Perfil salvo nesta demonstração.')
  await notifications.click()
  await page.getByRole('button', { name: 'Descartar alterações' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Descartar', exact: true }).click()
  await expect(notifications).not.toBeChecked()
})

test('scrolls from a touch on the switch without toggling', async ({ browser, browserName }) => {
  test.skip(browserName !== 'chromium', 'CDP supplies the real touch sequence for this check')
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  })
  try {
    const page = await context.newPage()
    await page.goto(`${test.info().project.use.baseURL}/playground/#/components/switch`)
    const control = page.getByRole('switch', { name: 'Notificações', exact: true })
    const rect = await control.boundingBox()
    const session = await context.newCDPSession(page)
    const x = rect!.x + rect!.width - 24
    const y = rect!.y + rect!.height / 2
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    for (const delta of [20, 40, 70, 100]) {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x, y: y - delta }],
      })
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await expect(control).toBeChecked()
    await expect(page.getByText('0 alterações', { exact: true })).toBeVisible()
    expect(await page.getByRole('main').evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
  } finally {
    await context.close()
  }
})
