import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('Atlas uses desktop columns and reorganizes the notebook on narrow screens', async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/playground/#/showcase/atlas')
  const photo = page.locator('.atlas-photograph')
  const notes = page.locator('.atlas-field-notes')
  await expect(photo).toBeVisible()
  await expect
    .poll(async () => {
      const a = await photo.boundingBox(),
        b = await notes.boundingBox()
      return Boolean(a && b && b.x >= a.x + a.width && a.width > 650)
    })
    .toBe(true)
  for (const width of [1920, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true)
    if (width < 1200)
      await expect
        .poll(async () => {
          const a = await photo.boundingBox(),
            b = await notes.boundingBox()
          return Boolean(a && b && b.y >= a.y + a.height)
        })
        .toBe(true)
  }
  await page.screenshot({ path: info.outputPath('atlas-320.png'), fullPage: true })
})

test('Atlas keeps drafts, navigation and keyed data while its presentations change', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/playground/#/showcase/atlas')
  await expect(page.getByRole('heading', { name: 'Onde o mundo respira.' })).toBeVisible()
  await page.screenshot({ path: info.outputPath('atlas-desktop.png'), fullPage: true })
  await page.getByRole('button', { name: 'Próximo destino', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Um pouco mais devagar.' })).toBeVisible()
  await page.getByRole('button', { name: 'Sua viagem', exact: true }).click()
  await page.getByLabel('Nome da viagem', { exact: true }).fill('Uma viagem nossa')
  await page.getByLabel('Nome da viagem', { exact: true }).press('Escape')
  await expect(page.getByRole('button', { name: 'Sua viagem', exact: true })).toBeFocused()
  await page.getByRole('tab', { name: 'Meu roteiro', exact: true }).click()
  await page.getByRole('button', { name: 'Outra ordem', exact: true }).click()
  await expect(page.locator('.m-data-table-scroll tbody tr').first()).toContainText('Sabores')
  await page.getByRole('tab', { name: 'Orçamento', exact: true }).click()
  const bar = page.locator('.m-chart-plot rect[rx]').first()
  await expect(bar).toBeVisible()
  await expect.poll(async () => Number(await bar.getAttribute('height'))).toBeGreaterThan(60)
  const before = Number(await bar.getAttribute('height'))
  await page.getByRole('radio', { name: 'Um pouco mais de conforto', exact: true }).click()
  await expect
    .poll(async () => Number(await bar.getAttribute('height')))
    .toBeGreaterThan(before + 15)
  await page.getByRole('tab', { name: 'Inspiração', exact: true }).click()
  await expect(page.getByText('Uma viagem nossa', { exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

test('Atlas is usable on a narrow viewport with reduced motion and accessible controls', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/playground/#/showcase/atlas')
  await expect(page.getByRole('button', { name: 'Próximo destino', exact: true })).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true)
  await page.getByRole('button', { name: 'Mudar aparência', exact: true }).click()
  await page.getByRole('tab', { name: 'Orçamento', exact: true }).click()
  const bar = page.locator('.m-chart-plot rect[rx]').first()
  await page.getByRole('radio', { name: 'Um pouco mais de conforto', exact: true }).click()
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())))
  expect(Number(await bar.getAttribute('height'))).toBeCloseTo(89.6, 1)
  await page.getByRole('radio', { name: 'Essencial', exact: true }).click()
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())))
  expect(Number(await bar.getAttribute('height'))).toBeCloseTo(67.2, 1)
  const result = await new AxeBuilder({ page }).analyze()
  await page.screenshot({ path: info.outputPath('atlas-mobile-dark.png'), fullPage: true })
  expect(result.violations).toEqual([])
  expect(errors).toEqual([])
})

test('carousel follows the pointer before release and settles on the chosen slide', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/playground/#/showcase/atlas')
  const slide = page.getByRole('group', { name: 'Destino 1 / 3', exact: true })
  const box = await slide.boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.move(box!.x + box!.width * 0.75, box!.y + 60)
  await page.mouse.down()
  await page.mouse.move(box!.x + box!.width * 0.4, box!.y + 60, { steps: 8 })
  await expect.poll(async () => (await slide.boundingBox())!.x).toBeLessThan(box!.x - 15)
  await page.mouse.up()
  await expect(page.getByRole('group', { name: 'Destino 2 / 3', exact: true })).toBeVisible()
  expect(errors).toEqual([])
})
