import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync } from 'node:fs'

test('PIN keeps a single editor, normalizes paste and completes only on input', async ({
  page,
}) => {
  await page.goto('/playground/#/preview/pin-input?lang=en')
  const editor = page.getByRole('textbox', { name: 'Verification code', exact: true })
  await expect(editor).toHaveAttribute('autocomplete', 'one-time-code')
  await page.getByRole('button', { name: 'Try a pasted code' }).click()
  await expect(editor).toHaveValue('012345')
  await expect(page.locator('#pin-complete')).toHaveText('—')
  await editor.fill('０１ ２-３４５')
  await editor.fill('098765')
  await expect(editor).toHaveValue('098765')
  await expect(page.locator('#pin-complete')).toHaveText('098765')
  for (let i = 0; i < 6; i++) await editor.press('ArrowLeft')
  await editor.press('Delete')
  await expect(editor).toHaveValue('98765')
  await page.getByRole('switch', { name: 'Disable input' }).click()
  await expect(editor).toBeDisabled()
})

test('composer preserves multiline drafts, removes attachments and submits one snapshot', async ({
  page,
}) => {
  await page.goto('/playground/#/preview/composer?lang=en')
  const field = page.getByRole('textbox', { name: 'Your message', exact: true })
  await field.fill('Take the long way')
  await field.press('Enter')
  await field.press('End')
  await expect(page.locator('#composer-sent')).toHaveText('0')
  await page.getByRole('button', { name: 'Add attachment', exact: true }).click()
  await expect(field).toHaveValue('Take the long way\n')
  await page
    .getByRole('button', { name: 'Remove attachment: field-notes-1.pdf', exact: true })
    .click()
  await expect(page.getByText('field-notes-1.pdf', { exact: true })).toHaveCount(0)
  await field.press('Control+Enter')
  await expect(page.locator('#composer-sent')).toHaveText('1')
  await expect(field).toHaveValue('')
  await expect(page.getByRole('button', { name: 'Send message', exact: true })).toBeDisabled()
})

test('speed dial restores focus, respects disabled actions and preserves application selection', async ({
  page,
}) => {
  await page.goto('/playground/#/preview/speed-dial?lang=en')
  const trigger = page.getByRole('button', { name: 'Create something', exact: true })
  await trigger.click()
  const panel = page.getByRole('dialog', { name: 'Create something', exact: true })
  await expect(panel).toBeVisible()
  await expect(panel.getByRole('button', { name: 'Publish', exact: true })).toBeDisabled()
  await panel.getByRole('button', { name: 'Write a note', exact: true }).click()
  await expect(page.locator('#dial-selection')).toHaveText('note')
  await expect(trigger).toBeFocused()
  await trigger.click()
  await page.keyboard.press('Escape')
  await expect(panel).not.toBeVisible()
  await expect(trigger).toBeFocused()
})

test('refresh cancels stale updates, recovers after errors and remains operable by button', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/playground/#/preview/refresh-control?lang=en')
  const refresh = page.getByRole('button', { name: 'Refresh', exact: true })
  await expect(refresh).toBeEnabled()
  await refresh.click()
  await page.getByRole('button', { name: 'Cancel refresh', exact: true }).click()
  await expect(page.locator('#refresh-edition')).toHaveText('Edition 1')
  await refresh.click()
  await expect(page.locator('#refresh-edition')).toHaveText('Edition 2')
  await page.getByRole('switch', { name: 'Simulate offline', exact: true }).click()
  await refresh.click()
  await expect(page.getByRole('status')).toHaveText('Offline. Your stories are still here.')
  await page.getByRole('switch', { name: 'Simulate offline', exact: true }).click()
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(page.locator('#refresh-edition')).toHaveText('Edition 3')
  expect(errors).toEqual([])
})

test('header follows its own scroll region and remeasures without losing content', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/playground/#/preview/collapsible-header?lang=en')
  const scroll = page.getByRole('region', { name: 'Above the everyday.', exact: true })
  await expect(scroll.locator('[data-jolt-header-spacer]')).toHaveCount(1)
  await scroll.evaluate((el) => {
    el.scrollTop = 300
    el.dispatchEvent(new Event('scroll'))
  })
  await expect.poll(() => scroll.evaluate((el) => el.scrollTop)).toBeGreaterThan(200)
  const titles = page.getByText('Above the everyday.', { exact: true })
  await expect(titles).toHaveCount(2)
  await expect.poll(() => titles.last().getAttribute('aria-hidden')).toBe('false')
  await page.getByRole('button', { name: 'Back to top', exact: true }).click()
  await expect.poll(() => scroll.evaluate((el) => el.scrollTop)).toBeLessThan(2)
  await page.getByRole('button', { name: 'Change header size', exact: true }).click()
  await expect(scroll.locator('[data-jolt-header-spacer]')).toHaveCount(1)
  await expect(scroll.getByText('A place to return', { exact: true })).toHaveCount(1)
  expect(errors).toEqual([])
})

test('text replacement and replay settle to canonical text with reduced motion', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/playground/#/preview/animated-text?lang=en')
  await page.getByRole('button', { name: 'Next phrase', exact: true }).click({ clickCount: 2 })
  await page.getByRole('button', { name: 'Replay', exact: true }).click()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('button', { name: 'Next phrase', exact: true }).click()
  await expect(page.locator('#animated-phrase')).toHaveText('Make room for wonder.')
  expect(errors).toEqual([])
})

for (const width of [320, 1440])
  test(`screen previews fit ${width}px with accessible controls`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    mkdirSync('artifacts/screen-components', { recursive: true })
    for (const name of [
      'collapsible-header',
      'refresh-control',
      'composer',
      'speed-dial',
      'pin-input',
      'animated-text',
    ]) {
      await page.goto(`/playground/#/preview/${name}?lang=en`)
      await expect(page.locator('[data-testid="component-preview"]')).toBeVisible()
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        .toBe(true)
      const audit = await new AxeBuilder({ page })
        .include('[data-testid="component-preview"]')
        .analyze()
      expect(audit.violations, name).toEqual([])
      await page.screenshot({
        path: `artifacts/screen-components/${info.project.name}-${name}-${width}.png`,
        fullPage: true,
      })
    }
    expect(errors).toEqual([])
  })

test('pull gesture refreshes at the top and disabling cancels pending updates', async ({
  page,
}) => {
  await page.goto('/playground/#/preview/refresh-control?lang=en')
  const scroll = page.getByRole('region', { name: 'Your morning edition', exact: true })
  await expect(page.getByRole('button', { name: 'Refresh', exact: true })).toBeEnabled()
  const box = (await scroll.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + 165)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2, box.y + 350, { steps: 14 })
  await page.mouse.up()
  await expect(page.locator('#refresh-edition')).toHaveText('Edition 2')
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await page.getByRole('switch', { name: 'Pause updates', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Refresh', exact: true })).toBeDisabled()
  await page.getByRole('switch', { name: 'Pause updates', exact: true }).click()
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await expect(page.locator('#refresh-edition')).toHaveText('Edition 3')
})

test('Portuguese dark previews retain contrast and clean up interrupted motion', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  for (const name of [
    'collapsible-header',
    'refresh-control',
    'composer',
    'speed-dial',
    'pin-input',
    'animated-text',
  ]) {
    await page.goto(`/playground/#/preview/${name}?lang=pt&theme=midnight`)
    const preview = page.locator('[data-testid="component-preview"]')
    await expect(preview).toBeVisible()
    if (name === 'speed-dial')
      await page.getByRole('button', { name: 'Criar algo', exact: true }).click()
    const audit = await new AxeBuilder({ page })
      .include('[data-testid="component-preview"]')
      .analyze()
    expect(audit.violations, name).toEqual([])
    await page.screenshot({
      path: `artifacts/screen-components/${info.project.name}-${name}-pt-dark.png`,
      fullPage: true,
    })
    if (name === 'refresh-control')
      await page.getByRole('button', { name: 'Atualizar', exact: true }).click()
    if (name === 'animated-text')
      await page.getByRole('button', { name: 'Repetir', exact: true }).click()
  }
  await page.goto('/playground/#/preview/pin-input?lang=en')
  await expect(page.getByRole('textbox', { name: 'Verification code', exact: true })).toBeVisible()
  expect(errors).toEqual([])
})
