import { expect, test } from '@playwright/test'

test('starts empty, selects once from label, navigates enabled choices and clears externally', async ({
  page,
  browserName,
}) => {
  await page.goto('/playground/#/components/radio')
  const group = page.getByRole('radiogroup', { name: 'Ritmo de leitura', exact: true })
  const slow = group.getByRole('radio', { name: 'Sem pressa' })
  const daily = group.getByRole('radio', { name: 'Um pouco por dia' })
  await expect(group.locator('input:checked')).toHaveCount(0)
  await slow.locator('..').click({ position: { x: 90, y: 20 } })
  await expect(slow).toBeChecked()
  await slow.click()
  await expect(page.getByText('1 alteração', { exact: true })).toBeVisible()
  await slow.press('ArrowDown')
  await expect(daily).toBeChecked()
  await expect(daily).toBeFocused()
  await daily.press('ArrowRight')
  await expect(slow).toBeChecked()
  await expect(slow).toBeFocused()
  await slow.press('End')
  await expect(daily).toBeChecked()
  await daily.press('Home')
  await expect(slow).toBeChecked()
  const tab = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab'
  await slow.press(tab)
  await expect(page.getByRole('button', { name: 'Limpar escolha' })).toBeFocused()
  await page.getByRole('button', { name: 'Limpar escolha' }).click()
  await expect(group.locator('input:checked')).toHaveCount(0)
  await expect(page.getByText('5 alterações', { exact: true })).toBeVisible()
  await slow.focus()
  await slow.press('Space')
  await expect(slow).toBeChecked()
  await expect(slow.locator('..')).toHaveCSS('outline-style', 'solid')
  await expect(group.getByRole('radio', { name: 'Em tempo real' })).toBeDisabled()
  const locked = page.getByRole('radiogroup', { name: 'Preferência da equipe' })
  await expect(locked.getByRole('radio').first()).toBeDisabled()
  await expect(locked.getByRole('radio').first()).toBeChecked()
})

test('preserves typed values across removal, disabling and reordering without automatic changes', async ({
  page,
}) => {
  await page.goto('/playground/#/checks/radio')
  const group = page.getByRole('radiogroup', { name: 'Accepted choices' })
  const alpha = group.getByRole('radio', { name: 'Alpha' })
  await page.getByRole('button', { name: 'Toggle Alpha disabled' }).click()
  await expect(alpha).toBeChecked()
  await expect(alpha).toBeDisabled()
  await expect(group.getByRole('radio', { name: 'Numeric one' })).toHaveAttribute('tabindex', '0')
  await page.getByRole('button', { name: 'Toggle Alpha presence' }).click()
  await expect(group.locator('input:checked')).toHaveCount(0)
  await expect(page.getByText('Value: string:a; changes: 0', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Toggle Alpha presence' }).click()
  await expect(alpha).toBeChecked()
  await group.getByRole('radio', { name: 'Numeric one' }).click()
  await expect(page.getByText('Value: number:1; changes: 1', { exact: true })).toBeVisible()
  await group.getByRole('radio', { name: 'String one' }).click()
  await page.getByRole('button', { name: 'Reverse options' }).click()
  await expect(group.getByRole('radio', { name: 'String one' })).toBeChecked()
  await expect(page.getByText('Value: string:1; changes: 2', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Set absent value' }).click()
  await expect(group.locator('input:checked')).toHaveCount(0)
  await expect(page.getByText('Value: string:missing; changes: 2', { exact: true })).toBeVisible()
})

test('restores the whole browser group when the parent rejects a click or arrow', async ({
  page,
}) => {
  await page.goto('/playground/#/checks/radio')
  const group = page.getByRole('radiogroup', { name: 'Rejected choices' })
  const a = group.getByRole('radio', { name: 'Keep A' })
  const b = group.getByRole('radio', { name: 'Request B' })
  await b.click()
  await expect(a).toBeChecked()
  await expect(b).not.toBeChecked()
  await a.focus()
  await a.press('ArrowRight')
  await expect(b).toBeFocused()
  await expect(a).toBeChecked()
  await expect(b).not.toBeChecked()
  await expect(page.getByText('Requests: 2', { exact: true })).toBeVisible()
})

test('fits narrow screens and large text in both themes with reduced motion', async ({
  page,
}, info) => {
  await page.goto('/playground/#/components/radio')
  for (const theme of ['mavis', 'midnight']) {
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      expect(await page.getByRole('main').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
        true,
      )
      await page.screenshot({ path: info.outputPath(`radio-${theme}-${width}.png`) })
    }
    if (theme === 'mavis') await page.getByRole('button', { name: 'Trocar tema' }).click()
  }
  await page.setViewportSize({ width: 320, height: 1000 })
  await page
    .locator('.m-radio-option')
    .evaluateAll((rows) => rows.forEach((row) => ((row as HTMLElement).style.fontSize = '32px')))
  expect(await page.getByRole('main').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.m-radio-indicator').first()).toHaveCSS('transition-duration', '0s')
})

test('scrolls from a touch on the radio without selecting', async ({ browser, browserName }) => {
  test.skip(browserName !== 'chromium', 'CDP supplies the real touch sequence for this check')
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  })
  try {
    const page = await context.newPage()
    await page.goto(`${test.info().project.use.baseURL}/playground/#/components/radio`)
    const control = page
      .getByRole('radiogroup', { name: 'Ritmo de leitura' })
      .getByRole('radio', { name: 'Sem pressa' })
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
    await expect(control).not.toBeChecked()
    await expect(page.getByText('0 alterações', { exact: true })).toBeVisible()
    expect(await page.getByRole('main').evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
  } finally {
    await context.close()
  }
})
