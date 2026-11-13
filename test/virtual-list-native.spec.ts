import { describe, expect, it, vi } from 'vitest'
import { h, nextTick, ref } from 'vue'
import { renderer, node, find, fire } from './renderer.js'

const evidence = vi.hoisted(() => ({ events: [] as string[], controls: [] as any[] }))
vi.mock('nativescript-vue', async () => ({
  ...(await import('vue')),
  registerElement() {},
  useItemTemplates: () => ({
    itemTemplates: [{ key: 'default', createView() {} }],
    cellVNodes: () => [],
    renderCell: ({ item }: { item: { id: number } }, previous: any) => {
      evidence.events.push(`render:${item.id}`)
      return Object.assign(previous ?? {}, { key: item.id })
    },
  }),
}))
vi.mock('@nativescript/core', () => ({
  isAndroid: true,
  ListView: class {
    static itemLoadingEvent = 'itemLoading'
  },
}))
vi.mock('../packages/nativescript/src/vue/components/MText.ts', () => ({ MText: 'Label' }))
vi.mock('@getcortexlabs/mavis-core/vue', async (original) => {
  const { mavis } = await import('../packages/core/src/index.js')
  return { ...(await original<object>()), useMavisTheme: () => ({ theme: { value: mavis } }) }
})
vi.mock('@rafaelaugusto/jolt', () => ({
  listChanges: (view: FakeList, options: { key: (item: unknown) => string }) => {
    const recycling = (event: any) => evidence.events.push(`recycle:${event.view?.key}`)
    view.on('itemLoading', recycling)
    const control = {
      disposed: false,
      update: vi.fn((items: unknown[]) => {
        view.items = items
      }),
      stop: vi.fn(),
      pause: vi.fn(),
      play: vi.fn(),
      dispose: vi.fn(() => {
        control.disposed = true
        view.off('itemLoading', recycling)
      }),
      options,
    }
    evidence.controls.push(control)
    return control
  },
}))
import { MVirtualList } from '../packages/nativescript/src/vue/components/MVirtualList.js'

class FakeList {
  isLoaded = true
  rowHeight = 56
  handlers = new Set<(event: any) => void>()
  cells: any[] = []
  data: unknown[] = []
  on(_name: string, callback: (event: any) => void) {
    this.handlers.add(callback)
  }
  off(_name: string, callback: (event: any) => void) {
    this.handlers.delete(callback)
  }
  scrollToIndex = vi.fn()
  set items(items: unknown[]) {
    this.data = items
    items.slice(0, 4).forEach((_item, index) => {
      const event = { index, view: this.cells[index] }
      for (const handler of this.handlers) handler(event)
      this.cells[index] = event.view
    })
  }
  get items() {
    return this.data
  }
}

describe('native list data ownership', () => {
  it('recycles before Vue changes a cell key and commits each change through Jolt once', async () => {
    evidence.events = []
    evidence.controls = []
    const items = ref(Array.from({ length: 200 }, (_, id) => ({ id })))
    const animated = ref(true)
    const root = node('root')
    const app = renderer.createApp({
      render: () =>
        h(MVirtualList, {
          items: items.value,
          label: 'Rows',
          rowHeight: 56,
          height: 224,
          animated: animated.value,
        }),
    })
    app.mount(root)
    const host = find(root, 'MavisVirtualList')
    expect(host.props).not.toHaveProperty('items')
    const view = new FakeList()
    fire(host, 'onLoaded', { object: view })
    await nextTick()
    const owner = evidence.controls[0]
    expect(view.items).toHaveLength(200)
    evidence.events = []
    items.value = [...items.value].reverse()
    await nextTick()
    expect(owner.update).toHaveBeenCalledTimes(1)
    expect(evidence.events.slice(0, 4)).toEqual([
      'recycle:0',
      'render:199',
      'recycle:1',
      'render:198',
    ])
    animated.value = false
    await nextTick()
    expect(owner.pause).toHaveBeenCalledTimes(1)
    app.unmount()
    expect(owner.dispose).toHaveBeenCalledTimes(1)
    expect(view.handlers.size).toBe(0)
  })
})
