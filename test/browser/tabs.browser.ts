import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/playground/#/checks/tabs')
})

test('uses manual keyboard activation, wraps focus and skips disabled tabs', async ({ page }) => {
  const tabs = page.getByRole('tablist', { name: 'Content sections' })
  const number = tabs.getByRole('tab', { name: 'Number zero' })
  const string = tabs.getByRole('tab', { name: 'String zero' })
  const last = tabs.getByRole('tab', { name: 'Last tab' })
  await number.focus()
  await page.keyboard.press('ArrowRight')
  await expect(string).toBeFocused()
  await expect(number).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText('Changes: 0', { exact: true })).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(string).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tabpanel')).toContainText('Panel: string 0')
  await page.keyboard.press('ArrowRight')
  await expect(tabs.getByRole('tab', { name: /intentionally long/ })).toBeFocused()
  await page.keyboard.press('End')
  await expect(last).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(number).toBeFocused()
  await page.keyboard.press('ArrowLeft')
  await expect(last).toBeFocused()
  await page.keyboard.press('Home')
  await expect(number).toBeFocused()
  await page.keyboard.press('Space')
  await expect(page.getByRole('tabpanel')).toContainText('Panel: number 0')
  await expect(page.getByRole('tabpanel')).toHaveAttribute(
    'aria-labelledby',
    (await number.getAttribute('id')) as string,
  )
  await expect(number).toHaveAttribute('aria-controls', 'checked-tabs-panel')
})

test('preserves parent decisions and external data while replacing panels', async ({ page }) => {
  const editor = page.getByRole('textbox', { name: 'Panel draft', exact: true })
  await editor.fill('My retained draft')
  await page.getByRole('tab', { name: 'String zero' }).click()
  await expect(editor).toHaveCount(0)
  await page.locator('#reset').click()
  await expect(editor).toHaveValue('My retained draft')
  await page.locator('#reject').click()
  await page.getByRole('tab', { name: 'String zero' }).click()
  await expect(page.getByRole('tab', { name: 'Number zero' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(editor).toHaveValue('My retained draft')
  await page.locator('#disable').click()
  await expect(page.getByRole('tab', { name: 'Number zero' })).toBeDisabled()
  await page.locator('#last').click()
  await expect(page.getByRole('tabpanel')).toContainText('Panel: string last')
  await page.locator('#remove').click()
  await expect(page.getByRole('tabpanel')).toHaveCount(0)
  await expect(page.getByText('Value: string last', { exact: true })).toBeVisible()
  await page.locator('#remove').click()
  await expect(page.getByRole('tabpanel')).toContainText('Panel: string last')
  await page.locator('#clear').click()
  await expect(page.getByRole('tabpanel')).toHaveCount(0)
  await page.locator('#empty').click()
  await expect(page.getByRole('tab')).toHaveCount(0)
})

test('reveals selection horizontally, follows resize, and releases the removed host', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.setViewportSize({ width: 320, height: 600 })
  await page.locator('#last').click()
  const scroller = page.locator('.m-tabs-scroll')
  await expect.poll(() => scroller.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0)
  await page.getByRole('tab', { name: 'Last tab' }).scrollIntoViewIfNeeded()
  await expect(page.getByRole('main')).toHaveJSProperty('scrollLeft', 0)
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 700 })
    await page.waitForTimeout(300)
    const bounds = await page.getByRole('tab', { name: 'Last tab' }).boundingBox()
    const marker = await page.locator('.m-tabs-indicator').boundingBox()
    expect(Math.abs(bounds!.x - marker!.x)).toBeLessThan(1)
    expect(Math.abs(bounds!.width - marker!.width)).toBeLessThan(1)
    expect(await page.getByRole('main').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    )
  }
  await page.screenshot({ path: info.outputPath('tabs-overflow.png') })
  await page.locator('#mount').click()
  await expect(scroller).toHaveCount(0)
  await page.setViewportSize({ width: 320, height: 700 })
  await page.locator('#mount').click()
  await expect(page.getByRole('tabpanel')).toContainText('Panel: string last')
  await page.getByRole('button', { name: 'Navigate away' }).click()
  await expect(page.getByRole('tablist')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('keeps the indicator aligned through theme, text-size and reduced-motion changes', async ({
  page,
}, info) => {
  await page.goto('/playground/#/components/tabs')
  for (const theme of ['mavis', 'midnight']) {
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await page.getByRole('tab', { name: 'Atividade', exact: true }).click()
      await expect(page.getByText('Aconteceu por aqui.', { exact: true })).toBeVisible()
      await page.waitForTimeout(280)
      await page.screenshot({ path: info.outputPath(`tabs-${theme}-${width}.png`) })
    }
    if (theme === 'mavis') await page.getByRole('button', { name: 'Trocar tema' }).click()
  }
  await page.setViewportSize({ width: 320, height: 700 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.locator('.m-tabs-track').evaluate((el: HTMLElement) => {
    el.style.fontSize = '32px'
  })
  await page.getByRole('tab', { name: 'Favoritos', exact: true }).click()
  await expect(page.locator('.m-tabs-indicator')).toHaveCSS('transition-duration', '0s')
  await expect(page.getByText('Para voltar depois.', { exact: true })).toBeVisible()
  expect(await page.getByRole('main').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
  await page.screenshot({ path: info.outputPath('tabs-large-320.png') })
})

test('reverses horizontal focus direction in an RTL tab strip', async ({ page }) => {
  await page.locator('.m-tabs-track').evaluate((el) => el.setAttribute('dir', 'rtl'))
  await page.getByRole('tab', { name: 'Number zero' }).focus()
  await page.keyboard.press('ArrowLeft')
  await expect(page.getByRole('tab', { name: 'String zero' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('tabpanel')).toContainText('Panel: string 0')
})

test('keeps Library bookmarks and filters outside the mounted panel', async ({ page }) => {
  await page.goto('/playground/#/showcase/library')
  await page.getByRole('button', { name: 'Salvar leitura', exact: true }).click()
  await page.getByRole('tab', { name: 'Salvos (2)', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Para ler com calma' })).toBeVisible()
  await expect(page.getByRole('checkbox')).toHaveCount(0)
  await page.getByRole('button', { name: 'Remover dos salvos' }).first().click()
  await expect(page.getByRole('tab', { name: 'Salvos (1)' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await page.getByRole('tab', { name: 'Explorar', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'Todos os assuntos' })).toHaveAttribute(
    'aria-checked',
    'mixed',
  )
})
