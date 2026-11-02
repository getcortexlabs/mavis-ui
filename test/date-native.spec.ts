import { expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { inputProps, buttonProps } from '../packages/core/src/vue/props.js'
import {
  MDatePicker,
  MDateRangePicker,
} from '../packages/nativescript/src/vue/components/MDatePicker.js'
import { node, renderer, fire, type TestNode } from './renderer.js'
import type { CivilDate, DateRange } from '../packages/core/src/date.js'
import type { InputHandle } from '../packages/core/src/input.js'

const platform = vi.hoisted(() => ({ dismiss: vi.fn(), focus: vi.fn(), blur: vi.fn() }))
vi.mock('@nativescript/core', () => ({ Utils: { dismissKeyboard: platform.dismiss } }))
vi.mock('../packages/nativescript/src/vue/components/MInput.js', () => ({
  MInput: defineComponent({
    props: inputProps,
    emits: ['update:modelValue', 'focus', 'blur', 'submit'],
    setup(props, { emit, expose }) {
      expose({ focus: platform.focus, blur: platform.blur })
      return () =>
        h('TextField', {
          ...props,
          text: props.modelValue,
          onTextChange: (text: string) => emit('update:modelValue', text),
          onBlur: () => emit('blur'),
        })
    },
  }),
}))
vi.mock('../packages/nativescript/src/vue/components/MButton.js', () => ({
  MButton: defineComponent({
    props: buttonProps,
    emits: ['click'],
    setup(props, { emit, attrs }) {
      return () => h('NativeButton', { ...attrs, ...props, onTap: () => emit('click') })
    },
  }),
}))
vi.mock('../packages/nativescript/src/vue/components/MText.js', () => ({
  MText: defineComponent({
    setup(_props, { attrs }) {
      return () => h('Label', attrs)
    },
  }),
}))
vi.mock('../packages/nativescript/src/vue/components/layout.js', () => {
  const layout = (name: string) =>
    defineComponent({
      setup(_props, { attrs, slots }) {
        return () => h(name, attrs, slots.default?.())
      },
    })
  return { MColumn: layout('NativeColumn'), MRow: layout('NativeRow') }
})
vi.mock('../packages/nativescript/src/vue/components/MSheet.js', () => ({
  MSheet: defineComponent({
    props: { open: Boolean, title: String, closeLabel: String },
    emits: ['update:open'],
    setup(props, { slots, emit }) {
      return () =>
        props.open
          ? h(
              'Sheet',
              { title: props.title, onClose: () => emit('update:open', false) },
              slots.default?.(),
            )
          : null
    },
  }),
}))
function all(root: TestNode, tag: string): TestNode[] {
  return [...(root.tag === tag ? [root] : []), ...root.children.flatMap((child) => all(child, tag))]
}
function button(root: TestNode, label: string) {
  const found = all(root, 'NativeButton').find(
    (child) => child.props.accessibilityLabel === label || child.props.text === label,
  )
  if (!found) throw new Error(`No native button: ${label}`)
  return found
}

it('shares native text drafting, calendar bounds/selection and typed editor focus without a platform Date', async () => {
  const model = ref<CivilDate | null>('2024-02-29')
  const handle = ref<InputHandle>()
  const root = node('root')
  const app = renderer.createApp({
    render: () =>
      h(MDatePicker, {
        ref: handle,
        label: 'Trip',
        modelValue: model.value,
        min: '2024-02-01',
        max: '2024-03-31',
        unavailableDates: ['2024-02-14'],
        'onUpdate:modelValue': (value: CivilDate | null) => {
          model.value = value
        },
      }),
  })
  app.mount(root)
  try {
    handle.value!.focus()
    handle.value!.blur()
    expect(platform.focus).toHaveBeenCalledOnce()
    expect(platform.blur).toHaveBeenCalledOnce()
    fire(all(root, 'TextField')[0]!, 'onTextChange', '2024-02-')
    await nextTick()
    expect(model.value).toBe('2024-02-29')
    expect(all(root, 'TextField')[0]!.props.text).toBe('2024-02-')
    fire(button(root, 'Choose date: Trip'), 'onTap')
    await nextTick()
    expect(platform.dismiss).toHaveBeenCalledOnce()
    expect(all(root, 'Sheet')).toHaveLength(1)
    expect(button(root, 'Previous month').props.disabled).toBe(true)
    expect(button(root, 'Wednesday, 14 February 2024').props.disabled).toBe(true)
    fire(button(root, 'Wednesday, 14 February 2024'), 'onTap')
    await nextTick()
    expect(model.value).toBe('2024-02-29')
    expect(all(root, 'Sheet')).toHaveLength(1)
    fire(button(root, 'Thursday, 15 February 2024'), 'onTap')
    await nextTick()
    expect(model.value).toBe('2024-02-15')
    expect(all(root, 'Sheet')).toHaveLength(0)
    expect(all(root, 'TextField')[0]!.props.text).toBe('2024-02-15')
  } finally {
    app.unmount()
  }
})

it('native range editing keeps reversed drafts, rejects blocked interior days and clears endpoints together', async () => {
  const model = ref<DateRange>({ start: '2024-03-09', end: '2024-03-09' })
  const disabled = ref(false)
  const root = node('root')
  const app = renderer.createApp({
    render: () =>
      h(MDateRangePicker, {
        label: 'Stay',
        modelValue: model.value,
        disabled: disabled.value,
        unavailableDates: ['2024-03-10'],
        'onUpdate:modelValue': (value: DateRange) => {
          model.value = value
        },
      }),
  })
  app.mount(root)
  try {
    fire(all(root, 'TextField')[1]!, 'onTextChange', '2024-03-11')
    await nextTick()
    expect(model.value.end).toBe('2024-03-09')
    expect(all(root, 'TextField')[1]!.props.text).toBe('2024-03-11')
    expect(all(root, 'TextField')[1]!.props.error).toBe('This range includes an unavailable date.')
    fire(all(root, 'TextField')[0]!, 'onTextChange', '2024-03-12')
    await nextTick()
    expect(all(root, 'TextField')[1]!.props.error).toBe('The end must be on or after the start.')
    fire(button(root, 'Clear dates: Stay'), 'onTap')
    await nextTick()
    expect(model.value).toEqual({ start: null, end: null })
    fire(button(root, 'Choose date: Stay · Start'), 'onTap')
    await nextTick()
    expect(all(root, 'Sheet')).toHaveLength(1)
    disabled.value = true
    await nextTick()
    expect(all(root, 'Sheet')).toHaveLength(0)
    fire(all(root, 'TextField')[0]!, 'onTextChange', '2024-03-20')
    await nextTick()
    expect(model.value).toEqual({ start: null, end: null })
  } finally {
    app.unmount()
  }
})
