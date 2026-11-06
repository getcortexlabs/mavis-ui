import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.use({ baseURL: 'http://127.0.0.1:4173', viewport: { width: 1440, height: 1000 } })

function observeErrors(page: import('@playwright/test').Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error' || /hydration|\[jolt\]/i.test(message.text()))
      errors.push(message.text())
  })
  return errors
}

test('home uses real controls and retains task identity during Jolt layout changes', async ({
  page,
}, info) => {
  const errors = observeErrors(page)
  await page.goto('/')
  await expect(page.locator('h1')).toHaveAccessibleName('Interfaces with character.')
  const tasks = page.locator('.board-tasks')
  await expect(tasks.getByRole('checkbox').first()).toBeChecked()
  await page.getByRole('button', { name: 'Reorder tasks', exact: true }).click()
  await expect(tasks.getByRole('checkbox').first()).toHaveAccessibleName(
    'Give the details some love',
  )
  await tasks.getByRole('checkbox').first().check()
  await expect(page.locator('.board-progress-label')).toContainText('2/3')
  await page.getByRole('switch', { name: 'Keep it compact', exact: true }).click()
  await expect(tasks).toHaveClass(/compact/)
  await page.screenshot({ path: info.outputPath('home-desktop.png'), fullPage: false })
  await expect(page.locator('.mavis-experience')).toBeVisible()
  expect(errors).toEqual([])
})

test('theme studio exports the selected tokens and preserves the live form', async ({
  page,
  context,
}, info) => {
  const errors = observeErrors(page)
  await page.goto('/#studio')
  await page.getByRole('button', { name: 'Iris', exact: false }).click()
  await page
    .getByRole('group', { name: 'Demo appearance', exact: true })
    .getByRole('button', { name: 'Dark' })
    .click()
  const radius = page.getByLabel(/02 — Corners/)
  await radius.fill('24')
  const code = page.locator('.theme-studio .studio-code code')
  await expect(code).toContainText('"primary": "#C7B8FF"')
  await expect(code).toContainText('"md": 24')
  await page.getByLabel('Your name', { exact: true }).fill('Marina')
  await page
    .getByRole('group', { name: 'Demo session day' })
    .getByRole('button', { name: 'FRI 20' })
    .click()
  await page.getByRole('button', { name: 'Save a little time', exact: true }).click()
  await expect(page.locator('.booking-feedback')).toHaveText('Marina, your moment is on the 20th.')
  await page.getByRole('button', { name: 'Glacier', exact: false }).click()
  await expect(page.getByLabel('Your name', { exact: true })).toHaveValue('Marina')
  await expect(code).toContainText('"primary": "#AADBF2"')
  if (info.project.name === 'chromium') {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.getByRole('button', { name: 'Copy theme' }).click()
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toContain('studio-glacier')
  }
  await page.locator('.theme-studio').screenshot({ path: info.outputPath('theme-studio.png') })
  expect(errors).toEqual([])
})

test('gallery filters, empty state and component preview keep navigation usable', async ({
  page,
}, info) => {
  const errors = observeErrors(page)
  await page.goto('/components/')
  await expect(page.locator('.gallery-card')).toHaveCount(62)
  const filters = page.getByRole('group', { name: 'Component categories' })
  await filters.getByRole('button', { name: /^Forms / }).click()
  await expect(page.locator('.gallery-card')).toHaveCount(19)
  await page.getByRole('searchbox', { name: 'Search components' }).fill('zzznothing')
  await expect(page.getByText('We haven’t found that piece yet.')).toBeVisible()
  await page.getByRole('button', { name: 'Show all components' }).click()
  await page.getByRole('searchbox', { name: 'Search components' }).fill('button')
  await page
    .locator('.gallery-card')
    .filter({ has: page.getByRole('heading', { name: 'Button', exact: true }) })
    .click()
  await expect(page.locator('h1')).toHaveText('Button')
  const preview = page.locator('.component-preview')
  await preview.getByRole('button', { name: '375px', exact: true }).click()
  await expect(preview.locator('.preview-viewport')).toHaveCSS('max-width', '375px')
  await expect(preview.frameLocator('iframe').getByRole('button').first()).toBeVisible()
  await preview.getByRole('button', { name: 'Midnight', exact: true }).click()
  await expect(preview.locator('iframe')).toHaveAttribute('src', /theme=midnight/)
  await preview.getByRole('button', { name: 'Reset example', exact: true }).click()
  await expect(preview.frameLocator('iframe').getByRole('button').first()).toBeVisible()
  await page.screenshot({ path: info.outputPath('component-docs.png'), fullPage: false })
  await page.locator('.VPNavBarTitle a').click()
  await expect(page.locator('.hero-display')).toBeVisible()
  expect(errors).toEqual([])
})

test('platform viewer distinguishes live Web from native recordings', async ({ page }) => {
  const errors = observeErrors(page)
  await page.goto('/')
  const proof = page.locator('.platform-proof')
  await proof.scrollIntoViewIfNeeded()
  await expect(
    proof.frameLocator('iframe').getByText('Go a little further.', { exact: true }),
  ).toBeVisible()
  await proof.getByRole('button', { name: /iOS/ }).click()
  await expect(proof.locator('video')).toHaveAttribute('src', '/media/field-ios.mp4')
  await expect(proof.locator('video')).not.toHaveAttribute('autoplay', '')
  await expect(proof.locator('.platform-evidence')).toContainText('Simulator')
  const poster = await page.request.get('/images/field-ios-poster.jpg')
  expect(poster.ok()).toBe(true)
  await proof.getByRole('button', { name: /Android/ }).click()
  await expect(proof.locator('video')).toHaveAttribute('src', '/media/field-android.mp4')
  await expect(proof.locator('.platform-evidence')).toContainText('Emulator')
  expect(errors).toEqual([])
})

for (const pt of [false, true]) {
  test(`responsive, accessible documentation experience: ${pt ? 'pt' : 'en'}`, async ({
    page,
  }, info) => {
    const errors = observeErrors(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(pt ? '/pt-BR/' : '/')
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 })
      const overflow = await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
        elements: [...document.querySelectorAll('.mavis-experience *')]
          .filter((element) => element.getBoundingClientRect().right > innerWidth + 1)
          .map((element) => element.className)
          .slice(0, 12),
      }))
      expect(overflow.scroll, JSON.stringify(overflow)).toBeLessThanOrEqual(width)
      await expect(page.locator('.hero-display')).toBeVisible()
      if (width === 390)
        await page.screenshot({ path: info.outputPath('home-mobile.png'), fullPage: true })
    }
    await page.setViewportSize({ width: 1440, height: 1000 })
    const light = await new AxeBuilder({ page })
      .include('.mavis-experience')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(light.violations).toEqual([])
    await page.locator('.VPNavBarAppearance .VPSwitchAppearance').click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    const dark = await new AxeBuilder({ page })
      .include('.mavis-experience')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(dark.violations).toEqual([])
    await page.screenshot({ path: info.outputPath('home-dark.png'), fullPage: false })
    await page.goto(`${pt ? '/pt-BR' : ''}/showcase/`)
    await expect(page.locator('.showcase-tile')).toHaveCount(7)
    await page.locator('.showcase-tile').first().click()
    await expect(page.locator('h1')).toHaveText('Atlas')
    expect(errors).toEqual([])
  })
}

test('server-rendered home remains readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:4173/')
  await expect(page.locator('.hero-display')).toBeVisible()
  await expect(page.getByRole('link', { name: /Make something yours/ })).toHaveAttribute(
    'href',
    '/guide/create',
  )
  await expect(page.locator('.studio-code code')).toContainText('defineTheme')
  await context.close()
})
