import { describe, expect, it, vi } from 'vitest'
import { h, createSSRApp, ref, nextTick } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { MInput, createMavis } from '../packages/web/src/index.js'
import { validateInput } from '../packages/core/src/input.js'
import { renderer, node, find, fire } from './renderer.js'

describe('text input contract', () => {
  it('keeps a once handler in charge of Enter until the listener is removed', async () => {
    const once = vi.fn()
    const enabled = ref(true)
    const root = node('root')
    const app = renderer
      .createApp({
        render: () =>
          h(MInput, { label: 'Action', onSubmitOnce: enabled.value ? once : undefined }),
      })
      .use(createMavis())
    app.mount(root)
    try {
      const field = find(root, 'input')
      Object.assign(field, { form: {} })
      const press = () => {
        const preventDefault = vi.fn()
        fire(field, 'onKeydown', { key: 'Enter', target: { value: 'Action' }, preventDefault })
        return preventDefault
      }
      expect(press()).toHaveBeenCalledOnce()
      expect(press()).toHaveBeenCalledOnce()
      expect(once.mock.calls).toEqual([['Action']])
      enabled.value = false
      await nextTick()
      expect(press()).not.toHaveBeenCalled()
    } finally {
      app.unmount()
    }
  })
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

  it('renders HTML editor attributes during SSR without replacing model, label or error state', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(MInput, {
            id: 'email',
            label: 'Email',
            modelValue: 'controlled@example.com',
            type: 'email',
            name: 'email',
            autocomplete: 'email',
            required: true,
            inputmode: 'email',
            form: 'account',
            class: 'outer',
            error: 'Review email',
            'aria-invalid': false,
            'aria-describedby': 'policy email-message policy',
            'aria-controls': 'suggestions',
          }),
      }),
    )
    const wrapper = html.match(/^<div[^>]*>/)![0]
    const editor = html.match(/<input[^>]*>/)![0]
    expect(wrapper).toContain('class="m-input outer"')
    expect(wrapper).not.toMatch(/\b(?:name|autocomplete|required|aria-controls)=/)
    expect(editor).toContain('name="email"')
    expect(editor).toContain('autocomplete="email"')
    expect(editor).toContain('required')
    expect(editor).toContain('inputmode="email"')
    expect(editor).toContain('form="account"')
    expect(editor).toContain('value="controlled@example.com"')
    expect(editor).toContain('aria-invalid="true"')
    expect(editor).toContain('aria-describedby="policy email-message"')
    expect(html).toContain('<label for="email"')
  })
})
