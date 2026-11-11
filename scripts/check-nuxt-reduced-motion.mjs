import assert from 'node:assert/strict'
import { chromium, webkit, expect } from '@playwright/test'

export async function checkNuxtReducedMotion(origin, mode) {
  const route = mode === 'ssg' ? '/reduced-motion-static/' : '/reduced-motion/'
  const html = await (await fetch(`${origin}${route}`)).text()
  for (const text of ['Reduced motion by region', 'Always reduced', 'Follows its policy'])
    assert(html.includes(text), `${mode}: readable initial reduced-motion content`)
  assert(!html.includes('[object Object]'), `${mode}: no runtime identities in attributes`)
  const results = []
  for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
    const browser = await launcher.launch()
    try {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
      const errors = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('console', (message) => {
        if (message.type() === 'error' || /hydration/i.test(message.text()))
          errors.push(message.text())
      })
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await page.goto(`${origin}${route}`)
      await expect(page.locator('#open .m-chart-plot rect').first()).toBeVisible()
      const read = () =>
        page.evaluate(() =>
          Object.fromEntries(
            ['calm', 'open'].map((id) => [
              id,
              Number(document.querySelector(`#${id} .m-chart-plot rect`).getAttribute('height')),
            ]),
          ),
        )
      const settled = async () => {
        await expect
          .poll(async () => {
            const first = JSON.stringify(await read())
            await page.waitForTimeout(120)
            return first === JSON.stringify(await read())
          })
          .toBe(true)
        return read()
      }
      // Three frames after the change: reduced regions are already at their final geometry.
      const after = async () => {
        await page.evaluate(async () => {
          document.getElementById('week').click()
          await new Promise((resolve) =>
            requestAnimationFrame(() =>
              requestAnimationFrame(() => requestAnimationFrame(resolve)),
            ),
          )
        })
        return read()
      }
      // Hydration attaches the regions; the first settled read follows it.
      await settled()
      let step = await after()
      let end = await settled()
      assert.equal(step.calm, end.calm, 'The always-reduced region settles at once')
      assert.notEqual(step.open, end.open, 'The other region animates under no preference')
      await page.emulateMedia({ reducedMotion: 'reduce' })
      step = await after()
      end = await settled()
      assert.equal(step.open, end.open, 'The user policy follows the system')
      await page.getByRole('button', { name: 'Never', exact: true }).click()
      step = await after()
      end = await settled()
      assert.notEqual(step.open, end.open, 'Never keeps motion under a reducing system')
      assert.equal(step.calm, end.calm, 'The always-reduced region is unaffected')
      assert.deepEqual(errors, [], `${engine} ${mode}: reduced-motion hydration`)
      results.push({
        engine,
        mode,
        test: 'reduced motion by region: system, always and never',
        passed: true,
      })
    } finally {
      await browser.close()
    }
  }
  return results
}
