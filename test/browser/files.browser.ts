import { expect, test, type Page } from '@playwright/test'

const pixel = {
  name: 'preview.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2ioAAAAASUVORK5CYII=',
    'base64',
  ),
}
async function choose(
  page: Page,
  files: Parameters<import('@playwright/test').FileChooser['setFiles']>[0],
) {
  const pending = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Choose files', exact: true }).click()
  await (await pending).setFiles(files)
}
async function state(page: Page) {
  return JSON.parse(await page.locator('#file-check-state').innerText()) as {
    items: { id: string; name: string; status: string; progress?: number }[]
    picking: boolean
  }
}

test('opens a real picker by keyboard, previews and revokes URLs on removal/reselection', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const urls = new Set<string>()
    Object.defineProperty(window, 'mavisFileURLs', { value: urls })
    const create = URL.createObjectURL.bind(URL)
    const revoke = URL.revokeObjectURL.bind(URL)
    URL.createObjectURL = (source) => {
      const url = create(source)
      urls.add(url)
      return url
    }
    URL.revokeObjectURL = (url) => {
      urls.delete(url)
      revoke(url)
    }
  })
  await page.goto('/playground/#/checks/files')
  const button = page.getByRole('button', { name: 'Choose files', exact: true })
  await button.focus()
  const picker = page.waitForEvent('filechooser')
  await button.press('Enter')
  await (await picker).setFiles(pixel)
  await expect(page.getByText('preview.png', { exact: true })).toBeVisible()
  await expect(button).toBeFocused()
  await expect(page.locator('img[src^="blob:"]')).toBeVisible()
  const id = (await state(page)).items[0]!.id
  await page.getByRole('button', { name: 'Remove: preview.png', exact: true }).click()
  await expect(button).toBeFocused()
  await expect(page.getByText('No files selected', { exact: true })).toBeVisible()
  expect(
    await page.evaluate(
      () => (window as unknown as { mavisFileURLs: Set<string> }).mavisFileURLs.size,
    ),
  ).toBe(0)
  await choose(page, pixel)
  expect((await state(page)).items[0]!.id).not.toBe(id)
  await page.goto('/playground/#/showcase')
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { mavisFileURLs: Set<string> }).mavisFileURLs.size),
    )
    .toBe(0)
})

test('validates actual selected files, preserves selection on cancel and restores focus', async ({
  page,
}) => {
  await page.goto('/playground/#/checks/files')
  await choose(page, 'test/fixtures/files/notes.txt')
  await expect(page.getByText('notes.txt', { exact: true })).toBeVisible()
  const id = (await state(page)).items[0]!.id
  await choose(page, {
    name: 'too-big.txt',
    mimeType: 'text/plain',
    buffer: Buffer.alloc(2049, 'x'),
  })
  await expect(page.getByRole('alert')).toContainText('size limit')
  expect((await state(page)).items[0]!.id).toBe(id)
  await choose(page, {
    name: 'script.js',
    mimeType: 'text/javascript',
    buffer: Buffer.from('test'),
  })
  await expect(page.getByRole('alert')).toContainText('not accepted')
  const pending = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Choose files', exact: true }).click()
  await pending
  await page.locator('input[type="file"]').dispatchEvent('cancel')
  await expect(page.locator('input[type="file"]')).toHaveCount(0)
  expect((await state(page)).items[0]!.id).toBe(id)
  await expect(page.getByRole('button', { name: 'Choose files', exact: true })).toBeFocused()
  await page.getByRole('switch', { name: 'Disable files' }).click()
  await expect(page.getByRole('button', { name: 'Choose files', exact: true })).toBeDisabled()
})

test('supports failed retry, unknown progress, cancellation and late completions after unmount', async ({
  page,
}) => {
  await page.goto('/playground/#/checks/files')
  await choose(page, 'test/fixtures/files/notes.txt')
  await page.getByRole('switch', { name: 'Fail next upload' }).click()
  await page.getByRole('button', { name: 'Upload: notes.txt', exact: true }).click()
  await expect(page.getByText('Fixture upload failed', { exact: true })).toBeVisible()
  await page.getByRole('switch', { name: 'Unknown upload total' }).click()
  await page.getByRole('button', { name: 'Retry: notes.txt', exact: true }).click()
  await expect(page.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow')
  await page.getByRole('button', { name: 'Cancel: notes.txt', exact: true }).click()
  await expect.poll(async () => (await state(page)).items[0]!.status).toBe('cancelled')
  await page.getByRole('switch', { name: 'Unknown upload total' }).click()
  await page.getByRole('switch', { name: 'Allow late completion' }).click()
  await page.getByRole('button', { name: 'Retry: notes.txt', exact: true }).click()
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', /\d+/)
  await page.locator('#file-toggle').click()
  await expect.poll(async () => (await state(page)).items[0]!.status).toBe('cancelled')
  await page.waitForTimeout(2200)
  expect((await state(page)).items[0]!.status).toBe('cancelled')
  await expect(page.locator('#file-check-counts')).toHaveText('Calls: 3; cancellations: 2')
})

test('keeps long names and actions usable at narrow width and large text', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 860 })
  await page.goto('/playground/#/checks/files')
  const name = 'very-long-document-name-for-a-family-holiday-without-truncating-the-file-name.txt'
  await choose(page, { name, mimeType: 'text/plain', buffer: Buffer.from('Readable content') })
  await page.locator('#app').evaluate((element) => {
    element.querySelectorAll<HTMLElement>('p,button,span').forEach((child) => {
      const size = parseFloat(getComputedStyle(child).fontSize)
      child.style.fontSize = `${size * 2}px`
    })
  })
  await expect(page.getByText(name, { exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  )
  await page.getByRole('button', { name: `Remove: ${name}`, exact: true }).click()
  await expect(page.getByText('No files selected', { exact: true })).toBeVisible()
})
