import { describe, expect, it } from 'vitest'
import { h, createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { MInput } from '../packages/web/src/index.js'
import { validateInput } from '../packages/core/src/input.js'

describe('text input contract', () => {
  it('rejects invalid limits and prevents password fields from becoming plain textareas', () => {
    for (const options of [
      { rows: 0 },
      { rows: 1.5 },
      { maxLength: -1 },
      { maxLength: Infinity },
      { maxLength: 2147483648 },
      { multiline: true, type: 'password' },
    ]) {
      expect(() => validateInput({ rows: 3, multiline: false, type: 'text', ...options })).toThrow(
        RangeError,
      )
    }
    expect(() =>
      validateInput({ rows: 1, multiline: true, type: 'text', maxLength: 0 }),
    ).not.toThrow()
  })

  it('renders stable distinct label/message associations during SSR and prefers errors to help', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h('div', [
            h(MInput, { label: 'Email', helperText: 'Help', error: 'Fix email' }),
            h(MInput, { label: 'Bio', multiline: true, modelValue: 'one\ntwo' }),
          ]),
      }),
    )
    const ids = [...html.matchAll(/<label for="([^"]+)"/g)].map((match) => match[1])
    expect(new Set(ids).size).toBe(2)
    expect(html).toContain(`aria-describedby="${ids[0]}-message"`)
    expect(html).toContain(`id="${ids[0]}-message"`)
    expect(html).toContain('aria-invalid="true"')
    expect(html).toContain('Fix email')
    expect(html).not.toContain('>Help<')
    expect(html).toContain('one\ntwo</textarea>')
  })
})
