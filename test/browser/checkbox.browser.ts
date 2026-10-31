import { expect, test } from '@playwright/test'

test('selects all from mixed, toggles independent topics and resets without extra events', async ({
  page,
  browserName,
}) => {
  await page.goto('/playground/#/components/checkbox')
  const all = page.getByRole('checkbox', { name: 'Todos os assuntos' })
  const design = page.getByRole('checkbox', { name: 'Design de interfaces' })
  const development = page.getByRole('checkbox', { name: 'Desenvolvimento' })
  await expect(all).toHaveAttribute('aria-checked', 'mixed')
  expect(await all.evaluate((el: HTMLInputElement) => el.indeterminate)).toBe(true)
  await expect(design).toBeChecked()
  await all.click()
  await expect(all).toBeChecked()
  await expect(all).toHaveAttribute('aria-checked', 'true')
  await expect(development).toBeChecked()
  await expect(page.getByText('1 alteração', { exact: true })).toBeVisible()
  await all.press('Space')
  await expect(all).not.toBeChecked()
  await expect(design).not.toBeChecked()
  const tab = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab'
  await all.press(tab)
  await expect(design).toBeFocused()
  await expect(design.locator('..')).toHaveCSS('outline-style', 'solid')
  await design.press('Space')
  await expect(all).toHaveAttribute('aria-checked', 'mixed')
  await development.locator('..').click({ position: { x: 80, y: 15 } })
  await expect(development).toBeChecked()
  await expect(page.getByText('4 alterações', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Restaurar', exact: true }).click()
  await expect(development).not.toBeChecked()
  await expect(all).toHaveAttribute('aria-checked', 'mixed')
  await expect(page.getByText('4 alterações', { exact: true })).toBeVisible()
  for (const label of ['Conteúdo da equipe', 'Conteúdo arquivado', 'Coleção compartilhada'])
    await expect(page.getByRole('checkbox', { name: label })).toBeDisabled()
  await page.getByRole('checkbox', { name: 'Produto e pesquisa' }).focus()
  await page.keyboard.press(tab)
  await expect(page.getByRole('button', { name: 'Restaurar', exact: true })).toBeFocused()
})

test('restores rejected DOM values and resolves checked-plus-mixed to checked', async ({
  page,
}) => {
  await page.goto('/playground/#/checks/checkbox')
  const held = page.getByRole('checkbox', { name: 'Parent keeps its state' })
  const accepted = page.getByRole('checkbox', { name: 'Parent accepts changes' })
  await held.click()
  await expect(page.getByText('Requests: 1; clears: 1', { exact: true })).toBeVisible()
  expect(await held.evaluate((el: HTMLInputElement) => [el.checked, el.indeterminate])).toEqual([
    true,
    true,
  ])
  await accepted.click()
  expect(await accepted.evaluate((el: HTMLInputElement) => [el.checked, el.indeterminate])).toEqual(
    [true, false],
  )
  await page.getByRole('button', { name: 'Set unchecked', exact: true }).click()
  await expect(held).not.toBeChecked()
  await held.press('Space')
  await expect(held).not.toBeChecked()
  await expect(page.getByText('Requests: 2; clears: 1', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Set checked and mixed', exact: true }).click()
  expect(await held.evaluate((el: HTMLInputElement) => [el.checked, el.indeterminate])).toEqual([
    true,
    true,
  ])
})

test('keeps mixed state across themes, wraps long labels and respects reduced motion', async ({
  page,
}, info) => {
  await page.goto('/playground/#/components/checkbox')
  for (const theme of ['mavis', 'midnight']) {
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      expect(await page.getByRole('main').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
        true,
      )
      await expect(page.getByRole('checkbox', { name: 'Todos os assuntos' })).toHaveAttribute(
        'aria-checked',
        'mixed',
      )
      await page.screenshot({ path: info.outputPath(`checkbox-${theme}-${width}.png`) })
    }
    if (theme === 'mavis') await page.getByRole('button', { name: 'Trocar tema' }).click()
  }
  await page.setViewportSize({ width: 320, height: 1000 })
  await page.locator('.m-checkbox').evaluateAll((elements) => {
    for (const el of elements) (el as HTMLElement).style.fontSize = '32px'
  })
  expect(await page.getByRole('main').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.m-checkbox-box').first()).toHaveCSS('transition-duration', '0s')
})

test('filters Library cards and recovers from an empty selection', async ({ page }, info) => {
  await page.goto('/playground/#/showcase/library')
  const all = page.getByRole('checkbox', { name: 'Todos os assuntos' })
  await expect(
    page.getByRole('heading', { name: 'O espaço também fala.', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Antes da próxima tela.', exact: true }),
  ).toHaveCount(0)
  await all.click()
  await expect(
    page.getByRole('heading', { name: 'Antes da próxima tela.', exact: true }),
  ).toBeVisible()
  await all.click()
  await expect(page.getByText('Uma página em branco.', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Mostrar todos' }).click()
  await expect(all).toBeChecked()
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    expect(await page.getByRole('main').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    )
    await page.getByRole('main').evaluate((el) => {
      el.scrollTop = 0
    })
    await page.screenshot({ path: info.outputPath(`library-${width}.png`) })
  }
})

test('scrolls from a touch on the checkbox without selecting', async ({ browser, browserName }) => {
  test.skip(browserName !== 'chromium', 'CDP supplies the real touch sequence for this check')
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  })
  try {
    const page = await context.newPage()
    await page.goto(`${test.info().project.use.baseURL}/playground/#/components/checkbox`)
    const control = page.getByRole('checkbox', { name: 'Todos os assuntos', exact: true })
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
    await expect(control).toHaveAttribute('aria-checked', 'mixed')
    await expect(page.getByText('0 alterações', { exact: true })).toBeVisible()
    expect(await page.getByRole('main').evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
  } finally {
    await context.close()
  }
})
