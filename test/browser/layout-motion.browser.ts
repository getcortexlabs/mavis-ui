import { expect, test } from '@playwright/test'

for (const parallax of [0.5, 0]) {
  test(`header subtitle paints above opaque artwork (parallax ${parallax})`, async ({
    page,
  }, info) => {
    await page.goto('/playground/#/checks/header-clip?lang=en')
    if (!parallax) await page.getByRole('button', { name: 'Disable parallax' }).click()
    const frame = page.locator('#clip-header')
    const scroll = frame.getByRole('region', { name: 'Clipping specimen', exact: true })
    await expect(scroll.locator('[data-jolt-header-spacer]')).toHaveCount(1)
    const subtitle = frame.getByText('Visible above opaque artwork', { exact: true })
    const hits = (undo = false) =>
      subtitle.evaluate((text, undo) => {
        const group = text.parentElement!
        const art = document.querySelector<HTMLElement>('#clip-art')!
        const original: [string, string, string, string] = [
          group.style.position,
          group.style.zIndex,
          art.style.pointerEvents,
          text.style.pointerEvents,
        ]
        try {
          if (undo) {
            group.style.position = 'static'
            group.style.zIndex = 'auto'
          }
          art.style.pointerEvents = text.style.pointerEvents = 'auto'
          const box = text.getBoundingClientRect()
          const elements = document.elementsFromPoint(
            box.left + box.width / 2,
            box.top + box.height / 2,
          )
          return { text: elements.indexOf(text), art: elements.indexOf(art), top: box.top }
        } finally {
          ;[
            group.style.position,
            group.style.zIndex,
            art.style.pointerEvents,
            text.style.pointerEvents,
          ] = original
        }
      }, undo)
    for (const offset of [0, 48]) {
      await scroll.evaluate((el, offset) => {
        el.scrollTop = offset
      }, offset)
      await expect
        .poll(async () => {
          const result = await hits()
          return result.text >= 0 && result.art > result.text
        })
        .toBe(true)
      const before = await hits(true)
      expect(before.art).toBeGreaterThanOrEqual(0)
      expect(before.text).toBeGreaterThan(before.art)
      await info.attach(`subtitle-${offset}`, {
        body: await frame.screenshot(),
        contentType: 'image/png',
      })
    }
  })
}

test('fixed MBox layers start inside padding and decorative overlays pass input', async ({
  page,
}, info) => {
  await page.goto('/playground/#/checks/touch')
  await expect(page.locator('#touch-box')).toBeVisible()
  const box = (await page.locator('#touch-box').boundingBox())!
  for (const [id, width, height] of [
    ['touch-fixed', 60, 30],
    ['touch-percent', 92, 10],
    ['touch-fill', 184, 84],
  ] as const) {
    const child = (await page.locator('#' + id).boundingBox())!
    expect(child.x).toBeCloseTo(box.x + 8, 0)
    expect(child.y).toBeCloseTo(box.y + 8, 0)
    expect(child.width).toBeCloseTo(width, 0)
    expect(child.height).toBeCloseTo(height, 0)
  }
  await page.locator('#touch-under').click()
  await expect(page.locator('#touch-count')).toHaveText('Underneath 1')
  await page.locator('#touch-replace').click()
  await page.locator('#touch-under').click()
  await expect(page.locator('#touch-count')).toHaveText('Underneath 2')
  await page.locator('#touch-overlay-action').click()
  await expect(page.locator('#touch-overlay-action')).toHaveText('Overlay 1')
  await info.attach('fixed-layers-and-plain-text', {
    body: await page.screenshot(),
    contentType: 'image/png',
  })
  await page.locator('#touch-bottom').click()
  await expect(page.locator('#touch-bottom-count')).toHaveText('Bottom 1')
})
