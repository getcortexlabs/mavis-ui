import { expect, test } from '@playwright/test'

test('queues messages in order and gives each its own visible lifetime', async ({ page }) => {
  await page.goto('/playground/#/checks/toast')
  await page.locator('#queue').click()
  const toast = page.locator('.m-toast')
  await expect(toast).toHaveCount(1)
  await expect(toast.locator('.m-toast-message')).toHaveText('First')
  await expect(toast.locator('.m-toast-message')).toHaveText('Second', { timeout: 3500 })
  await expect(toast.locator('.m-toast-message')).toHaveText('Third', { timeout: 3500 })
  await expect(toast).toHaveCount(0, { timeout: 3500 })
  await page.locator('#persistent').click()
  await page.waitForTimeout(1800)
  await expect(toast).toBeVisible()
  await page.locator('#queue').click()
  await page.locator('#clear').click()
  await expect(toast).toHaveCount(0)
  await page.waitForTimeout(1500)
  await expect(toast).toHaveCount(0)
})

test('does not steal focus, allows background actions and restores focus after keyboard close', async ({
  page,
}) => {
  await page.goto('/playground/#/checks/toast')
  const editor = page.getByRole('textbox', { name: 'Editor', exact: true })
  await editor.fill('Still editing')
  await editor.press('Enter')
  await expect(page.locator('.m-toast')).toBeVisible()
  await expect(editor).toBeFocused()
  await expect(page.getByRole('status')).toContainText('The screen stays available.')
  const close = page.getByRole('button', { name: 'Dismiss notice', exact: true })
  await close.focus()
  await page.waitForTimeout(1800)
  await expect(page.locator('.m-toast')).toBeVisible()
  await close.press('Escape')
  await expect(page.locator('.m-toast')).toHaveCount(0)
  await expect(editor).toBeFocused()
  await expect(editor).toHaveValue('Still editing')
  await page.locator('#persistent').click()
  await page.locator('#background').click()
  await expect(page.getByText('Taps: 1', { exact: true })).toBeVisible()
  await expect(page.getByRole('main')).not.toHaveAttribute('inert')
  await expect(page.locator('dialog[open]')).toHaveCount(0)
})

test('pauses remaining time for hover and document hiding', async ({ page }) => {
  await page.goto('/playground/#/checks/toast')
  await page.locator('#timed').click()
  await page.locator('.m-toast').hover()
  await page.waitForTimeout(1800)
  await expect(page.locator('.m-toast')).toBeVisible()
  await page.mouse.move(0, 830)
  await expect(page.locator('.m-toast')).toHaveCount(0, { timeout: 3500 })
  await page.locator('#timed').click()
  await expect(page.locator('.m-toast')).toBeVisible()
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await page.waitForTimeout(1800)
  await expect(page.locator('.m-toast')).toBeVisible()
  await page.evaluate(() => {
    Reflect.deleteProperty(document, 'hidden')
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(page.locator('.m-toast')).toHaveCount(0, { timeout: 3500 })
})

test('waits behind a Sheet and releases the host on unmount and navigation', async ({ page }) => {
  await page.goto('/playground/#/checks/toast')
  await page.locator('#sheet').click()
  const dialog = page.getByRole('dialog', { name: 'Modal first' })
  await dialog.getByRole('button', { name: 'Queue while covered' }).click()
  await page.waitForTimeout(1800)
  await expect(page.locator('.m-toast-host')).toBeHidden()
  await dialog.getByRole('button', { name: 'Close sheet' }).click()
  await expect(page.locator('.m-toast')).toBeVisible()
  await expect(page.getByRole('status')).toContainText('Timed notice')
  await expect(page.locator('.m-toast')).toHaveCount(0, { timeout: 3500 })
  await page.locator('#persistent').click()
  await page.locator('#toggle-host').click()
  await expect(page.locator('.m-toast-host')).toHaveCount(0)
  await page.locator('#toggle-host').click()
  await expect(page.locator('.m-toast')).toHaveCount(0)
  await page.locator('#queue').click()
  await page.evaluate(() => {
    location.hash = '#/showcase/profile'
  })
  await expect(page.getByRole('heading', { name: 'Do seu jeito.' })).toBeVisible()
  await expect(page.locator('.m-toast')).toHaveCount(0)
  await page.waitForTimeout(1800)
  await expect(page.locator('.m-toast')).toHaveCount(0)
})

test('renders all tones in both themes and preserves narrow-screen geometry', async ({
  page,
}, info) => {
  await page.goto('/playground/#/components/toast')
  for (const theme of ['mavis', 'midnight']) {
    for (const [label, tone] of [
      ['Sucesso', 'success'],
      ['Erro', 'error'],
      ['Aviso', 'warning'],
      ['Informação', 'info'],
    ] as const) {
      await page.getByRole('button', { name: label, exact: true }).click()
      await expect(page.locator('.m-toast')).toHaveAttribute('data-tone', tone)
      await page.getByRole('button', { name: 'Fechar aviso', exact: true }).click()
      await expect(page.locator('.m-toast')).toHaveCount(0)
    }
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await page.getByRole('button', { name: 'Sem fechar sozinho' }).click()
      await expect(page.locator('.m-toast')).toHaveCSS('opacity', '1')
      await page.waitForTimeout(220)
      const bounds = await page.locator('.m-toast').boundingBox()
      expect(bounds!.x).toBeGreaterThanOrEqual(0)
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
      await page.screenshot({ path: info.outputPath(`toast-${theme}-${width}.png`) })
      await page.getByRole('button', { name: 'Fechar aviso', exact: true }).click()
      await expect(page.locator('.m-toast')).toHaveCount(0)
    }
    if (theme === 'mavis') await page.getByRole('button', { name: 'Trocar tema' }).click()
  }
})

test('keeps long copy scrollable, the close target reachable, and reduced motion immediate', async ({
  page,
}, info) => {
  await page.goto('/playground/#/checks/toast')
  await page.setViewportSize({ width: 320, height: 480 })
  await page.locator('#long').click()
  await page.locator('.m-toast-copy').evaluate((el: HTMLElement) => {
    el.style.fontSize = '32px'
  })
  const panel = page.locator('.m-toast')
  await expect(panel).toBeVisible()
  expect(await panel.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
  await expect(page.getByRole('button', { name: 'Dismiss notice' })).toBeInViewport()
  expect(
    await page.locator('.m-toast-copy').evaluate((el) => el.scrollHeight > el.clientHeight),
  ).toBe(true)
  await page.screenshot({ path: info.outputPath('toast-long-320.png') })
  await page.getByRole('button', { name: 'Dismiss notice' }).click()
  await expect(panel).toHaveCount(0)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.locator('#persistent').click()
  await expect(panel).toHaveCSS('transition-duration', '0s')
  await expect(panel).toHaveCSS('transform', 'none')
})
