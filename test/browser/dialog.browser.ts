import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/playground/#/checks/dialog')
})

test('contains keyboard focus, cancels with Escape and restores the opener', async ({ page }) => {
  await page.locator('#normal').focus()
  await page.locator('#normal').press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Delete collection?' })
  const cancel = dialog.getByRole('button', { name: 'Keep collection' })
  const confirm = dialog.getByRole('button', { name: 'Delete', exact: true })
  await expect(cancel).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(confirm).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(cancel).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(page.locator('#normal')).toBeFocused()
  await expect(page.getByText('Closed: escape', { exact: true })).toBeVisible()
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')
})

test('blocks dismissal and duplicate confirmation while processing, then permits retry', async ({
  page,
}) => {
  await page.locator('#normal').click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(dialog).toHaveAttribute('aria-busy', 'true')
  await expect(dialog.getByRole('button', { name: 'Keep collection' })).toBeDisabled()
  await expect(dialog.getByRole('button', { name: 'Deleting…' })).toBeDisabled()
  await page.keyboard.press('Escape')
  await page.mouse.click(8, 8)
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('Could not finish. Try again.')
  await dialog.getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(dialog).toHaveAttribute('aria-busy', 'true')
  await expect(dialog.getByRole('button', { name: 'Keep collection' })).toBeEnabled({
    timeout: 3000,
  })
  await dialog.getByRole('button', { name: 'Keep collection' }).click()
  await expect(page.getByText('Confirmations: 2', { exact: true })).toBeVisible()
})

test('respects locked and rejected close requests without leaving the dialog inert', async ({
  page,
}) => {
  const dialog = page.getByRole('dialog')
  await page.locator('#locked').click()
  await page.keyboard.press('Escape')
  await page.mouse.click(8, 8)
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Keep collection' }).click()
  await expect(dialog).toHaveCount(0)
  await page.locator('#reject').click()
  await dialog.getByRole('button', { name: 'Keep collection' }).click()
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(dialog).toHaveAttribute('aria-busy', 'true')
})

test('handles backdrop, programmatic close and rapid reopening', async ({ page }) => {
  await page.locator('#normal').click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.mouse.click(8, 8)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByText('Closed: backdrop', { exact: true })).toBeVisible()
  await page.locator('#program').click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByText('Closed: program', { exact: true })).toBeVisible()
  await page.locator('#reopen').click()
  await page.waitForTimeout(1000)
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Keep collection' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')
})

test('holds Toast behind the modal and cleans up navigation', async ({ page }) => {
  await page.locator('#toast').click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.locator('.m-toast-host')).toBeHidden()
  await page.getByRole('button', { name: 'Keep collection' }).click()
  await expect(page.getByRole('status')).toContainText('After the decision')
  await page.getByRole('button', { name: 'Dismiss notification' }).click()
  await page.locator('#navigate').click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page).toHaveURL(/checks\/screen\/next/)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')
})

test('keeps long content scrollable and actions visible on a short, narrow screen', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 480 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.locator('#long').click()
  const panel = page.locator('.m-dialog-panel')
  await expect(panel).toBeVisible()
  const bounds = await panel.boundingBox()
  expect(bounds!.x).toBeGreaterThanOrEqual(24)
  expect(bounds!.y).toBeGreaterThanOrEqual(24)
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(456)
  expect(
    await page.locator('.m-dialog-body').evaluate((el) => el.scrollHeight > el.clientHeight),
  ).toBe(true)
  await expect(page.getByRole('button', { name: 'Keep collection' })).toBeInViewport()
  await expect(page.getByRole('dialog')).toHaveCSS('transition-duration', '0s')
  await page.screenshot({ path: info.outputPath('dialog-long-320.png') })
})

test('shows both tones in each theme and confirms Profile discard explicitly', async ({
  page,
}, info) => {
  await page.goto('/playground/#/components/dialog')
  for (const theme of ['mavis', 'midnight']) {
    for (const action of ['Publicar coleção', 'Excluir coleção']) {
      await page.getByRole('button', { name: action, exact: true }).click()
      await expect(page.getByRole('dialog')).toHaveCSS('opacity', '1')
      const actions = await page
        .locator('.m-dialog-actions button')
        .evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().width))
      expect(Math.min(...actions)).toBeGreaterThan(100)
      await page.screenshot({
        path: info.outputPath(
          `dialog-${theme}-${action.startsWith('Excluir') ? 'danger' : 'default'}.png`,
        ),
      })
      await page.getByRole('button', { name: 'Agora não' }).click()
      await expect(page.getByRole('dialog')).toHaveCount(0)
    }
    if (theme === 'mavis') await page.getByRole('button', { name: 'Trocar tema' }).click()
  }
  await page.goto('/playground/#/showcase/profile')
  const name = page.getByRole('textbox', { name: 'Nome completo', exact: true })
  await name.fill('Marina editada')
  await page.getByRole('button', { name: 'Descartar alterações' }).click()
  await page.getByRole('button', { name: 'Continuar editando' }).click()
  await expect(name).toHaveValue('Marina editada')
  await page.getByRole('button', { name: 'Descartar alterações' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Descartar', exact: true }).click()
  await expect(name).toHaveValue('Marina Costa')
})
