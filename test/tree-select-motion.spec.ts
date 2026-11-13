import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref, type PropType } from 'vue'
import { createTreeSelect, type AdvancedUI } from '../packages/core/src/vue/advanced-collections.js'
import {
  bindMotionSurface,
  type MotionFrames,
  type MotionSurface,
  type MotionValues,
} from '../packages/core/src/experimental.js'
import { fire, node, renderer, type TestNode } from './renderer.js'

function fixture(platform: 'web' | 'native', multiple = true) {
  const motions: { frames: MotionFrames; stop: ReturnType<typeof vi.fn> }[] = []
  const writes: MotionValues[] = []
  const animated = ref(true)
  const selected = ref<string[]>([])
  const expanded = ref<string[]>([])
  const Row = defineComponent({
    props: { motionSurface: Object as PropType<MotionSurface> },
    setup(props, { slots }) {
      let release: (() => void) | undefined
      onMounted(() => {
        if (props.motionSurface)
          release = bindMotionSurface(props.motionSurface, {
            animate(frames) {
              let resolve!: (complete: boolean) => void
              const finished = new Promise<boolean>((done) => {
                resolve = done
              })
              const stop = vi.fn(() => resolve(false))
              motions.push({ frames, stop })
              return { finished, stop }
            },
            set(values) {
              writes.push(values)
              return { finished: Promise.resolve(true), stop() {} }
            },
          })
      })
      onBeforeUnmount(() => release?.())
      return () => h('row', {}, slots.default?.())
    },
  })
  const Column = defineComponent({
    setup(_, { slots }) {
      return () => h('column', {}, slots.default?.())
    },
  })
  const Button = defineComponent({
    props: { text: String, disabled: Boolean },
    emits: ['click'],
    setup(props, { emit }) {
      return () =>
        h(
          'button',
          {
            onClick: () => {
              if (!props.disabled) emit('click')
            },
          },
          props.text,
        )
    },
  })
  const Checkbox = defineComponent({
    props: { label: String, modelValue: Boolean, disabled: Boolean },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h(
          'choice',
          {
            onClick: () => {
              if (!props.disabled) emit('update:modelValue', !props.modelValue)
            },
          },
          props.label,
        )
    },
  })
  const Popover = defineComponent({
    props: { open: Boolean, triggerLabel: String },
    emits: ['update:open'],
    setup(props, { slots, emit }) {
      return () =>
        h('popover', {}, [
          h('trigger', { onClick: () => emit('update:open', !props.open) }, props.triggerLabel),
          ...(props.open ? (slots.default?.() ?? []) : []),
        ])
    },
  })
  const Plain = defineComponent({
    props: { text: String },
    setup: (props) => () => h('plain', {}, props.text),
  })
  const TreeSelect = createTreeSelect(
    {
      Row,
      Column,
      Button,
      Checkbox,
      Popover,
      Box: Plain,
      Text: Plain,
      Input: Plain,
    } as unknown as AdvancedUI,
    platform,
  )
  const root = node('root')
  const app = renderer.createApp({
    setup: () => () =>
      h(TreeSelect, {
        label: 'Topics',
        multiple,
        animated: animated.value,
        nodes: [
          {
            id: 'guides',
            label: 'Guides',
            children: [
              { id: 'install', label: 'Install' },
              { id: 'theme', label: 'Themes' },
            ],
          },
          {
            id: 'api',
            label: 'Reference',
            selectable: false,
            children: [{ id: 'button', label: 'Button' }],
          },
        ],
        modelValue: selected.value,
        expanded: expanded.value,
        'onUpdate:modelValue': (value: string[]) => {
          selected.value = value
        },
        'onUpdate:expanded': (value: string[]) => {
          expanded.value = value
        },
      }),
  })
  app.mount(root)
  const all = (parent: TestNode = root): TestNode[] => [parent, ...parent.children.flatMap(all)]
  const control = (tag: string, text?: string) => {
    const result = all().find(
      (item) => item.tag === tag && (text === undefined || item.text === text),
    )
    if (!result) throw new Error(`Missing ${tag}: ${text}`)
    return result
  }
  const click = async (tag: string, text?: string) => {
    fire(control(tag, text), 'onClick')
    await nextTick()
  }
  return { app, click, control, motions, writes, selected, animated }
}

describe.each(['web', 'native'] as const)('TreeSelect stable option boxes (%s)', (platform) => {
  it('keeps selection usable during entry without translating existing options across new controls', async () => {
    const f = fixture(platform)
    await f.click('trigger')
    const reference = f.control('choice', 'Reference')
    await f.click('button', '+')
    const entries = f.motions.length
    expect(entries).toBe(4)
    expect(f.control('choice', 'Reference')).toBe(reference)
    // Every entry is deliberately still running: choosing another row must not restart
    // spatial layout motion or let Reference sweep across the new Themes hit target.
    await f.click('choice', 'Install')
    await f.click('choice', 'Themes')
    expect(f.selected.value).toEqual(['install', 'theme'])
    expect(f.motions).toHaveLength(entries)
    expect(f.motions.map((motion) => motion.frames)).toEqual(
      Array(entries).fill({ opacity: [0, 1] }),
    )
    f.app.unmount()
    for (const motion of f.motions) expect(motion.stop).toHaveBeenCalledOnce()
  })

  it('commits a single choice while entry is active and releases the closing rows', async () => {
    const f = fixture(platform, false)
    await f.click('trigger')
    await f.click('button', '+')
    await f.click('button', 'Themes')
    expect(f.selected.value).toEqual(['theme'])
    expect(f.control('trigger').text).toBe('Themes')
    for (const motion of f.motions) expect(motion.stop).toHaveBeenCalledOnce()
    f.app.unmount()
  })

  it('settles existing entry paint and does not animate new rows when disabled', async () => {
    const f = fixture(platform)
    await f.click('trigger')
    expect(f.motions).toHaveLength(2)
    f.animated.value = false
    await nextTick()
    for (const motion of f.motions) expect(motion.stop).toHaveBeenCalledOnce()
    expect(f.writes).toEqual([{ opacity: 1 }, { opacity: 1 }])
    await f.click('button', '+')
    expect(f.motions).toHaveLength(2)
    await f.click('choice', 'Themes')
    expect(f.selected.value).toEqual(['theme'])
    f.app.unmount()
  })
})
