import { expect, test } from '@playwright/test'

test('keeps circles and bars inside the layout in both themes and narrow screens', async ({
  page,
}, info) => {
  await page.goto('/playground/#/components/skeleton')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const theme of ['mavis', 'midnight']) {
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      const shapes = page.locator('.m-skeleton')
      await expect(shapes).toHaveCount(7)
      const circle = await shapes.first().boundingBox()
      expect(circle!.width).toBe(48)
      expect(circle!.height).toBe(48)
      await expect(shapes.first()).toHaveAttribute('aria-hidden', 'true')
      await expect(shapes.first()).toHaveAttribute('inert', '')
      expect(await page.getByRole('main').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
        true,
      )
      await page.screenshot({ path: info.outputPath(`skeleton-${theme}-${width}.png`) })
    }
    if (theme === 'mavis') await page.getByRole('button', { name: 'Trocar tema' }).click()
  }
})

test('switches between the pulse and a static shape, including live reduced motion changes', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/playground/#/components/skeleton')
  const shape = page.locator('.m-skeleton').first()
  await expect(shape).toHaveCSS('animation-name', 'm-skeleton-pulse')
  await expect.poll(() => shape.evaluate((el) => el.getAnimations().length)).toBe(1)
  await page.getByRole('switch', { name: 'Animar placeholders' }).click()
  await expect(shape).toHaveCSS('animation-name', 'none')
  await expect(shape).toHaveCSS('opacity', '1')
  await page.getByRole('switch', { name: 'Animar placeholders' }).click()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(shape).toHaveCSS('animation-name', 'none')
  await expect(shape).toHaveCSS('opacity', '1')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(shape).toHaveCSS('animation-name', 'm-skeleton-pulse')
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(shape).toHaveCSS('animation-play-state', 'paused')
  await page.evaluate(() => {
    delete (document as unknown as { hidden?: boolean }).hidden
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(shape).toHaveCSS('animation-play-state', 'running')
})

test('replaces loading shapes with content and releases them across navigation', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/playground/#/components/skeleton')
  for (let n = 0; n < 3; n++) {
    await page.getByRole('button', { name: 'Mostrar conteúdo' }).click()
    await expect(page.locator('.m-skeleton')).toHaveCount(0)
    await expect(page.getByText('Ideias precisam respirar.', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Carregar novamente' }).click()
    await expect(page.locator('.m-skeleton')).toHaveCount(7)
  }
  await page.getByRole('button', { name: '← Componentes' }).click()
  // The gallery uses static shapes in its Skeleton artwork.
  await expect(page.locator('.m-skeleton[data-animated="true"]')).toHaveCount(0)
  await page.getByRole('button', { name: 'Explorar Skeleton', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Mostrar conteúdo' })).toBeVisible()
  expect(errors).toEqual([])
})

test('preserves Library selection and saved readings through a simulated refresh', async ({
  page,
}) => {
  await page.goto('/playground/#/showcase/library')
  await page.getByRole('checkbox', { name: 'Design', exact: true }).uncheck()
  await page.getByRole('tab', { name: 'Salvos (1)' }).click()
  await page.getByRole('button', { name: 'Atualizar coleção' }).click()
  await expect(page.getByRole('button', { name: 'Atualizar coleção' })).toBeDisabled()
  await expect(page.locator('.m-skeleton')).toHaveCount(12)
  await expect(page.getByRole('button', { name: 'Remover dos salvos' })).toHaveCount(0)
  await expect(page.locator('.m-skeleton')).toHaveCount(0, { timeout: 4000 })
  await expect(page.getByRole('tab', { name: 'Salvos (1)' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(page.getByRole('button', { name: 'Remover dos salvos' })).toBeVisible()
  await page.getByRole('tab', { name: 'Explorar', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'Design', exact: true })).not.toBeChecked()
  await page.getByRole('button', { name: 'Atualizar coleção' }).click()
  await page.getByRole('button', { name: '← Showcase' }).click()
  await expect(page.locator('.m-skeleton')).toHaveCount(0)
})
