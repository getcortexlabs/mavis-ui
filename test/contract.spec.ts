import { afterEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick, ref, provide, type App, type Component } from 'vue'
import * as native from '../packages/nativescript/src/vue/index.js'
import * as web from '../packages/web/src/index.js'
import { mavis, midnight } from '../packages/core/src/index.js'
import { layoutDirection } from '@getcortexlabs/mavis-core/vue'
import { renderer, node, find, fire, type TestNode } from './renderer.js'

vi.mock('@nativescript/core', () => ({
  isAndroid: true,
}))
vi.mock('@rafaelaugusto/jolt', () => ({ press: () => () => {} }))
vi.mock('@rafaelaugusto/jolt/vue', async () => ({
  JoltTransition: (await import('vue')).BaseTransition,
}))
vi.mock('vue', async (original) => {
  const vue = await original<typeof import('vue')>()
  return { ...vue, Transition: vue.BaseTransition }
})

const apps: App[] = []
afterEach(() => {
  for (const app of apps.splice(0)) app.unmount()
})

function byId(root: TestNode, id: string): TestNode {
  if (root.props.id === id) return root
  for (const child of root.children) {
    try {
      return byId(child, id)
    } catch {
      /* Try the next subtree. */
    }
  }
  throw new Error(`Missing ${id}`)
}

for (const [name, ui, tags] of [
  [
    'NativeScript',
    native,
    { button: 'MavisButton', text: 'MavisLabel', slider: 'MavisSlider', screen: 'Page' },
  ],
  ['Web', web, { button: 'button', text: 'p', slider: 'input', screen: 'main' }],
] as const) {
  const isNative = name === 'NativeScript'
  function mount(component: Component) {
    const root = node('root')
    const app = renderer.createApp(component)
    app.use(ui.createMavis())
    app.mount(root)
    apps.push(app)
    return root
  }
  const text = (el: TestNode) => (isNative ? el.props.text : el.text)
  const style = (el: TestNode) => el.props.style as Record<string, unknown>

  describe(`${name} shared component contract`, () => {
    it('preserves text edits and external resets without coercion or duplicate updates', async () => {
      const value = ref('001.20')
      const readonly = ref(false)
      const changes = vi.fn()
      const root = mount({
        render: () =>
          h(ui.MInput, {
            modelValue: value.value,
            label: 'Amount',
            readonly: readonly.value,
            maxLength: 12,
            'onUpdate:modelValue': (next: string) => {
              changes(next)
              value.value = next
            },
          }),
      })
      const field = find(root, isNative ? 'MavisTextField' : 'input')
      Object.assign(field, { nativeView: { dismissSoftInput: vi.fn() } })
      const edit = (value: string) =>
        fire(
          field,
          isNative ? 'onTextChange' : 'onInput',
          isNative ? { value } : { target: { value } },
        )
      for (const next of ['001.', '  São 日本  ', '']) {
        edit(next)
        await nextTick()
        expect(value.value).toBe(next)
        edit(next)
      }
      expect(changes.mock.calls).toEqual([['001.'], ['  São 日本  '], ['']])
      value.value = 'External text longer than maxLength'
      await nextTick()
      expect(field.props[isNative ? 'text' : 'value']).toBe(value.value)
      expect(changes).toHaveBeenCalledTimes(3)
      readonly.value = true
      await nextTick()
      edit('Rejected')
      expect(changes).toHaveBeenCalledTimes(3)
    })

    it('submits only single-line edits outside composition and keeps newline editing separate', async () => {
      const multiline = ref(false)
      const submit = vi.fn()
      const root = mount({
        render: () =>
          h(ui.MInput, { label: 'Message', multiline: multiline.value, onSubmit: submit }),
      })
      const field = find(root, isNative ? 'MavisTextField' : 'input')
      if (isNative) {
        fire(field, 'onReturnPress', { object: { text: '文', ios: { markedTextRange: {} } } })
        fire(field, 'onReturnPress', { object: { text: '文' } })
      } else {
        fire(field, 'onKeydown', { key: 'Enter', isComposing: true, target: { value: '文' } })
        fire(field, 'onKeydown', { key: 'Enter', preventDefault() {}, target: { value: '文' } })
      }
      expect(submit.mock.calls).toEqual([['文']])
      multiline.value = true
      await nextTick()
      const area = find(root, isNative ? 'MavisTextView' : 'textarea')
      fire(
        area,
        isNative ? 'onReturnPress' : 'onKeydown',
        isNative ? { object: { text: 'one\ntwo' } } : { key: 'Enter' },
      )
      expect(submit).toHaveBeenCalledOnce()
    })

    it('uses the same action defaults, explicit text precedence and payload-free events', async () => {
      const loading = ref(false)
      const label = ref('Confirmar escolha')
      const click = vi.fn()
      let setTheme!: (theme: typeof mavis) => void
      const root = mount({
        setup() {
          setTheme = ui.useMavisTheme().setTheme
          return () =>
            h(
              ui.MButton,
              {
                text: '',
                loading: loading.value,
                loadingText: 'Aguarde…',
                accessibilityLabel: label.value,
                id: 'action',
                style: { opacity: 0.8 },
                onClick: click,
              },
              { default: () => 'Ignored slot' },
            )
        },
      })
      const button = find(root, tags.button)
      expect(text(button)).toBe('')
      expect(style(button)).toMatchObject({ backgroundColor: mavis.colors.primary, opacity: 0.8 })
      expect(button.props[isNative ? 'accessibilityLabel' : 'aria-label']).toBe(label.value)
      fire(button, isNative ? 'onTap' : 'onClick', { platformEvent: true })
      expect(click.mock.calls).toEqual([[]])
      loading.value = true
      setTheme(midnight)
      await nextTick()
      expect(text(button)).toBe('Aguarde…')
      expect(button.props[isNative ? 'isEnabled' : 'disabled']).toBe(false)
      if (!isNative) expect(button.props['aria-disabled']).toBe(true)
      expect(style(button).backgroundColor).toBe(midnight.colors.primary)
      fire(button, isNative ? 'onTap' : 'onClick')
      expect(click).toHaveBeenCalledOnce()
      label.value = 'Nova ação'
      await nextTick()
      expect(button.props[isNative ? 'accessibilityLabel' : 'aria-label']).toBe('Nova ação')
    })

    it('keeps row/column defaults and explicit geometry consistent', () => {
      const root = mount({
        render: () =>
          h(
            ui.MColumn,
            { id: 'column', padding: 'lg', paddingX: 0 },
            {
              default: () =>
                h(
                  ui.MRow,
                  { id: 'row', gap: 'sm', wrap: true, width: '50%' },
                  {
                    default: () => h(ui.MText, { id: 'text', grow: 1, text: 'Content' }),
                  },
                ),
            },
          ),
      })
      expect(style(byId(root, 'column'))).toMatchObject({
        flexDirection: 'column',
        alignItems: 'stretch',
        flexShrink: 0,
      })
      expect(style(byId(root, 'column'))[isNative ? 'paddingLeft' : 'padding']).toBe(
        isNative ? 0 : '24px 0px',
      )
      expect(style(byId(root, 'row'))).toMatchObject({
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        width: '50%',
      })
      expect(style(byId(root, 'text'))).toMatchObject({ flexGrow: 1, flexShrink: 1 })
    })

    it('forwards root attributes and styles without leaking Mavis props', async () => {
      const hidden = ref(true)
      const root = mount({
        render: () =>
          h(
            ui.MBox,
            {
              id: 'box',
              class: 'consumer',
              radius: 0,
              height: 100,
              backgroundColor: '#112233',
              accessibilityLabel: 'Layer',
              accessibilityHidden: hidden.value,
              style: { opacity: 0.7 },
            },
            { default: () => h(ui.MText, { text: 'Layer' }) },
          ),
      })
      const box = byId(root, 'box')
      expect(box.props.class).toContain('consumer')
      expect(style(box)).toMatchObject({
        opacity: 0.7,
        backgroundColor: '#112233',
        borderRadius: isNative ? 0 : '0px',
      })
      expect(box.props[isNative ? 'accessibilityHidden' : 'aria-hidden']).toBe(true)
      expect(box.props.radius).toBeUndefined()
      hidden.value = false
      await nextTick()
      expect(box.props[isNative ? 'accessibilityHidden' : 'aria-hidden']).toBe(false)
    })

    it('can switch a card between passive, interactive and disabled states', async () => {
      const interactive = ref(false),
        disabled = ref(false),
        click = vi.fn()
      const root = mount({
        render: () =>
          h(
            ui.MCard,
            {
              id: 'card',
              interactive: interactive.value,
              disabled: disabled.value,
              backgroundColor: '#112233',
              accessibilityLabel: 'Open',
              onClick: click,
            },
            { default: () => h(ui.MText, { text: 'Collection' }) },
          ),
      })
      const card = byId(root, 'card')
      expect(style(card).backgroundColor).toBe('#112233')
      fire(card, isNative ? 'onTap' : 'onClick')
      expect(click).not.toHaveBeenCalled()
      interactive.value = true
      await nextTick()
      expect(card.props[isNative ? 'accessibilityRole' : 'role']).toBe('button')
      if (isNative) expect(find(card, tags.text).props.accessibilityHidden).toBe(true)
      fire(card, isNative ? 'onTap' : 'onClick')
      expect(click.mock.calls).toEqual([[]])
      disabled.value = true
      await nextTick()
      fire(card, isNative ? 'onTap' : 'onClick')
      expect(click).toHaveBeenCalledOnce()
      interactive.value = false
      await nextTick()
      expect(card.props[isNative ? 'accessibilityRole' : 'role'] || null).toBeNull()
      if (isNative) expect(find(card, tags.text).props.accessibilityHidden).toBe(false)
      fire(card, isNative ? 'onTap' : 'onClick')
      expect(click).toHaveBeenCalledOnce()
      expect(style(card).opacity).toBe(1)
    })

    it('keeps slider models controlled and emits only changed numeric values', async () => {
      const value = ref(0.96),
        disabled = ref(false),
        changes = vi.fn()
      const root = mount({
        render: () =>
          h(ui.MSlider, {
            min: 0,
            max: 1,
            step: 0.3,
            modelValue: value.value,
            label: 'Level',
            disabled: disabled.value,
            'onUpdate:modelValue': (next: number) => {
              changes(next)
              value.value = next
            },
          }),
      })
      const slider = find(root, tags.slider)
      expect(slider.props.value).toBe(4)
      expect(value.value).toBe(0.96)
      expect(changes).not.toHaveBeenCalled()
      const input = (index: number) =>
        fire(
          slider,
          isNative ? 'onValueChange' : 'onInput',
          isNative ? { value: index } : { target: { valueAsNumber: index } },
        )
      input(3)
      await nextTick()
      expect(changes.mock.calls).toEqual([[0.9]])
      input(3)
      expect(changes).toHaveBeenCalledOnce()
      value.value = 0.3
      disabled.value = true
      await nextTick()
      expect(slider.props.value).toBe(1)
      input(4)
      expect(changes).toHaveBeenCalledOnce()
    })

    it('declares Reveal layout props and applies them to the conditional content', async () => {
      const show = ref(false)
      const root = mount({
        render: () =>
          h(
            ui.MReveal,
            {
              show: show.value,
              id: 'details',
              gap: 'sm',
              padding: 'md',
              align: 'end',
            },
            { default: () => h(ui.MText, { text: 'Details' }) },
          ),
      })
      expect(() => byId(root, 'details')).toThrow()
      show.value = true
      await nextTick()
      expect(style(byId(root, 'details'))).toMatchObject({
        alignItems: 'flex-end',
        gap: isNative ? 8 : '8px',
      })
      expect(text(find(root, tags.text))).toBe('Details')
      show.value = false
      await nextTick()
      expect(() => byId(root, 'details')).toThrow()
    })

    it('starts a screen with column sizing and keeps the default slot content', () => {
      const root = mount({
        setup() {
          provide(layoutDirection, 'row')
          return () =>
            h(
              ui.MScreen,
              { scroll: true, id: 'screen', accessibilityLabel: 'Session' },
              {
                default: () => [h(ui.MText, { text: 'First' }), h(ui.MText, { text: 'Second' })],
              },
            )
        },
      })
      expect(byId(root, 'screen').tag).toBe(tags.screen)
      expect(style(find(root, tags.text)).flexShrink).toBe(0)
      expect(byId(root, 'screen').props[isNative ? 'accessibilityLabel' : 'aria-label']).toBe(
        'Session',
      )
    })
  })
}
