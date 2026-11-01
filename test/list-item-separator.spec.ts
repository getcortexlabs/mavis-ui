import { afterEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick, ref, type App, type Component } from 'vue'
import { MListItem as NativeItem } from '../packages/nativescript/src/vue/components/MListItem.js'
import { MSeparator as NativeSeparator } from '../packages/nativescript/src/vue/components/MSeparator.js'
import { MText as NativeText } from '../packages/nativescript/src/vue/components/MText.js'
import { MListItem as WebItem } from '../packages/web/src/components/MListItem.js'
import { MSeparator as WebSeparator } from '../packages/web/src/components/MSeparator.js'
import { MText as WebText } from '../packages/web/src/components/MText.js'
import { listItemLabel } from '../packages/core/src/list-item.js'
import { renderer, node, fire, type TestNode } from './renderer.js'
vi.mock('@nativescript/core', () => ({}))
const press = vi.hoisted(() => ({ attach: vi.fn(), release: vi.fn() }))
vi.mock('../packages/nativescript/src/native/press.ts', () => ({
  attachPressFeedback: (...args: unknown[]) => {
    press.attach(...args)
    return press.release
  },
}))
let app: App | undefined
afterEach(() => {
  app?.unmount()
  app = undefined
})
const all = (root: TestNode): TestNode[] => [root, ...root.children.flatMap(all)]
function mount(
  component: Component,
  props: Record<string, unknown>,
  slots?: Record<string, () => unknown>,
) {
  const root = node('root')
  app = renderer.createApp({ render: () => h(component, props, slots) })
  app.mount(root)
  return root
}

it('requires a title and derives the action name without reading arbitrary slots', () => {
  expect(listItemLabel(' Marina ', ' Design ')).toBe('Marina. Design')
  expect(listItemLabel('Marina', '', 'Open Marina, available')).toBe('Open Marina, available')
  expect(() => listItemLabel('  ', 'Description')).toThrow(RangeError)
})

for (const [platform, Item, Separator, Text] of [
  ['native', NativeItem, NativeSeparator, NativeText],
  ['web', WebItem, WebSeparator, WebText],
] as const) {
  const native = platform === 'native'
  describe(`${platform} ListItem and Separator`, () => {
    it('only activates enabled interactive rows and updates names and semantics', async () => {
      const props = ref({
        title: 'Marina',
        description: 'Design',
        interactive: true,
        disabled: false,
      })
      const click = vi.fn(),
        root = node('root')
      app = renderer.createApp({
        render: () =>
          h(
            Item,
            { ...props.value, onClick: click },
            { leading: () => h(Text, { text: 'Visual' }) },
          ),
      })
      app.mount(root)
      const row = root.children[0]!
      expect(row.props[native ? 'accessibilityLabel' : 'aria-label']).toBe('Marina. Design')
      fire(row, native ? 'onTap' : 'onClick')
      expect(click).toHaveBeenCalledExactlyOnceWith()
      props.value.disabled = true
      await nextTick()
      fire(row, native ? 'onTap' : 'onClick')
      expect(click).toHaveBeenCalledOnce()
      expect(row.props[native ? 'accessibilityState' : 'aria-disabled']).toBe(
        native ? 'disabled' : true,
      )
      props.value.title = 'Joana'
      await nextTick()
      expect(row.props[native ? 'accessibilityLabel' : 'aria-label']).toBe('Joana. Design')
      props.value.interactive = false
      props.value.disabled = false
      await nextTick()
      fire(row, native ? 'onTap' : 'onClick')
      expect(click).toHaveBeenCalledOnce()
      expect(row.props[native ? 'accessibilityRole' : 'role']).toBe(native ? '' : null)
      expect(row.props[native ? 'accessibilityLabel' : 'aria-label']).toBe(
        native ? undefined : null,
      )
    })
    it('keeps static child controls independent and only hides native content in action rows', async () => {
      const interactive = ref(false),
        childClick = vi.fn(),
        rowClick = vi.fn(),
        root = node('root')
      app = renderer.createApp({
        render: () =>
          h(
            Item,
            { title: 'Saved', interactive: interactive.value, onClick: rowClick },
            {
              leading: () => h(Text, { text: 'Identity' }),
              trailing: () =>
                h(
                  native ? 'Button' : 'button',
                  { [native ? 'onTap' : 'onClick']: childClick },
                  'Save',
                ),
            },
          ),
      })
      app.mount(root)
      const button = all(root).find((el) => el.tag === (native ? 'Button' : 'button'))!
      fire(button, native ? 'onTap' : 'onClick')
      expect(childClick).toHaveBeenCalledOnce()
      expect(rowClick).not.toHaveBeenCalled()
      if (native) {
        const text = all(root).find((el) => el.props.text === 'Identity')!
        expect(text.props.accessibilityHidden).toBe(false)
        interactive.value = true
        await nextTick()
        expect(text.props.accessibilityHidden).toBe(true)
      }
    })
    it('swaps separator axes and margins without leaving the previous dimensions', async () => {
      const props = ref({
          orientation: 'horizontal' as 'horizontal' | 'vertical',
          length: 80,
          spacing: 'sm' as const,
          inset: 'md' as const,
        }),
        root = node('root')
      app = renderer.createApp({
        render: () => h(Separator, props.value, { default: () => h('button', 'Must not mount') }),
      })
      app.mount(root)
      const line = root.children[0]!,
        unit = (n: number) => (native ? n : `${n}px`)
      expect(line.children).toHaveLength(0)
      expect(line.props.style).toMatchObject({
        width: unit(80),
        height: unit(1),
        marginLeft: unit(16),
        marginTop: unit(8),
        flexShrink: 0,
      })
      expect(line.props[native ? 'accessibilityHidden' : 'aria-hidden']).toBe(true)
      if (!native) expect(line.props.inert).toBe(true)
      props.value.orientation = 'vertical'
      await nextTick()
      expect(line.props.style).toMatchObject({
        width: unit(1),
        height: unit(80),
        marginLeft: unit(8),
        marginTop: unit(16),
      })
    })
    it('stretches automatic lengths and rejects negative geometry', () => {
      const root = mount(Separator, {})
      expect(root.children[0]!.props.style).toMatchObject({ alignSelf: 'stretch' })
      expect(root.children[0]!.props.style).not.toHaveProperty('width')
      app!.unmount()
      app = undefined
      expect(() => mount(Separator, { length: -1 })).toThrow(RangeError)
    })
  })
}

it('releases native row press feedback on disable, unload and unmount', async () => {
  const disabled = ref(false),
    root = node('root')
  app = renderer.createApp({
    render: () => h(NativeItem, { title: 'Open', interactive: true, disabled: disabled.value }),
  })
  app.mount(root)
  const row = root.children[0]!
  fire(row, 'onLoaded', { object: {} })
  expect(press.attach).toHaveBeenCalledOnce()
  disabled.value = true
  await nextTick()
  expect(press.release).toHaveBeenCalledOnce()
  disabled.value = false
  await nextTick()
  expect(press.attach).toHaveBeenCalledTimes(2)
  fire(row, 'onUnloaded')
  expect(press.release).toHaveBeenCalledTimes(2)
  fire(row, 'onLoaded', { object: {} })
  app!.unmount()
  app = undefined
  expect(press.release).toHaveBeenCalledTimes(3)
})
