import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref, resolveComponent, type App } from 'vue'
import { press } from '@rafaelaugusto/jolt'
import { mavis, midnight } from '../packages/nativescript/src/index.js'
import {
  createMavis,
  MButton,
  MCard,
  MColumn,
  MRow,
  MSlider,
  MText,
  useMavisTheme,
} from '../packages/nativescript/src/vue/index.js'
import { sliderScale } from '../packages/core/src/slider.js'
import { fire, find, node, renderer } from './renderer.js'

vi.mock('@rafaelaugusto/jolt', () => ({ press: vi.fn(() => vi.fn()) }))
const platform = vi.hoisted(() => ({ isAndroid: true }))
vi.mock('@nativescript/core', () => platform)
vi.mock('@rafaelaugusto/jolt/vue', () => ({ JoltTransition: {} }))

const apps: App[] = []
afterEach(() => {
  for (const app of apps.splice(0)) app.unmount()
  platform.isAndroid = true
})

function mount(component: Parameters<typeof renderer.createApp>[0], dark = false) {
  const root = node('root')
  const app = renderer.createApp(component)
  app.use(createMavis({ theme: dark ? midnight : mavis }))
  app.mount(root)
  apps.push(app)
  return { root, app }
}

describe('Vue integration', () => {
  it('activates a whole interactive card and releases feedback when disabled', async () => {
    const disabled = ref(false)
    const clicks = vi.fn()
    const { root } = mount({
      render: () =>
        h(
          MCard,
          {
            interactive: true,
            disabled: disabled.value,
            accessibilityLabel: 'Open collection',
            onClick: clicks,
          },
          { default: () => h(MText, { text: 'Collection' }) },
        ),
    })
    const card = find(root, 'FlexboxLayout')
    const native = { scaleX: 1, scaleY: 1 }
    fire(card, 'onLoaded', { object: native })
    expect(card.props.accessibilityRole).toBe('button')
    fire(card, 'onTap')
    expect(clicks).toHaveBeenCalledOnce()
    native.scaleX = 0.97
    disabled.value = true
    await nextTick()
    fire(card, 'onTap')
    expect(clicks).toHaveBeenCalledOnce()
    expect(native.scaleX).toBe(1)
    expect(card.props.accessibilityState).toBe('disabled')
  })
  it('resolves m-* names and updates existing views when the theme changes', async () => {
    let changeTheme!: () => void
    const { root } = mount(
      defineComponent({
        setup() {
          const { setTheme } = useMavisTheme()
          changeTheme = () => setTheme(midnight)
          return () =>
            h(
              resolveComponent('m-column'),
              { gap: 'lg' },
              {
                default: () => h(resolveComponent('m-button'), {}, { default: () => 'Continuar' }),
              },
            )
        },
      }),
    )
    const button = find(root, 'Button')
    expect(button.props.text).toBe('Continuar')
    expect(button.props.style).toMatchObject({ backgroundColor: mavis.colors.primary })
    changeTheme()
    await nextTick()
    expect(find(root, 'Button')).toBe(button)
    expect(button.props.style).toMatchObject({ backgroundColor: midnight.colors.primary })
    expect(find(root, 'FlexboxLayout').props.style).toMatchObject({ gap: 24 })
  })

  it('keeps theme changes scoped to their app', async () => {
    let changeTheme!: () => void
    const first = mount(
      defineComponent({
        setup() {
          const { setTheme } = useMavisTheme()
          changeTheme = () => setTheme(midnight)
          return () => h(MText, { text: 'First' })
        },
      }),
    )
    const second = mount({ render: () => h(MText, { text: 'Second' }) })
    changeTheme()
    await nextTick()
    expect(find(first.root, 'Label').props.style).toMatchObject({ color: midnight.colors.text })
    expect(find(second.root, 'Label').props.style).toMatchObject({ color: mavis.colors.text })
  })

  it('blocks clicks while disabled or loading and releases press feedback', async () => {
    const disabled = ref(false),
      loading = ref(false),
      clicks = vi.fn()
    const { root, app } = mount({
      render: () =>
        h(
          MButton,
          {
            disabled: disabled.value,
            loading: loading.value,
            onClick: clicks,
          },
          { default: () => 'Salvar' },
        ),
    })
    const button = find(root, 'Button')
    const native = { scaleX: 1, scaleY: 1 }
    fire(button, 'onLoaded', { object: native })
    expect(press).toHaveBeenCalledTimes(1)
    const remove = vi.mocked(press).mock.results[0]!.value
    native.scaleX = 0.97
    fire(button, 'onTap')
    expect(clicks).toHaveBeenCalledTimes(1)
    disabled.value = true
    await nextTick()
    fire(button, 'onTap')
    expect(clicks).toHaveBeenCalledTimes(1)
    expect(remove).toHaveBeenCalledTimes(1)
    expect(native.scaleX).toBe(1)
    expect(button.props.isEnabled).toBe(false)
    expect(button.props.accessibilityState).toBe('disabled')
    disabled.value = false
    loading.value = true
    await nextTick()
    expect(button.props.text).toBe('Loading…')
    expect(button.props.accessibilityLabel).toBe('Loading…')
    fire(button, 'onTap')
    expect(clicks).toHaveBeenCalledTimes(1)
    loading.value = false
    await nextTick()
    expect(press).toHaveBeenCalledTimes(2)
    expect(button.props.accessibilityState).toBeNull()
    const lastRemove = vi.mocked(press).mock.results[1]!.value
    app.unmount()
    apps.splice(apps.indexOf(app), 1)
    expect(lastRemove).toHaveBeenCalledTimes(1)
  })

  it('updates slot text and preserves local styles alongside theme defaults', async () => {
    const text = ref('One')
    const { root } = mount({
      render: () =>
        h(
          MColumn,
          { padding: 'lg', paddingX: 'sm', style: { opacity: 0.8 } },
          {
            default: () => h(MText, { as: 'h1', variant: 'title' }, { default: () => text.value }),
          },
        ),
    })
    text.value = 'Two'
    await nextTick()
    expect(find(root, 'Label').props.text).toBe('Two')
    expect(find(root, 'Label').props).toMatchObject({
      accessible: true,
      accessibilityRole: 'header',
    })
    expect(find(root, 'FlexboxLayout').props.style).toMatchObject({
      paddingTop: 24,
      paddingLeft: 8,
      opacity: 0.8,
    })
  })

  it('preserves content height in columns and allows text to fit inside rows', () => {
    const column = mount({
      render: () =>
        h(
          MColumn,
          {},
          {
            default: () => h(MText, { text: 'Long content' }),
          },
        ),
    })
    const row = mount({
      render: () =>
        h(
          MColumn,
          {},
          {
            default: () => h(MRow, {}, { default: () => h(MText, { text: 'Long content' }) }),
          },
        ),
    })
    expect(find(column.root, 'Label').props.style).toMatchObject({ flexShrink: 0 })
    expect(find(row.root, 'Label').props.style).toMatchObject({ flexShrink: 1 })
  })

  it('releases a press effect on unload and attaches it once on reload', () => {
    const { root } = mount({ render: () => h(MButton, { text: 'Open' }) })
    const button = find(root, 'Button')
    const native = { scaleX: 1, scaleY: 1 }
    fire(button, 'onLoaded', { object: native })
    const remove = vi.mocked(press).mock.results[0]!.value
    fire(button, 'onUnloaded')
    expect(remove).toHaveBeenCalledOnce()
    fire(button, 'onLoaded', { object: native })
    expect(press).toHaveBeenCalledTimes(2)
  })

  it('preserves the semantic slider range on iOS and snaps fractional input', async () => {
    platform.isAndroid = false
    const changes = vi.fn()
    const { root } = mount({
      render: () =>
        h(MSlider, {
          modelValue: 21,
          min: 16,
          max: 28,
          step: 0.5,
          label: 'Temperature',
          'onUpdate:modelValue': changes,
        }),
    })
    const slider = find(root, 'Slider')
    expect(slider.props).toMatchObject({
      minValue: 16,
      maxValue: 28,
      value: 21,
      accessibilityValue: '21',
    })
    fire(slider, 'onValueChange', { value: 22.3 })
    expect(changes).toHaveBeenCalledWith(22.5)
  })

  it('snaps slider input and does not emit feedback for model updates', async () => {
    const value = ref(21),
      changes = vi.fn()
    const { root } = mount({
      render: () =>
        h(MSlider, {
          modelValue: value.value,
          min: 16,
          max: 28,
          step: 0.5,
          label: 'Temperature',
          'onUpdate:modelValue': (next: number) => {
            changes(next)
            value.value = next
          },
        }),
    })
    const slider = find(root, 'Slider')
    fire(slider, 'onValueChange', { value: 10 })
    expect(changes).not.toHaveBeenCalled()
    fire(slider, 'onValueChange', { value: 12.6 })
    await nextTick()
    expect(value.value).toBe(22.5)
    expect(slider.props.value).toBe(13)
    fire(slider, 'onValueChange', { value: 13 })
    expect(changes).toHaveBeenCalledTimes(1)
    expect(sliderScale(0, 1, 0.1).fromNative(3)).toBe(0.3)
    expect(sliderScale(16, 28, 0.5).fromNative(200)).toBe(28)
    expect(sliderScale(0, 1, 0.3).fromNative(4)).toBe(1)
    expect(() => sliderScale(16, 28, 0)).toThrow(RangeError)
  })
})
