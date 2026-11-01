import { expect, test } from '@playwright/test'

for (const component of ['progress', 'alert']) {
  test(`${component} fits narrow layouts in both themes`, async ({ page }, info) => {
    await page.goto(`/playground/#/components/${component}`)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    for (const theme of ['mavis', 'midnight']) {
      for (const width of [320, 390, 1440]) {
        await page.setViewportSize({ width, height: 1100 })
        const demo = page.locator(`#${component}-demo`)
        await demo.scrollIntoViewIfNeeded()
        expect(
          await page.getByRole('main').evaluate((el) => el.scrollWidth <= el.clientWidth),
        ).toBe(true)
        const outside = await demo.evaluate((root) => {
          const outer = root.getBoundingClientRect()
          return [...root.querySelectorAll('.m-progress, .m-alert, button')].some((el) => {
            const r = el.getBoundingClientRect()
            return r.left < outer.left - 1 || r.right > outer.right + 1
          })
        })
        expect(outside).toBe(false)
        await page.screenshot({ path: info.outputPath(`${component}-${theme}-${width}.png`) })
      }
      if (theme === 'mavis') await page.getByRole('button', { name: 'Trocar tema' }).click()
    }
  })
}

test('Progress reaches zero and max and switches modes without stale state', async ({ page }) => {
  await page.goto('/playground/#/components/progress')
  const track = page.getByRole('progressbar', { name: 'Download da coleção' })
  const fill = track.locator('.m-progress-fill')
  await expect(track).toHaveAttribute('aria-valuenow', '64')
  await page.getByRole('button', { name: 'Zerar', exact: true }).click()
  await expect(fill).toHaveCSS('width', '0px')
  for (let n = 0; n < 5; n++)
    await page.getByRole('button', { name: 'Avançar', exact: true }).click()
  await expect(track).toHaveAttribute('aria-valuenow', '100')
  expect((await fill.boundingBox())!.width).toBeCloseTo((await track.boundingBox())!.width, 1)
  await expect(page.getByRole('button', { name: 'Avançar', exact: true })).toBeDisabled()
  await page.getByRole('switch', { name: 'Progresso indeterminado' }).click()
  await expect(track).not.toHaveAttribute('aria-valuenow')
  await expect(track).toHaveAttribute('aria-valuetext', 'Preparando')
  await page.getByRole('switch', { name: 'Progresso indeterminado' }).click()
  await expect(track).toHaveAttribute('aria-valuenow', '100')
})

test('indeterminate motion remains contained, pauses and respects reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/playground/#/components/progress')
  await page.getByRole('switch', { name: 'Progresso indeterminado' }).click()
  const track = page.locator('#progress-example'),
    fill = track.locator('.m-progress-fill')
  await expect(fill).toHaveCSS('animation-name', 'm-progress-travel')
  for (const width of [320, 700]) {
    await page.setViewportSize({ width, height: 1000 })
    // Freeze the actual CSS animation at both ends and midway through a cycle.
    const samples = await fill.evaluate((el) => {
      const animation = el.getAnimations()[0]!
      animation.pause()
      return [0, 400, 800, 1200, 1600].map((time) => {
        animation.currentTime = time
        const segment = el.getBoundingClientRect(),
          track = el.parentElement!.getBoundingClientRect()
        return {
          left: segment.left - track.left,
          right: track.right - segment.right,
          ratio: segment.width / track.width,
        }
      })
    })
    for (const sample of samples) {
      expect(sample.left).toBeGreaterThanOrEqual(-1)
      expect(sample.right).toBeGreaterThanOrEqual(-1)
      expect(sample.ratio).toBeCloseTo(0.32, 2)
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(fill).toHaveCSS('animation-name', 'none')
  const bounds = await fill.evaluate((el) => {
    const segment = el.getBoundingClientRect(),
      track = el.parentElement!.getBoundingClientRect()
    return { left: segment.left - track.left, right: track.right - segment.right }
  })
  expect(Math.abs(bounds.left - bounds.right)).toBeLessThanOrEqual(1)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(fill).toHaveCSS('animation-play-state', 'paused')
  await page.evaluate(() => {
    delete (document as unknown as { hidden?: boolean }).hidden
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(fill).toHaveCSS('animation-play-state', 'running')
  await page.getByRole('button', { name: 'Ocultar indicador' }).click()
  await expect(track).toHaveCount(0)
  await page.getByRole('button', { name: 'Mostrar indicador' }).click()
  await expect(track.locator('.m-progress-fill')).toHaveCSS('animation-name', 'm-progress-travel')
})

test('Alert separates actions, controlled dismissal and opt-in live messages', async ({ page }) => {
  await page.goto('/playground/#/components/alert')
  const notice = page.locator('#alert-example')
  await expect(notice.locator('[role=status], [role=alert]')).toHaveCount(0)
  await page.getByRole('button', { name: 'Ver detalhes', exact: true }).click()
  await expect(page.getByText('Detalhes abertos 1 vez(es).', { exact: true })).toBeVisible()
  await expect(notice).toBeVisible()
  await page.getByRole('switch', { name: 'Anunciar atualizações' }).click()
  await expect(notice.getByRole('status')).toContainText('Suas leituras vão com você.')
  await page.getByRole('button', { name: 'Erro', exact: true }).click()
  await expect(notice.getByRole('alert')).toContainText('Não foi possível concluir.')
  await expect(notice.getByRole('alert').getByRole('button')).toHaveCount(0)
  await page.getByRole('button', { name: 'Fechar aviso', exact: true }).click()
  await expect(notice).toHaveCount(0)
  await expect(page.getByText('Sem pressa para desaparecer.', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Mostrar aviso', exact: true }).click()
  await expect(notice).toHaveAttribute('data-tone', 'error')
  for (const [button, tone] of [
    ['Informação', 'info'],
    ['Sucesso', 'success'],
    ['Atenção', 'warning'],
  ]) {
    await page.getByRole('button', { name: button, exact: true }).click()
    await expect(notice).toHaveAttribute('data-tone', tone!)
  }
})

test('Library preserves filters and saved readings through failure, retry and cancellation', async ({
  page,
}, info) => {
  await page.goto('/playground/#/showcase/library')
  const design = page.getByRole('button', { name: 'Design', exact: true })
  await design.focus()
  await design.press('Space')
  await expect(design).toHaveAttribute('aria-pressed', 'false')
  await page.getByRole('button', { name: 'Baixar coleção', exact: true }).click()
  const track = page.locator('#library-download-progress')
  await expect(track).not.toHaveAttribute('aria-valuenow')
  await expect(track).toHaveAttribute('aria-valuenow', /[1-9]\d*/, { timeout: 3000 })
  await page.getByRole('button', { name: 'Simular falha', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('A conexão foi interrompida.')
  await page.screenshot({ path: info.outputPath('library-download-error.png') })
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(track).toHaveAttribute('aria-valuenow', '100', { timeout: 9000 })
  await expect(page.getByRole('status')).toContainText('Coleção preparada.')
  await page.getByRole('button', { name: 'Ver salvos', exact: true }).click()
  await expect(page.getByRole('tab', { name: 'Salvos (1)' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await page.getByRole('button', { name: 'Fechar confirmação do download' }).click()
  await expect(page.getByRole('status')).toHaveCount(0)
  await page.getByRole('button', { name: 'Baixar novamente', exact: true }).click()
  await page.getByRole('button', { name: 'Cancelar download', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Download cancelado.')
  await page.getByRole('tab', { name: 'Explorar', exact: true }).click()
  await expect(design).toHaveAttribute('aria-pressed', 'false')
  await page.getByRole('button', { name: 'Baixar novamente', exact: true }).click()
  await page.getByRole('button', { name: '← Showcase' }).click()
  await expect(page.getByRole('progressbar')).toHaveCount(0)
})
