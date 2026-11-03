import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { createTimePicker } from '../packages/core/src/vue/time-picker.js'
import { fire, find, node, renderer, type TestNode } from './renderer.js'

const focus = vi.fn()
const primitive = (tag: string) =>
  defineComponent({
    inheritAttrs: false,
    setup(_props, { attrs, slots, expose }) {
      expose({ focus, blur() {}, focusAction: focus })
      return () => h(tag, attrs, tag !== 'sheet' || attrs.open ? slots.default?.() : undefined)
    },
  })
const TimePicker = createTimePicker(
  {
    Input: primitive('editor'),
    Column: primitive('column'),
    Row: primitive('row'),
    Button: primitive('button'),
    Text: primitive('text'),
    Sheet: primitive('sheet'),
    Picker: primitive('wheel'),
  },
  'native',
)
const buttons = (root: TestNode): TestNode[] =>
  root.tag === 'button' ? [root] : root.children.flatMap(buttons)
describe('time picker controlled state', () => {
  it('keeps invalid drafts, revalidates changed bounds and respects rejected parent updates', async () => {
    const value = ref<string | null>('09:30')
    const max = ref('18:00')
    const accepted = ref(true)
    const validity = vi.fn()
    const root = node('root')
    const app = renderer.createApp({
      render: () =>
        h(TimePicker, {
          label: 'Time',
          modelValue: value.value,
          max: max.value,
          minuteStep: 15,
          'onUpdate:modelValue': (next) => {
            if (accepted.value) value.value = next
          },
          onValidityChange: validity,
        }),
    })
    app.mount(root)
    const editor = find(root, 'editor')
    fire(editor, 'onUpdate:modelValue', '10:')
    await nextTick()
    expect(editor.props.modelValue).toBe('10:')
    expect(value.value).toBe('09:30')
    fire(editor, 'onUpdate:modelValue', '10:15 AM')
    await nextTick()
    expect(value.value).toBe('10:15')
    max.value = '10:00'
    await nextTick()
    expect(validity).toHaveBeenLastCalledWith({ status: 'range', value: null })
    max.value = '18:00'
    accepted.value = false
    await nextTick()
    fire(editor, 'onUpdate:modelValue', '11:30 AM')
    await nextTick()
    await nextTick()
    expect(value.value).toBe('10:15')
    expect(editor.props.modelValue).toBe('10:15 AM')
    app.unmount()
  })
  it('holds picker changes until confirmation and cancels without publishing', async () => {
    const value = ref<string | null>('09:30')
    const readonly = ref(false)
    const root = node('root')
    const app = renderer.createApp({
      render: () =>
        h(TimePicker, {
          label: 'Time',
          modelValue: value.value,
          readonly: readonly.value,
          'onUpdate:modelValue': (next) => {
            value.value = next
          },
        }),
    })
    app.mount(root)
    fire(find(root, 'editor'), 'onAction')
    await nextTick()
    fire(find(root, 'wheel'), 'onUpdate:modelValue', '15:30')
    await nextTick()
    expect(value.value).toBe('09:30')
    fire(find(root, 'sheet'), 'onUpdate:open', false)
    await nextTick()
    expect(value.value).toBe('09:30')
    fire(find(root, 'editor'), 'onAction')
    await nextTick()
    expect(find(root, 'wheel').props.modelValue).toBe('09:30')
    fire(find(root, 'wheel'), 'onUpdate:modelValue', '16:00')
    await nextTick()
    fire(
      buttons(root).find((button) => button.props.text === 'Apply')!,
      'onClick',
    )
    await nextTick()
    expect(value.value).toBe('16:00')
    readonly.value = true
    await nextTick()
    fire(find(root, 'editor'), 'onUpdate:modelValue', '11:00 AM')
    fire(find(root, 'editor'), 'onAction')
    await nextTick()
    expect(find(root, 'sheet').props.open).toBe(false)
    expect(value.value).toBe('16:00')
    app.unmount()
  })
})
