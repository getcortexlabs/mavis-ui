import { afterEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick, ref, provide, type App, type Component } from 'vue'
import * as native from '../packages/nativescript/src/vue/index.js'
import * as web from '../packages/web/src/index.js'
import { mavis, midnight, iconGlyph } from '../packages/core/src/index.js'
import { layoutDirection } from '@getcortexlabs/mavis-core/vue'
import { renderer, node, find, fire, type TestNode } from './renderer.js'

vi.mock('@nativescript/core', () => ({
  isAndroid: true,
  isIOS: false,
  Application: {
    systemAppearanceChangedEvent: 'systemAppearanceChanged',
    launchEvent: 'launch',
    systemAppearance: () => 'light',
    on() {},
    off() {},
  },
}))
vi.mock('@rafaelaugusto/jolt', () => ({ press: () => () => {} }))
vi.mock('@rafaelaugusto/jolt/vue', async () => ({
  JoltTransition: (await import('vue')).BaseTransition,
}))
interface FakeSheet {
  options: {
    snap: unknown[]
    dismissible?: boolean
    accessibility?: { label?: string; dismiss?: string }
    onChange?: (point: unknown) => void
    onDismiss?: () => void
  }
  isOpen: boolean
  disposed: boolean
  open(): void
  dismiss(): void
  dispose(): void
}
const sheets = vi.hoisted(() => ({ created: [] as FakeSheet[] }))
vi.mock('@rafaelaugusto/jolt/bottom-sheet', () => ({
  GestureSurface: class {},
  bottomSheet(_panel: unknown, options: FakeSheet['options']) {
    const sheet: FakeSheet = {
      options,
      isOpen: false,
      disposed: false,
      open() {
        sheet.isOpen = true
        options.onChange?.(options.snap[0])
      },
      dismiss() {
        if (!sheet.isOpen) return
        sheet.isOpen = false
        options.onChange?.(null)
        options.onDismiss?.()
      },
      dispose() {
        sheet.disposed = true
      },
    }
    sheets.created.push(sheet)
    return sheet
  },
}))
// The test renderer has no NativeScript views; the sheet hands the rendered nodes to Jolt.
vi.mock('../packages/nativescript/src/vue/native-view.ts', () => ({
  nativeViewOf: (element: unknown) => element,
}))
const keyboard = vi.hoisted(() => ({
  calls: [] as { container: unknown; options: { tap: boolean; drag: boolean } }[],
  released: 0,
}))
vi.mock('../packages/nativescript/src/native/keyboard-dismiss.ts', () => ({
  dismissKeyboardOn(container: unknown, options: { tap: boolean; drag: boolean }) {
    keyboard.calls.push({ container, options })
    return () => {
      keyboard.released += 1
    }
  },
}))
vi.mock('vue', async (original) => {
  const vue = await original<typeof import('vue')>()
  return { ...vue, Transition: vue.BaseTransition }
})

const apps: App[] = []
afterEach(() => {
  for (const app of apps.splice(0)) app.unmount()
  sheets.created.splice(0)
  keyboard.calls.splice(0)
  keyboard.released = 0
})
const settle = async () => {
  await nextTick()
  await nextTick()
}

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
    {
      button: 'MavisButton',
      text: 'MavisLabel',
      slider: 'MavisSlider',
      screen: 'Page',
      icon: 'MavisIcon',
    },
  ],
  ['Web', web, { button: 'button', text: 'p', slider: 'input', screen: 'main', icon: 'span' }],
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
    it('resolves a mixed Checkbox to checked once, including a previously checked model', async () => {
      for (const initial of [false, true]) {
        const value = ref(initial)
        const mixed = ref(true)
        const events: unknown[][] = []
        const root = mount({
          render: () =>
            h(ui.MCheckbox, {
              label: 'All topics',
              modelValue: value.value,
              indeterminate: mixed.value,
              'onUpdate:indeterminate': (next: boolean) => {
                events.push(['mixed', next])
                mixed.value = next
              },
              'onUpdate:modelValue': (next: boolean) => {
                events.push(['checked', next])
                value.value = next
              },
            }),
        })
        const control = find(root, isNative ? 'MavisCheckboxButton' : 'input')
        fire(control, isNative ? 'onTap' : 'onChange', {
          target: { checked: false, indeterminate: false },
        })
        await settle()
        expect(events).toEqual([
          ['mixed', false],
          ['checked', true],
        ])
        expect(value.value).toBe(true)
        expect(mixed.value).toBe(false)
        fire(control, isNative ? 'onTap' : 'onChange', {
          target: { checked: false, indeterminate: false },
        })
        await settle()
        expect(events.at(-1)).toEqual(['checked', false])
        expect(events).toHaveLength(3)
      }
    })

    it('keeps Checkbox values controlled and does not emit for external or disabled changes', async () => {
      const value = ref(false)
      const mixed = ref(true)
      const disabled = ref(false)
      const checkedChange = vi.fn()
      const mixedChange = vi.fn()
      const root = mount({
        render: () =>
          h(ui.MCheckbox, {
            label: 'Topics',
            modelValue: value.value,
            indeterminate: mixed.value,
            disabled: disabled.value,
            'onUpdate:modelValue': checkedChange,
            'onUpdate:indeterminate': mixedChange,
          }),
      })
      const control = find(root, isNative ? 'MavisCheckboxButton' : 'input')
      const target = { checked: true, indeterminate: false }
      fire(control, isNative ? 'onTap' : 'onChange', { target })
      await settle()
      expect(checkedChange.mock.calls).toEqual([[true]])
      expect(mixedChange.mock.calls).toEqual([[false]])
      if (isNative) expect(control.props.accessibilityValue).toBe('Partially selected')
      else {
        expect(target).toEqual({ checked: false, indeterminate: true })
        expect(control.props['aria-checked']).toBe('mixed')
      }
      value.value = true
      mixed.value = false
      disabled.value = true
      await settle()
      fire(control, isNative ? 'onTap' : 'onChange', { target })
      await settle()
      expect(checkedChange).toHaveBeenCalledTimes(1)
      expect(mixedChange).toHaveBeenCalledTimes(1)
      if (isNative) expect(control.props.accessibilityValue).toBe('')
      expect(control.props[isNative ? 'isEnabled' : 'disabled']).toBe(!isNative)
      expect(control.props[isNative ? 'accessibilityState' : 'checked']).toBe(
        isNative ? 'checked' : true,
      )
    })

    it('keeps Switch controlled across user changes, external writes and disabled state', async () => {
      const value = ref(false)
      const disabled = ref(false)
      const changes = vi.fn()
      const root = mount({
        render: () =>
          h(ui.MSwitch, {
            id: 'preference',
            label: 'Notifications',
            helperText: 'People you follow',
            modelValue: value.value,
            disabled: disabled.value,
            'onUpdate:modelValue': changes,
          }),
      })
      const control = find(root, isNative ? 'Switch' : 'button')
      const state = () => control.props[isNative ? 'checked' : 'aria-checked']
      expect(state()).toBe(false)
      if (isNative) {
        const view = { checked: false }
        fire(control, 'onLoaded', { object: view })
        view.checked = true
        fire(control, 'onCheckedChange', { object: view, value: true })
        await settle()
        expect(view.checked).toBe(false) // parent rejected the proposed value
      } else fire(control, 'onClick')
      expect(changes.mock.calls).toEqual([[true]])
      expect(state()).toBe(false)
      value.value = true
      await settle()
      expect(state()).toBe(true)
      if (isNative) fire(control, 'onCheckedChange', { object: {}, value: true })
      expect(changes).toHaveBeenCalledTimes(1)
      disabled.value = true
      await settle()
      fire(control, isNative ? 'onCheckedChange' : 'onClick', { object: {}, value: false })
      expect(changes).toHaveBeenCalledTimes(1)
      expect(control.props[isNative ? 'isEnabled' : 'disabled']).toBe(!isNative)
    })

    it('accepts each Switch activation once and reflects the parent boolean', async () => {
      const value = ref(false)
      const changes = vi.fn((next: boolean) => {
        value.value = next
      })
      const root = mount({
        render: () =>
          h(ui.MSwitch, {
            label: 'Notifications',
            modelValue: value.value,
            'onUpdate:modelValue': changes,
          }),
      })
      const control = find(root, isNative ? 'Switch' : 'button')
      for (const next of [true, false, true]) {
        fire(control, isNative ? 'onCheckedChange' : 'onClick', { object: {}, value: next })
        await settle()
        expect(value.value).toBe(next)
        expect(control.props[isNative ? 'checked' : 'aria-checked']).toBe(next)
      }
      expect(changes.mock.calls).toEqual([[true], [false], [true]])
    })

    if (isNative) {
      it('rejects a native vertical drag but preserves horizontal and later keyboard activation', async () => {
        vi.useFakeTimers()
        try {
          const changes = vi.fn()
          const root = mount({
            render: () => h(ui.MSwitch, { label: 'Updates', 'onUpdate:modelValue': changes }),
          })
          const control = find(root, 'Switch')
          const view = { checked: false }
          fire(control, 'onLoaded', { object: view })
          const touch = (action: string, x: number, y: number) =>
            fire(control, 'onTouch', { action, getX: () => x, getY: () => y })
          touch('down', 10, 10)
          touch('move', 12, 45)
          touch('up', 12, 60)
          view.checked = true
          fire(control, 'onCheckedChange', { object: view, value: true })
          await settle()
          expect(changes).not.toHaveBeenCalled()
          expect(view.checked).toBe(false)
          vi.runAllTimers()
          fire(control, 'onCheckedChange', { object: view, value: true })
          expect(changes).toHaveBeenCalledTimes(1)
          touch('down', 10, 10)
          touch('move', 45, 12)
          touch('up', 60, 12)
          fire(control, 'onCheckedChange', { object: view, value: true })
          expect(changes).toHaveBeenCalledTimes(2)
          fire(control, 'onUnloaded')
          expect(vi.getTimerCount()).toBe(0)
        } finally {
          vi.useRealTimers()
        }
      })

      it('toggles from the label and cancels pending restoration after unload', async () => {
        const changes = vi.fn()
        const disabled = ref(false)
        const root = mount({
          render: () =>
            h(ui.MSwitch, {
              label: 'Notifications',
              disabled: disabled.value,
              'onUpdate:modelValue': changes,
            }),
        })
        const label = find(root, 'MavisLabel').parent!
        fire(label, 'onTap')
        expect(changes.mock.calls).toEqual([[true]])
        disabled.value = true
        await settle()
        fire(label, 'onTap')
        expect(changes).toHaveBeenCalledTimes(1)
        const control = find(root, 'Switch')
        const view = { checked: true }
        fire(control, 'onLoaded', { object: view })
        view.checked = true
        fire(control, 'onCheckedChange', { object: view, value: true })
        fire(control, 'onUnloaded')
        await settle()
        expect(view.checked).toBe(true)
        fire(control, 'onLoaded', { object: view })
        expect(view.checked).toBe(false)
      })
    }

    if (isNative) {
      it('lets Android finish focusing before painting the border and cancels stale feedback', async () => {
        vi.useFakeTimers()
        try {
          const focus = vi.fn()
          const visible = ref(true)
          const root = mount({
            render: () => (visible.value ? h(ui.MInput, { label: 'Name', onFocus: focus }) : null),
          })
          const field = find(root, 'MavisTextField')
          let hasFocus = true
          Object.assign(field, {
            nativeView: { isLoaded: true, android: { hasFocus: () => hasFocus } },
          })

          fire(field, 'onFocus')
          expect(focus).toHaveBeenCalledOnce()
          await nextTick()
          expect(style(field).borderColor).toBe(mavis.colors.border)
          vi.runAllTimers()
          await nextTick()
          expect(style(field).borderColor).toBe(mavis.colors.primary)

          fire(field, 'onBlur')
          fire(field, 'onFocus')
          fire(field, 'onBlur')
          vi.runAllTimers()
          await nextTick()
          expect(style(field).borderColor).toBe(mavis.colors.border)

          fire(field, 'onFocus')
          hasFocus = false
          vi.runAllTimers()
          await nextTick()
          expect(style(field).borderColor).toBe(mavis.colors.border)

          fire(field, 'onFocus')
          fire(field, 'onUnloaded')
          expect(vi.getTimerCount()).toBe(0)
          fire(field, 'onFocus')
          visible.value = false
          await nextTick()
          expect(vi.getTimerCount()).toBe(0)
        } finally {
          vi.useRealTimers()
        }
      })
    }

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
      expect(style(byId(root, 'column'))).toMatchObject(
        isNative
          ? { paddingLeft: 0, paddingRight: 0, paddingTop: 24, paddingBottom: 24 }
          : { paddingLeft: '0px', paddingRight: '0px', paddingTop: '24px', paddingBottom: '24px' },
      )
      expect(style(byId(root, 'row'))).toMatchObject({
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        width: '50%',
      })
      expect(style(byId(root, 'text'))).toMatchObject({ flexGrow: 1, flexShrink: 1 })
    })

    it('leaves the style of a layout prop alone until the prop is given', async () => {
      const radius = ref<number | undefined>(undefined)
      const root = mount({
        render: () =>
          h(
            ui.MRow,
            { id: 'row', radius: radius.value, paddingY: 'sm' },
            { default: () => h(ui.MBox, { id: 'box', backgroundColor: '#123456' }) },
          ),
      })
      const row = () => style(byId(root, 'row'))
      const box = () => style(byId(root, 'box'))
      expect(Object.keys(row())).toEqual(
        expect.not.arrayContaining([
          'borderRadius',
          'paddingLeft',
          'paddingRight',
          'width',
          'height',
          'backgroundColor',
        ]),
      )
      expect(row()).toMatchObject(
        isNative
          ? { paddingTop: 8, paddingBottom: 8 }
          : { paddingTop: '8px', paddingBottom: '8px' },
      )
      expect(Object.keys(box())).toEqual(expect.not.arrayContaining(['paddingTop', 'borderRadius']))
      expect(box().backgroundColor).toBe('#123456')
      radius.value = 12
      await settle()
      expect(row().borderRadius).toBe(isNative ? 12 : '12px')
      radius.value = undefined
      await settle()
      expect(Object.keys(row())).not.toContain('borderRadius')
    })

    it('renders decorative and labeled icons from the bundled font', () => {
      const root = mount({
        render: () =>
          h(
            ui.MRow,
            {},
            {
              default: () => [
                h(ui.MIcon, { id: 'plain', name: 'search' }),
                h(ui.MIcon, {
                  id: 'named',
                  name: 'circle-check',
                  label: 'Done',
                  tone: 'success',
                  size: 'lg',
                }),
              ],
            },
          ),
      })
      const plain = byId(root, 'plain')
      const named = byId(root, 'named')
      expect(plain.tag).toBe(tags.icon)
      const glyph = (el: TestNode) => (isNative ? el.props.text : el.text)
      expect(glyph(plain)).toBe(iconGlyph('search'))
      expect(glyph(named)).toBe(iconGlyph('circle-check'))
      if (isNative) {
        expect(plain.props).toMatchObject({ accessible: false, accessibilityHidden: true })
        expect(named.props).toMatchObject({
          accessible: true,
          accessibilityHidden: false,
          accessibilityRole: 'image',
          accessibilityLabel: 'Done',
        })
        expect(style(plain)).toMatchObject({ fontFamily: 'lucide', fontSize: 20, flexShrink: 0 })
        expect(style(named).fontSize).toBe(24)
      } else {
        expect(plain.props['aria-hidden']).toBe('true')
        expect(named.props).toMatchObject({ role: 'img', 'aria-label': 'Done' })
        expect(style(plain)).toMatchObject({ fontFamily: 'lucide', fontSize: '20px' })
        expect(style(named).fontSize).toBe('24px')
      }
      expect(style(named).color).toBe(mavis.colors.success)
      expect(() => mount({ render: () => h(ui.MIcon, { name: 'not-an-icon' as never }) })).toThrow(
        RangeError,
      )
    })

    it('draws button icons beside the text and requires a name for icon-only buttons', () => {
      const root = mount({
        render: () =>
          h(
            ui.MRow,
            {},
            {
              default: () => [
                h(ui.MButton, { id: 'add', icon: 'plus', text: 'Add' }),
                h(ui.MButton, {
                  id: 'next',
                  trailingIcon: 'arrow-right',
                  size: 'lg',
                  text: 'Next',
                }),
                h(ui.MButton, { id: 'only', icon: 'heart', accessibilityLabel: 'Favorite' }),
              ],
            },
          ),
      })
      const add = byId(root, 'add')
      const next = byId(root, 'next')
      const only = byId(root, 'only')
      if (isNative) {
        const spans = (el: TestNode) =>
          find(el, 'FormattedString').children.filter((span) => span.tag === 'Span')
        expect(add.props.text).toBe('Add')
        expect(add.props.formattedText).toBeUndefined()
        expect(spans(add).map((span) => span.props.text)).toEqual([iconGlyph('plus'), ' Add'])
        expect(spans(add)[0]!.props).toMatchObject({ fontFamily: 'lucide', fontSize: 20 })
        expect(spans(next).map((span) => span.props.text)).toEqual([
          'Next',
          ' ',
          iconGlyph('arrow-right'),
        ])
        expect(spans(next)[2]!.props.fontSize).toBe(24)
        expect(spans(only).map((span) => span.props.text)).toEqual([iconGlyph('heart')])
        expect(only.props.accessibilityLabel).toBe('Favorite')
        expect(style(only).paddingLeft).toBe(style(only).paddingRight)
        expect(style(only).paddingLeft).toBeLessThan(style(add).paddingLeft as number)
      } else {
        const glyphs = (el: TestNode) =>
          el.children.filter((c) => c.props.class === 'm-icon').map((c) => c.text)
        expect(glyphs(add)).toEqual([iconGlyph('plus')])
        expect(add.children.map((c) => c.text ?? c.children.map((n) => n.text).join(''))).toContain(
          'Add',
        )
        expect(add.children[0]!.props['aria-hidden']).toBe('true')
        expect(glyphs(next)).toEqual([iconGlyph('arrow-right')])
        expect(style(next.children.at(-1)!).fontSize).toBe('24px')
        expect(only.props['aria-label']).toBe('Favorite')
        expect(style(add).display).toBe('inline-flex')
      }
      expect(() => mount({ render: () => h(ui.MButton, { icon: 'heart' }) })).toThrow(RangeError)
    })

    it('draws input icons inside the editor box without taking touches', () => {
      const root = mount({
        render: () =>
          h(ui.MInput, {
            id: 'field',
            label: 'Email',
            modelValue: '',
            icon: 'mail',
            trailingIcon: 'x',
            error: 'Check it',
          }),
      })
      const editor = byId(root, 'field')
      if (isNative) {
        const icons = editor.parent!.children.filter((c) => c.tag === 'MavisIcon')
        expect(icons.map((c) => c.props.text)).toEqual([iconGlyph('mail'), iconGlyph('x')])
        expect(icons[0]!.props).toMatchObject({
          row: 1,
          isUserInteractionEnabled: false,
          accessibilityHidden: true,
        })
        expect(style(icons[0]!)).toMatchObject({
          horizontalAlignment: 'left',
          color: mavis.colors.danger,
        })
        expect(style(icons[1]!).horizontalAlignment).toBe('right')
        expect(style(editor).paddingLeft).toBeGreaterThan(16)
        expect(style(editor).paddingRight).toBeGreaterThan(16)
      } else {
        const icons = editor.parent!.children.filter((c) => c.props.class === 'm-icon')
        expect(icons.map((c) => c.text)).toEqual([iconGlyph('mail'), iconGlyph('x')])
        expect(icons[0]!.props['aria-hidden']).toBe('true')
        expect(style(icons[0]!)).toMatchObject({
          position: 'absolute',
          pointerEvents: 'none',
          color: mavis.colors.danger,
        })
        expect(style(editor).paddingLeft).toBe('46px')
        expect(style(editor).paddingRight).toBe('46px')
      }
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
      expect(box.tag).toBe(isNative ? 'MavisBox' : 'div')
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

    it('puts the keyboard away on a tap outside the editor and, when scrolling, on a drag', async () => {
      const scroll = ref(true)
      const dismiss = ref(true)
      const root = mount({
        render: () =>
          h(
            ui.MScreen,
            { scroll: scroll.value, dismissKeyboard: dismiss.value },
            { default: () => h(ui.MText, { id: 'body', text: 'Body' }) },
          ),
      })
      expect(text(byId(root, 'body'))).toBe('Body')
      if (!isNative) {
        const main = find(root, 'main')
        expect(main.props.dismissKeyboard).toBeUndefined()
        expect(typeof main.props.onTouchmovePassive).toBe('function')
        return
      }
      const container = find(root, 'MavisScreen')
      const view = { id: 'page-container' }
      expect(keyboard.calls).toHaveLength(0)
      fire(container, 'onLoaded', { object: view })
      expect(keyboard.calls).toEqual([{ container: view, options: { tap: true, drag: true } }])

      scroll.value = false
      await settle()
      expect(keyboard.released).toBe(1)
      expect(keyboard.calls.at(-1)).toEqual({
        container: view,
        options: { tap: true, drag: false },
      })

      dismiss.value = false
      await settle()
      expect(keyboard.released).toBe(2)
      expect(keyboard.calls).toHaveLength(2)

      dismiss.value = true
      await settle()
      expect(keyboard.calls).toHaveLength(3)
      fire(container, 'onUnloaded')
      expect(keyboard.released).toBe(3)
      fire(container, 'onLoaded', { object: view })
      expect(keyboard.calls).toHaveLength(4)
    })

    it('presents a named sheet above the screen and reports each close reason', async () => {
      const open = ref(false)
      const close = vi.fn()
      const dismissible = ref(true)
      const root = mount({
        render: () =>
          h(
            ui.MScreen,
            { scroll: true },
            {
              default: () => [
                h(ui.MButton, { id: 'trigger', text: 'Filters' }),
                h(
                  ui.MSheet,
                  {
                    open: open.value,
                    id: 'sheet',
                    title: 'Filters',
                    closeLabel: 'Dismiss',
                    dismissible: dismissible.value,
                    gap: 'sm',
                    'onUpdate:open': (value: boolean) => {
                      open.value = value
                    },
                    onClose: close,
                  },
                  { default: () => h(ui.MText, { id: 'body', text: 'Body' }) },
                ),
              ],
            },
          ),
      })
      const closeButton = () => {
        const control = (node: TestNode): TestNode | undefined => {
          if (
            node.tag === tags.button &&
            node.props[isNative ? 'accessibilityLabel' : 'aria-label'] === 'Dismiss'
          )
            return node
          for (const child of node.children) {
            const found = control(child)
            if (found) return found
          }
          return undefined
        }
        return control(root)
      }
      expect(() => byId(root, 'body')).toThrow()
      expect(closeButton()).toBeUndefined()

      open.value = true
      await settle()
      expect(text(byId(root, 'body'))).toBe('Body')
      const heading = find(root, isNative ? tags.text : 'h2')
      expect(text(heading)).toBe('Filters')
      expect(closeButton()).toBeDefined()
      if (isNative) {
        expect(heading.props.accessibilityRole).toBe('header')
        expect(find(root, 'MavisScreenScroll').props.accessibilityHidden).toBe(true)
        expect(sheets.created).toHaveLength(1)
        expect(sheets.created[0]!.options).toMatchObject({
          snap: ['content'],
          dismissible: true,
          accessibility: { label: 'Filters', dismiss: 'Dismiss' },
        })
      } else {
        const dialog = find(root, 'dialog')
        expect(dialog.props['aria-labelledby']).toBe(heading.props.id)
        expect(heading.tag).toBe('h2')
        expect(String(dialog.props.class)).toContain('m-sheet-open')
      }

      fire(closeButton()!, isNative ? 'onTap' : 'onClick')
      expect(close).toHaveBeenLastCalledWith('button')
      expect(open.value).toBe(false)
      await settle()
      expect(() => byId(root, 'body')).toThrow()
      if (isNative) {
        expect(sheets.created[0]!.disposed).toBe(true)
        expect(find(root, 'MavisScreenScroll').props.accessibilityHidden).toBe(false)
      }

      open.value = true
      await settle()
      if (isNative) {
        const sheet = sheets.created.at(-1)!
        const backdrop = (node: TestNode): TestNode | undefined => {
          if (node.props.backgroundColor === '#000000') return node
          for (const child of node.children) {
            const found = backdrop(child)
            if (found) return found
          }
          return undefined
        }
        fire(backdrop(root)!, 'onTap')
        sheet.isOpen = false
        sheet.options.onChange?.(null)
        sheet.options.onDismiss?.()
      } else {
        const dialog = find(root, 'dialog')
        fire(dialog, 'onPointerdown', { target: dialog, currentTarget: dialog })
        fire(dialog, 'onClick', { target: dialog, currentTarget: dialog })
      }
      expect(close).toHaveBeenLastCalledWith('backdrop')
      expect(open.value).toBe(false)
      await settle()
      expect(() => byId(root, 'body')).toThrow()

      open.value = true
      await settle()
      if (isNative) {
        const sheet = sheets.created.at(-1)!
        sheet.isOpen = false
        sheet.options.onChange?.(null)
        sheet.options.onDismiss?.()
        expect(close).toHaveBeenLastCalledWith('swipe')
      } else {
        const preventDefault = vi.fn()
        fire(find(root, 'dialog'), 'onCancel', { preventDefault })
        expect(preventDefault).toHaveBeenCalled()
        expect(close).toHaveBeenLastCalledWith('escape')
      }
      expect(open.value).toBe(false)
      await settle()

      open.value = true
      await settle()
      open.value = false
      await settle()
      expect(close).toHaveBeenLastCalledWith('program')
      expect(() => byId(root, 'body')).toThrow()

      dismissible.value = false
      open.value = true
      await settle()
      expect(closeButton()).toBeUndefined()
      if (isNative) {
        expect(sheets.created.at(-1)!.options.dismissible).toBe(false)
      } else {
        const preventDefault = vi.fn()
        fire(find(root, 'dialog'), 'onCancel', { preventDefault })
        expect(preventDefault).toHaveBeenCalled()
      }
      expect(open.value).toBe(true)
      expect(close).toHaveBeenCalledTimes(4)
    })

    it('requires an accessible name for a sheet', () => {
      expect(() =>
        mount({
          render: () => h(ui.MScreen, {}, { default: () => h(ui.MSheet, { open: true }) }),
        }),
      ).toThrow(RangeError)
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
