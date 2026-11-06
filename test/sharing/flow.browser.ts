import { test, expect, type Page } from '@playwright/test'

async function navigateWithManifest(page: Page, mode: string, navigate: () => Promise<unknown>) {
  if (mode === 'spa') {
    await navigate()
    return
  }
  // Nuxt fetches its manifest after hydration. Complete and validate that real
  // request before a later reload can abort it and report a WebKit access error.
  const [manifest] = await Promise.all([
    page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.origin === new URL(page.url()).origin &&
        /\/_nuxt\/builds\/meta\/[^/]+\.json$/.test(url.pathname)
      )
    }),
    navigate(),
  ])
  expect(manifest.ok()).toBe(true)
  const buildId = new URL(manifest.url()).pathname
    .split('/')
    .at(-1)!
    .replace(/\.json$/, '')
  expect(await manifest.json()).toMatchObject({ id: buildId })
}

test('one shared search/detail/edit flow preserves drafts, errors and persistence', async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await navigateWithManifest(page, info.project.metadata.mode, () => page.goto('/'))
  await expect(page.getByRole('heading', { name: 'Community directory' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Search places' }).fill('Porto')
  await expect(page.getByText('2 places found')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Open Open library' })).toHaveCount(0)
  await page.getByRole('link', { name: 'Open Community garden', exact: true }).click()
  await expect(page).toHaveURL(/\/entries\/garden\/?$/)
  await page.getByRole('link', { name: 'Edit place', exact: true }).click()
  await expect(page).toHaveURL(/\/entries\/garden\/edit\/?$/)
  const input = page.getByRole('textbox', { name: 'Place name' })
  await expect(input).toHaveValue('Community garden')
  await input.fill('Garden for everyone')
  await page.evaluate(() => {
    const write = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === 'mavis:directory') {
        Storage.prototype.setItem = write
        throw new Error('Test storage failure')
      }
      return write.call(this, key, value)
    }
  })
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('Could not save. Your draft is still here; try again.')).toBeVisible()
  await expect(input).toHaveValue('Garden for everyone')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('Changes saved.')).toBeVisible()
  await page.getByRole('link', { name: 'Place details' }).click()
  await expect(page.getByRole('heading', { name: 'Garden for everyone' })).toBeVisible()
  await page.getByRole('link', { name: 'All places' }).click()
  await expect(page.getByRole('textbox', { name: 'Search places' })).toHaveValue('Porto')
  await expect(page.getByRole('link', { name: 'Open Garden for everyone' })).toBeVisible()
  await navigateWithManifest(page, info.project.metadata.mode, () => page.reload())
  await expect(page.getByRole('link', { name: 'Open Garden for everyone' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Search places' }).fill('No match anywhere')
  await expect(page.getByText('No places found', { exact: true })).toBeVisible()
  await page.screenshot({ path: info.outputPath('directory-empty.png'), fullPage: true })
  expect(errors).toEqual([])
})

test('direct route, responsive grid and keyboard navigation', async ({ page, request }, info) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  if (info.project.metadata.mode !== 'spa') {
    const response = await request.get('/entries/library/edit')
    expect(response.ok()).toBe(true)
    expect(await response.text()).toContain('Place name')
  }
  await navigateWithManifest(page, info.project.metadata.mode, () =>
    page.goto('/entries/library/edit'),
  )
  await expect(page.getByRole('textbox', { name: 'Place name' })).toHaveValue('Open library')
  await navigateWithManifest(page, info.project.metadata.mode, () => page.goto('/'))
  await page.setViewportSize({ width: 1000, height: 900 })
  const cards = page.locator('.m-grid > .m-card')
  await expect(cards).toHaveCount(3)
  await expect
    .poll(async () =>
      cards.evaluateAll((elements) =>
        Math.abs(elements[0]!.getBoundingClientRect().y - elements[1]!.getBoundingClientRect().y),
      ),
    )
    .toBeLessThan(1)
  await page.setViewportSize({ width: 360, height: 844 })
  await expect
    .poll(async () =>
      cards.evaluateAll(
        (elements) =>
          elements[1]!.getBoundingClientRect().y > elements[0]!.getBoundingClientRect().y + 20,
      ),
    )
    .toBe(true)
  await expect(page.locator('html')).toHaveJSProperty('scrollWidth', 360)
  const garden = page.getByRole('link', { name: 'Open Community garden' })
  await garden.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Community garden' })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Community directory' })).toBeVisible()
  await expect
    .poll(async () =>
      cards.evaluateAll(
        (elements) =>
          elements[1]!.getBoundingClientRect().y > elements[0]!.getBoundingClientRect().y + 20,
      ),
    )
    .toBe(true)
  await page.screenshot({ path: info.outputPath('directory.png'), fullPage: true })
  expect(errors).toEqual([])
})
