import { writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
test('Chip separates selection, controlled rejection, removal and disabled actions', async ({
  page,
  browserName,
}) => {
  await page.goto('/playground/#/checks/chip')
  const chip = page.locator('#combined-chip')
  const select = chip.getByRole('button', { name: 'Design', exact: true })
  const remove = chip.getByRole('button', { name: 'Remover Design', exact: true })
  await select.focus()
  await select.press('Space')
  await expect(select).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByText('1 solicitações; 0 remoções', { exact: true })).toBeVisible()
  await page.getByRole('switch', { name: 'Aceitar mudanças' }).click()
  await select.focus()
  await select.press('Enter')
  await expect(select).toHaveAttribute('aria-pressed', 'true')
  await expect(select).toHaveCSS('outline-style', 'solid')
  await page.keyboard.press(
    browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab',
  )
  await expect(remove).toBeFocused()
  await remove.press('Space')
  await expect(page.getByText('2 solicitações; 1 remoções', { exact: true })).toBeVisible()
  await expect(select).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('switch', { name: 'Desabilitar chip' }).click()
  await expect(select).toBeDisabled()
  await expect(remove).toBeDisabled()
  await select.dispatchEvent('click')
  await remove.dispatchEvent('click')
  await expect(page.getByText('2 solicitações; 1 remoções', { exact: true })).toBeVisible()
})
test('Chip demo removal is app-owned and EmptyState recovery replaces the empty content', async ({
  page,
}) => {
  await page.goto('/playground/#/components/chip')
  await expect(page.getByRole('button', { name: 'Editorial', exact: true })).toHaveCount(0)
  for (const tag of ['Vue', 'NativeScript', 'Web'])
    await page.getByRole('button', { name: `Remover ${tag}`, exact: true }).click()
  await expect(page.getByText('Espaço para novas ideias.', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Restaurar tags', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Remover Vue', exact: true })).toBeVisible()
  await page.goto('/playground/#/components/empty-state')
  await expect(
    page.locator('.m-empty-state [role=status], .m-empty-state [role=alert]'),
  ).toHaveCount(0)
  await page.getByRole('button', { name: 'Criar coleção', exact: true }).click()
  await expect(page.getByText('Primeira coleção criada.', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Recomeçar', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Uma coleção à sua espera.', exact: true }),
  ).toBeVisible()
})
test('Library recovers empty searches and saved readings without losing app state', async ({
  page,
}) => {
  await page.goto('/playground/#/showcase/library')
  const activate = async (name: string, role: 'button' | 'tab' = 'button') => {
    const action = page.getByRole(role, { name, exact: true })
    await action.focus()
    await action.press('Enter')
  }
  const input = page.getByRole('textbox', { name: 'Buscar leituras', exact: true })
  await input.fill('impossivel')
  await expect(
    page.getByRole('heading', { name: 'Nenhuma ideia por aqui.', exact: true }),
  ).toBeVisible()
  await activate('Salvos (1)', 'tab')
  await expect(page.getByText('O espaço também fala.', { exact: true })).toBeVisible()
  await activate('Remover dos salvos')
  await expect(
    page.getByRole('heading', { name: 'Guarde uma boa ideia.', exact: true }),
  ).toBeVisible()
  await activate('Explorar leituras')
  await expect(input).toHaveValue('impossivel')
  await activate('Limpar filtros')
  await expect(input).toHaveValue('')
  await expect(page.getByText('3 de 3', { exact: true })).toBeVisible()
  await input.fill('ESPACO')
  await expect(page.getByText('1 de 3', { exact: true })).toBeVisible()
  await expect(page.getByText('O espaço também fala.', { exact: true })).toBeVisible()
})
// In Safari a press focuses the tab panel around the control. The Screen once revealed that
// oversized panel between pointer-down and pointer-up, so the release landed on other content
// and no click reached the button (#210).
for (const reducedMotion of ['no-preference', 'reduce'] as const)
  test(`Library recovery works by pointer and every press ends where it began (${reducedMotion})`, async ({
    page,
  }, info) => {
    await page.emulateMedia({ reducedMotion })
    await page.goto('/playground/#/showcase/library')
    await page.evaluate(() => {
      const log: string[] = []
      ;(window as unknown as { pointerLog: string[] }).pointerLog = log
      for (const type of ['pointerdown', 'pointerup', 'pointercancel', 'click'])
        document.addEventListener(
          type,
          (event) => {
            const target = (event.target as HTMLElement).closest('button,[role=tab]')
            const box = (event.target as HTMLElement).getBoundingClientRect()
            log.push(
              `${type} "${(target?.textContent ?? '').trim()}" at ${Math.round((event as PointerEvent).clientX)},${Math.round((event as PointerEvent).clientY)} box ${Math.round(box.x)},${Math.round(box.y)}`,
            )
          },
          true,
        )
      document.addEventListener('scroll', () => log.push('scroll'), true)
    })
    const activate = (name: string, role: 'button' | 'tab' = 'button') =>
      page.getByRole(role, { name, exact: true }).click()
    const input = page.getByRole('textbox', { name: 'Buscar leituras', exact: true })
    let log: string[] = []
    try {
      await input.fill('impossivel')
      await expect(
        page.getByRole('heading', { name: 'Nenhuma ideia por aqui.', exact: true }),
      ).toBeVisible()
      await activate('Salvos (1)', 'tab')
      await expect(page.getByText('O espaço também fala.', { exact: true })).toBeVisible()
      await activate('Remover dos salvos')
      await expect(
        page.getByRole('heading', { name: 'Guarde uma boa ideia.', exact: true }),
      ).toBeVisible()
      await activate('Explorar leituras')
      await expect(input).toHaveValue('impossivel')
      await activate('Limpar filtros')
      await expect(input).toHaveValue('')
      await expect(page.getByText('3 de 3', { exact: true })).toBeVisible()
    } finally {
      log = await page.evaluate(() => (window as unknown as { pointerLog: string[] }).pointerLog)
      const file = info.outputPath('pointer-log.txt')
      await writeFile(file, log.join('\n'))
      await info.attach('pointer-log', { path: file, contentType: 'text/plain' })
    }
    // Without the icon glyph a button's text may start with.
    const name = (entry: string) => /"(.*)"/.exec(entry)![1]!.replace(/^[^\p{L}]+/u, '')
    const presses = log.filter((entry) => /^pointer(down|up|cancel) /.test(entry))
    expect(presses.filter((entry) => entry.startsWith('pointercancel'))).toEqual([])
    const started = presses.filter((entry) => entry.startsWith('pointerdown')).map(name)
    expect(presses.filter((entry) => entry.startsWith('pointerup')).map(name)).toEqual(started)
    expect(started.slice(-4)).toEqual([
      'Salvos (1)',
      'Remover dos salvos',
      'Explorar leituras',
      'Limpar filtros',
    ])
  })

test('long content, themes and reduced motion stay within small and large viewports', async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/playground/#/checks/chip')
    for (const theme of ['Mavis', 'Midnight']) {
      if (theme === 'Midnight')
        await page.getByRole('button', { name: 'Trocar tema', exact: true }).click()
      await expect(page.locator('#combined-chip button').first()).toHaveCSS(
        'transition-duration',
        '0s',
      )
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      )
      const bounds = await page.locator('.m-chip').evaluateAll((elements) =>
        elements.map((el) => ({
          left: el.getBoundingClientRect().left,
          right: el.getBoundingClientRect().right,
          width: innerWidth,
        })),
      )
      expect(bounds.every((b) => b.left >= 0 && b.right <= b.width)).toBe(true)
      await page.screenshot({ path: info.outputPath(`chip-${width}-${theme}.png`), fullPage: true })
    }
  }
})
