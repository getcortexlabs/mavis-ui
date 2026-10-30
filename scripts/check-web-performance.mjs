import { chromium, webkit } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { platform, arch, cpus } from 'node:os'
import { validateReport } from '../test/performance/report.ts'
import { setTimeout } from 'node:timers/promises'

const [name = 'web', url = 'http://127.0.0.1:4174/playground/'] = process.argv.slice(2)
if (!/^[\w-]+$/.test(name)) throw new Error('Invalid run name')
const output = resolve(import.meta.dirname, '../artifacts/performance', name)
mkdirSync(output, { recursive: true })
const deadline = Date.now() + 15_000
while (true) {
  try {
    if ((await fetch(url, { signal: AbortSignal.timeout(2000) })).ok) break
  } catch {
    /* The CI preview server may still be starting. */
  }
  if (Date.now() >= deadline) throw new Error(`Preview server unavailable: ${url}`)
  await setTimeout(250)
}
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch()
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    page.on('pageerror', (error) => console.error(error))
    await page.exposeFunction('mavisPerformancePress', async (down) => {
      if (down) {
        const button = page.locator('#performance-press')
        await button.scrollIntoViewIfNeeded()
        const rect = await button.boundingBox()
        await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2)
        await page.mouse.down()
      } else await page.mouse.up()
    })
    await page.goto(`${url}#/checks/performance`)
    await page.waitForFunction(
      () => window.mavisPerformance?.complete || window.mavisPerformance?.error,
      null,
      { timeout: 180_000 },
    )
    const report = await page.evaluate(() => window.mavisPerformance)
    report.environment.browserVersion = browser.version()
    report.environment.host = { platform: platform(), arch: arch(), cpu: cpus()[0]?.model }
    writeFileSync(resolve(output, `${engine}.json`), JSON.stringify(report, null, 2))
    if (report.error) throw new Error(report.error)
    validateReport(report)
    console.log(`${engine}: ${Object.keys(report.samples).length} measurements`)
  } finally {
    await browser.close()
  }
}
