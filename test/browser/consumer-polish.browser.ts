import { test, expect, type Locator } from '@playwright/test'

async function wordLines(label: Locator) {
  return label.evaluate((el) => {
    const text = el.firstChild!
    const range = document.createRange()
    range.selectNodeContents(text)
    return [...range.getClientRects()].filter((rect) => rect.width > 0).map((rect) => rect.y)
  })
}

test('reveals a password without submitting, losing selection or moving keyboard focus', async ({
  page,
  browserName,
}) => {
  await page.goto('/playground/#/checks/forms')
  const field = page.getByLabel('Form password', { exact: true })
  const show = page.getByRole('button', { name: 'Show form password', exact: true })
  await field.fill('abcdefghijkl')
  await field.evaluate((el: HTMLInputElement) => el.setSelectionRange(3, 6))
  await show.click()
  await expect(field).toHaveAttribute('type', 'text')
  await expect(field).toBeFocused()
  expect(
    await field.evaluate((el: HTMLInputElement) => [el.selectionStart, el.selectionEnd]),
  ).toEqual([3, 6])
  await field.pressSequentially('X')
  await expect(field).toHaveValue('abcXghijkl')
  await page.getByRole('button', { name: 'Hide form password', exact: true }).click()
  await expect(field).toHaveAttribute('type', 'password')
  await field.pressSequentially('Y')
  await expect(field).toHaveValue('abcXYghijkl')
  await field.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
  await expect(show).toBeFocused()
  await show.press('Enter')
  const hide = page.getByRole('button', { name: 'Hide form password', exact: true })
  await expect(hide).toBeFocused()
  await hide.press('Space')
  await expect(show).toBeFocused()
  expect(JSON.parse(await page.locator('#form-state').innerText()).submits).toBe(0)
})

test('respects disabled/readonly actions, supports multiline and reserves the touch target', async ({
  page,
}, info) => {
  await page.goto('/playground/#/checks/consumer')
  const field = page.getByLabel('Action password', { exact: true })
  const show = page.getByRole('button', { name: 'Show check password', exact: true })
  for (const state of ['input disabled', 'input readonly', 'action disabled']) {
    await page.getByRole('button', { name: `Toggle ${state}`, exact: true }).click()
    await expect(show).toBeDisabled()
    await show.evaluate((el: HTMLButtonElement) => el.click())
    await expect(field).toHaveAttribute('type', 'password')
    await page.getByRole('button', { name: `Toggle ${state}`, exact: true }).click()
    await expect(show).toBeEnabled()
  }
  await page
    .getByRole('button', { name: 'Clear the entire note without changing the password' })
    .click()
  await expect(page.getByLabel('Action multiline', { exact: true })).toHaveValue('')
  for (const theme of ['light', 'dark']) {
    if (theme === 'dark') await page.getByRole('button', { name: 'Change check theme' }).click()
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 900 })
      const bounds = await show.boundingBox()
      const editor = await field.boundingBox()
      const padding = await field.evaluate((el) => parseFloat(getComputedStyle(el).paddingRight))
      expect(bounds!.width).toBeGreaterThanOrEqual(44)
      expect(bounds!.height).toBeGreaterThanOrEqual(44)
      expect(bounds!.x).toBeGreaterThanOrEqual(editor!.x + editor!.width - padding)
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(editor!.x + editor!.width)
      await field.scrollIntoViewIfNeeded()
      await page.screenshot({ path: info.outputPath(`actions-${theme}-${width}.png`) })
    }
  }
})

test('preserves short choice labels and wraps long labels, tokens and RTL without overflow', async ({
  page,
}, info) => {
  await page.goto('/playground/#/checks/consumer')
  await page.setViewportSize({ width: 320, height: 1000 })
  const group = page.locator('#constrained-choices')
  const labels = [
    group.locator('.m-switch [id]').first(),
    group.locator('.m-checkbox > span:last-child > span').first(),
    group.locator('.m-radio-option > span:last-child > span').first(),
    group.locator('[id$="-value"]'),
  ]
  for (const label of labels) {
    await expect(label).toHaveText('Noite')
    expect(new Set(await wordLines(label)).size).toBe(1)
  }
  for (const dir of ['ltr', 'rtl']) {
    await page.getByRole('main').evaluate((el, dir) => el.setAttribute('dir', dir), dir)
    await group.evaluate((el) => {
      ;(el as HTMLElement).style.width = '180px'
    })
    for (const label of labels) {
      await label.evaluate((el) => {
        ;(el as HTMLElement).style.fontSize = '32px'
      })
      expect(new Set(await wordLines(label)).size).toBe(1)
      await label.evaluate((el) => {
        ;(el as HTMLElement).style.fontSize = ''
      })
    }
    await group.evaluate((el) => {
      ;(el as HTMLElement).style.width = '100px'
    })
    await page.getByRole('button', { name: 'Toggle long labels' }).click()
    expect(await group.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true)
    await page.getByRole('button', { name: 'Toggle long labels' }).click()
    for (const label of labels)
      await label.evaluate((el) => {
        el.textContent = 'Unbroken'.repeat(20)
      })
    expect(await group.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true)
    expect(
      await page.getByRole('main').evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true)
    await page.getByRole('button', { name: 'Toggle long labels' }).click()
    await page.getByRole('button', { name: 'Toggle long labels' }).click()
  }
  await group.scrollIntoViewIfNeeded()
  await page.screenshot({ path: info.outputPath('choices-320.png') })
})

test('uses the Sheet fallback name and updates its title/name while open', async ({ page }) => {
  await page.goto('/playground/#/checks/consumer')
  await page.getByRole('button', { name: 'Open named sheet' }).click()
  const sheet = page.getByRole('dialog', { name: 'Account actions' })
  await expect(sheet).toBeVisible()
  await expect(sheet.getByRole('heading')).toHaveCount(0)
  await sheet.getByRole('button', { name: 'Add sheet heading' }).click()
  await expect(page.getByRole('dialog', { name: 'Updated heading' })).toBeVisible()
  await page.getByRole('button', { name: 'Use sheet label' }).click()
  await expect(page.getByRole('dialog', { name: 'Updated label' })).toBeVisible()
  await expect(page.getByRole('dialog').getByRole('heading')).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
})
