import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { checkSheetName } from '../packages/core/src/sheet.js'
import { MSheet } from '../packages/web/src/index.js'

describe('Sheet name', () => {
  it('prefers a trimmed title and falls back to a nonempty label', () => {
    expect(checkSheetName(' Title ', ' Label ')).toBe('Title')
    expect(checkSheetName(' \n\t ', ' Label ')).toBe('Label')
    expect(checkSheetName('Title', '   ')).toBe('Title')
    for (const title of [undefined, '', ' \n\t ']) {
      for (const label of [undefined, '', ' \n\t ']) {
        expect(() => checkSheetName(title, label)).toThrow(RangeError)
      }
    }
  })

  it('validates closed sheets during SSR and emits a trimmed fallback name', async () => {
    await expect(
      renderToString(createSSRApp({ render: () => h(MSheet, { title: '   ', open: false }) })),
    ).rejects.toThrow(RangeError)
    const html = await renderToString(
      createSSRApp({
        render: () => h(MSheet, { title: ' \t ', accessibilityLabel: ' Account ', open: false }),
      }),
    )
    expect(html).toContain('aria-label="Account"')
    expect(html).not.toContain('aria-labelledby=')
  })
})
