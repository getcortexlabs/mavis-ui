import { afterEach, expect, it, vi } from 'vitest'
import { h, nextTick, onMounted, onScopeDispose, ref, type Ref } from 'vue'
import type { WebListChangesOptions } from '@rafaelaugusto/jolt/web'
import { createListChanges } from '../node_modules/@rafaelaugusto/jolt/dist/core/list-changes.js'
import { renderer, node, find, fire, type TestNode } from './renderer.js'

const layout = new Set<() => void>()
vi.doMock('../packages/web/src/connected-motion.js', () => ({
  useConnectedMotion(element: Ref<HTMLElement>, _context: unknown, setup: Function) {
    let release: (() => void) | undefined
    onMounted(() => {
      release = setup(
        {
          listChanges(_target: HTMLElement, options: WebListChangesOptions<unknown, string>) {
            const adapter = options.adapter
            return createListChanges(options, {
              items: adapter.items,
              render: adapter.render,
              anchor: adapter.anchor!,
              rows: () => [],
              reduced: () => true,
              capture: () => undefined,
              move: () => {
                throw new Error('This test has no presentation renderer.')
              },
              observe: () => () => {},
              layout(callback) {
                layout.add(callback)
                return () => layout.delete(callback)
              },
            })
          },
        },
        element.value,
      )
    })
    onScopeDispose(() => release?.())
  },
}))
vi.mock('@getcortexlabs/mavis-core/vue', async (original) => {
  const { mavis } = await import('../packages/core/src/index.js')
  return { ...(await original<object>()), useMavisTheme: () => ({ theme: { value: mavis } }) }
})
afterEach(() => {
  layout.clear()
  vi.unstubAllGlobals()
})

it('commits the key anchor before a shrinking spacer can clamp scroll and cancel Jolt restoration', async () => {
  vi.stubGlobal('HTMLElement', class {})
  const { MVirtualList } = await import('../packages/web/src/components/MVirtualList.js')
  const items = ref(Array.from({ length: 200 }, (_, id) => ({ id })))
  const root = node('root')
  const app = renderer.createApp({
    render: () =>
      h(MVirtualList, {
        items: items.value,
        rowHeight: 80,
        height: 320,
        label: 'Records',
      }),
  })
  app.mount(root)
  const viewport = find(root, 'div') as TestNode & { scrollTop: number }
  viewport.scrollTop = 50 * 80 + 17
  fire(viewport, 'onScroll')
  await nextTick()
  const commit = async (next: { id: number }[], expected: number) => {
    items.value = next
    await nextTick()
    // A browser limits scrollTop when the rendered spacer gets shorter. Its
    // scroll event may arrive before Jolt's deferred layout/anchor callback.
    viewport.scrollTop = Math.min(viewport.scrollTop, Math.max(0, next.length * 80 - 320))
    fire(viewport, 'onScroll')
    while (layout.size) {
      const callbacks = [...layout]
      layout.clear()
      callbacks.forEach((callback) => callback())
    }
    await nextTick()
    expect(viewport.scrollTop).toBe(expected)
    expect(next[Math.floor(viewport.scrollTop / 80)]!.id).toBe(50)
  }
  try {
    await commit([{ id: -1 }, ...items.value], 51 * 80 + 17)
    await commit([...items.value].reverse(), 149 * 80 + 17)
    await commit(
      items.value.filter((item) => item.id % 2 === 0),
      74 * 80 + 17,
    )
  } finally {
    app.unmount()
  }
})
