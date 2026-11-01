import { expect, test } from '@playwright/test'

test('loads an avatar, falls back on missing/invalid sources, and recovers without changing its size', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/playground/#/components/avatar')
  const avatar = page.locator('#avatar-preview')
  await expect(avatar.locator('img')).toBeVisible()
  await expect(avatar).toHaveCSS('width', '96px')
  await expect(avatar).toHaveAttribute('aria-hidden', 'true')
  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', { name: 'Iniciais', exact: true }).click()
    await expect(avatar.locator('img')).toHaveCount(0)
    await expect(avatar).toHaveText('MC')
    await page.getByRole('button', { name: 'Imagem indisponível', exact: true }).click()
    await expect(avatar.locator('img')).toBeHidden()
    await expect(avatar.locator('span').first()).toBeVisible()
    await page.getByRole('button', { name: 'Imagem', exact: true }).click()
    await expect(avatar.locator('img')).toBeVisible()
  }
  await expect(page.getByRole('img', { name: 'Visitante', exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

test('shows counts including zero, contextual labels and no implied button behavior', async ({
  page,
}) => {
  await page.goto('/playground/#/components/badge')
  const badge = page.locator('#badge-count')
  await expect(badge).toHaveText('3')
  await expect(badge).toHaveAccessibleName('3 ideias não lidas')
  await page.getByRole('button', { name: 'Nova ideia', exact: true }).click()
  await expect(badge).toHaveText('4')
  await page.getByRole('button', { name: 'Marcar como lidas', exact: true }).click()
  await expect(badge).toHaveText('0')
  await expect(badge).toHaveAccessibleName('0 ideias não lidas')
  await expect(badge).not.toHaveAttribute('tabindex')
  await expect(badge).not.toHaveAttribute('aria-live')
})

test('fits Avatar and Badge in both themes, narrow screens and enlarged text', async ({
  page,
}, info) => {
  await page.emulateMedia({ colorScheme: 'light' })
  for (const id of ['avatar', 'badge']) {
    await page.goto(`/playground/#/components/${id}`)
    await page.reload()
    for (const theme of ['mavis', 'midnight']) {
      for (const width of [320, 390, 1440]) {
        await page.setViewportSize({ width, height: 1100 })
        expect(
          await page.getByRole('main').evaluate((el) => el.scrollWidth <= el.clientWidth),
        ).toBe(true)
        await page.screenshot({ path: info.outputPath(`${id}-${theme}-${width}.png`) })
      }
      if (theme === 'mavis') await page.getByRole('button', { name: 'Trocar tema' }).click()
    }
  }
  await page.setViewportSize({ width: 320, height: 1000 })
  const badge = page.locator('#badge-count')
  const before = await badge.boundingBox()
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' })
  await expect.poll(async () => (await badge.boundingBox())!.height).toBeGreaterThan(before!.height)
  expect(await page.getByRole('main').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
  await page.screenshot({ path: info.outputPath('badge-large-text.png') })
})

test('updates Profile identity and editing status from parent-owned form state', async ({
  page,
}) => {
  await page.goto('/playground/#/showcase/profile')
  const avatar = page.locator('.m-avatar')
  await expect(avatar).toHaveText('MC')
  await expect(page.locator('.m-badge').filter({ hasText: 'Em dia' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Nome completo', exact: true }).fill('Ana de Lima')
  await expect(avatar).toHaveText('AL')
  await expect(page.locator('.m-badge').filter({ hasText: 'Editando' })).toBeVisible()
  await page.getByRole('button', { name: 'Descartar alterações', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Descartar', exact: true }).click()
  await expect(avatar).toHaveText('MC')
  await expect(page.locator('.m-badge').filter({ hasText: 'Em dia' })).toBeVisible()
})
