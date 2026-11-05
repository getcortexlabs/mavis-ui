import { expect, test } from '@playwright/test'

test.use({
  baseURL: 'http://127.0.0.1:4173',
  viewport: { width: 1440, height: 1000 },
  colorScheme: 'light',
})

for (const pt of [false, true]) {
  test(`site smoke: home, gallery, live example, search and mobile navigation (${pt ? 'pt' : 'en'})`, async ({
    page,
  }, info) => {
    const prefix = pt ? '/pt-BR' : ''
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    const response = await page.goto(`${prefix}/`)
    expect(response?.status()).toBe(200)
    await expect(page.locator('.hero-display')).toBeVisible()
    const portrait = page.locator('.hero-character img')
    await expect(portrait).toHaveAttribute('alt', /Mavis Vermillion/)
    await expect
      .poll(() =>
        portrait.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
      )
      .toBe(true)
    await page.screenshot({ path: info.outputPath('home.png') })
    await page.locator('.VPNavBarAppearance .VPSwitchAppearance').click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.locator('.VPNavBarAppearance .VPSwitchAppearance').click()
    await expect(page.locator('html')).not.toHaveClass(/dark/)

    // Exercise the current homepage CTA; the old "Explore components" CTA no longer exists.
    await page
      .locator('.component-collection')
      .getByRole('link', {
        name: pt ? /^Explore os \d+ componentes$/ : /^Explore all \d+ components$/,
      })
      .click()
    await expect(page).toHaveURL(new RegExp(`${prefix}/components/$`))
    await expect(page.locator('.gallery-card').first()).toBeVisible()
    await page
      .locator('.gallery-card')
      .filter({
        has: page.getByRole('heading', { name: 'Button', exact: true }),
      })
      .click()
    await expect(page.locator('h1')).toHaveText('Button')
    await page.locator('.component-preview iframe').scrollIntoViewIfNeeded()
    await expect(
      page.frameLocator('.component-preview iframe').getByRole('button', {
        name: pt ? 'Primário' : 'Primary',
        exact: true,
      }),
    ).toBeVisible()
    await page.locator('.VPNavBarSearch button').click()
    await page.locator('#localsearch-input').fill('NativeScript')
    await expect(page.locator('.VPLocalSearchBox a.result').first()).toBeVisible()
    await page.keyboard.press('Escape')

    await page.setViewportSize({ width: 390, height: 844 })
    await page.getByRole('button', { name: 'Menu', exact: true }).click()
    await expect(page.locator('.VPSidebar')).toHaveClass(/open/)
    await page.locator('.VPSidebar').getByRole('link', { name: 'Accordion', exact: true }).click()
    await expect(page.locator('h1')).toHaveText('Accordion')
    await expect(page.locator('.VPSidebar')).not.toHaveClass(/open/)
    await page.screenshot({ path: info.outputPath('mobile-navigation.png') })
    for (const width of [320, 390, 768, 960]) {
      await page.setViewportSize({ width, height: 844 })
      await page.goto(`${prefix}/`)
      await expect(page.locator('.hero-display')).toBeVisible()
      const overflow = await page.evaluate(() => ({
        width: document.documentElement.scrollWidth,
        elements: [...document.querySelectorAll('body *')]
          .filter((element) => element.getBoundingClientRect().right > innerWidth + 1)
          .map((element) => ({
            className: element.className,
            right: element.getBoundingClientRect().right,
          }))
          .slice(0, 12),
      }))
      expect(overflow.width, JSON.stringify(overflow)).toBeLessThanOrEqual(width + 1)
      if (width === 768) {
        await page.locator('.VPNavBarSearch button').click()
        await expect(page.locator('#localsearch-input')).toBeVisible()
        await page.keyboard.press('Escape')
      }
    }
    expect(errors).toEqual([])
  })
}
