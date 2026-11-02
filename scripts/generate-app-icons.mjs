import { chromium } from '@playwright/test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

// Keep the launcher artwork on the same vector source as the existing Mavis mark.
const original = await readFile('docs/public/favicon.svg', 'utf8')
const colors = { AppIcon: '#B83670', MavisMidnight: '#251E32', MavisAzure: '#4262C4' }
const sizes = [
  ...[20, 29, 40, 60].flatMap((size) => [2, 3].map((scale) => ({ idiom: 'iphone', size, scale }))),
  ...[20, 29, 40, 76].flatMap((size) => [1, 2].map((scale) => ({ idiom: 'ipad', size, scale }))),
  { idiom: 'ipad', size: 83.5, scale: 2 }, { idiom: 'ios-marketing', size: 1024, scale: 1 },
]
const browser = await chromium.launch()
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 })
  for (const [name, color] of Object.entries(colors)) {
    const directory = `examples/catalog/App_Resources/iOS/Assets.xcassets/${name}.appiconset`
    await mkdir(directory, { recursive: true })
    const rendered = new Set()
    for (const { size, scale } of sizes) {
      const pixels = size * scale
      if (rendered.has(pixels)) continue
      rendered.add(pixels)
      await page.setViewportSize({ width: pixels, height: pixels })
      await page.setContent(`<style>html,body{margin:0;background:${color}}svg{display:block;width:100vw;height:100vh}</style>${original.replace('#b44468', color)}`)
      await page.screenshot({ path: `${directory}/icon-${pixels}.png`, omitBackground: false })
    }
    await writeFile(`${directory}/Contents.json`, JSON.stringify({ images: sizes.map(({ idiom, size, scale }) => ({ idiom, size: `${size}x${size}`, scale: `${scale}x`, filename: `icon-${size * scale}.png` })), info: { version: 1, author: 'xcode' } }, null, 2) + '\n')
  }
} finally { await browser.close() }
const drawable = 'examples/catalog/App_Resources/Android/src/main/res/drawable'
await mkdir(drawable, { recursive: true })
for (const [name, color] of Object.entries(colors)) {
  const id = name === 'AppIcon' ? 'ic_mavis' : name === 'MavisMidnight' ? 'ic_mavis_midnight' : 'ic_mavis_azure'
  await writeFile(`${drawable}/${id}.xml`, `<?xml version="1.0" encoding="utf-8"?>\n<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="48dp" android:height="48dp" android:viewportWidth="48" android:viewportHeight="48">\n  <path android:fillColor="${color}" android:pathData="M0,0h48v48h-48z" />\n  <path android:fillColor="#FFF9F3" android:pathData="M11,34V15h6l7,10 7,-10h6v19h-6V24l-7,10 -7,-10v10Z" />\n  <path android:fillColor="#A8D8EF" android:pathData="M34,10l6,-2 -2,6Z" />\n</vector>\n`)
}
