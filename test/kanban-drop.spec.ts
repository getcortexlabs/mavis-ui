import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, inject } from 'vue'
import { renderToString } from '@vue/server-renderer'
import {
  createKanban,
  kanbanDropAllowance,
  kanbanRegistryKey,
  type KanbanRegistry,
} from '../packages/core/src/vue/kanban.js'
import type { KanbanCard, KanbanMove } from '../packages/core/src/dashboard.js'
import { createMavis } from '../packages/web/src/index.js'

const columns = [
  { id: 'to do', title: 'Ideas' },
  { id: 'doing', title: 'Making', limit: 2 },
  { id: 'done', title: 'Done' },
]
const cards: KanbanCard[] = [
  { id: 'a', title: 'A', column: 'to do' },
  { id: 'b', title: 'B', column: 'doing' },
  { id: 'c', title: 'C', column: 'done' },
  { id: 'd', title: 'D', column: 'to do', disabled: true },
  { id: 'e', title: 'E', column: 'done' },
]
const rects: Record<string, { x: number; y: number; width: number; height: number }> = {
  a: { x: 0, y: 100, width: 200, height: 100 },
  d: { x: 0, y: 210, width: 200, height: 100 },
  b: { x: 300, y: 100, width: 200, height: 100 },
  c: { x: 600, y: 100, width: 200, height: 100 },
  e: { x: 600, y: 210, width: 200, height: 100 },
}
const at = (x: number, y: number) => ({ x, y: y - 50, width: 200, height: 100 })

async function board(props: Record<string, unknown> = {}) {
  let registry!: KanbanRegistry<string>
  const pass = defineComponent({
    inheritAttrs: false,
    setup:
      (_, { slots }) =>
      () =>
        h('div', slots.default?.()),
  })
  const Zone = defineComponent({
    inheritAttrs: false,
    props: { column: { type: String, required: true }, raised: Boolean },
    setup(zone, { slots }) {
      registry = inject(kanbanRegistryKey)! as KanbanRegistry<string>
      if (zone.column !== props.unmounted) registry.zones.set(zone.column, `zone:${zone.column}`)
      return () => h('div', slots.default?.())
    },
  })
  const Drag = defineComponent({
    inheritAttrs: false,
    props: { cardId: { type: String, required: true } },
    setup(drag, { slots }) {
      inject(kanbanRegistryKey)!.cards.set(drag.cardId, () => rects[drag.cardId])
      return () => h('div', slots.default?.())
    },
  })
  const ui = Object.fromEntries(
    ['Box', 'Column', 'Row', 'Stack', 'Text', 'Button', 'Menu'].map((name) => [name, pass]),
  )
  const Kanban = createKanban({ ...ui, Zone, Drag } as never, 'web')
  const updates: KanbanCard[][] = [],
    moves: KanbanMove[] = []
  const { unmounted: _, ...rest } = props
  const app = createSSRApp({
    render: () =>
      h(Kanban as never, {
        label: 'Board',
        columns,
        modelValue: cards,
        ...rest,
        'onUpdate:modelValue': (next: KanbanCard[]) => updates.push(next),
        onMove: (move: KanbanMove) => moves.push(move),
      }),
  })
  app.use(createMavis())
  await renderToString(app)
  return { registry, updates, moves }
}

describe('kanban drop policy', () => {
  it('offers the mounted columns as targets, in order, with the room below them', async () => {
    const { registry } = await board({ unmounted: 'doing' })
    expect(registry.targets('a').map(({ id, target, padding }) => [id, target, padding])).toEqual([
      ['c0', 'zone:to do', { bottom: kanbanDropAllowance }],
      ['c2', 'zone:done', { bottom: kanbanDropAllowance }],
    ])
    expect(kanbanDropAllowance).toBe(60)
  })

  it('refuses to start for a locked card, a locked board and a board without dragging', async () => {
    expect((await board()).registry.begin('d', () => {})).toBe(false)
    expect((await board({ disabled: true })).registry.begin('a', () => {})).toBe(false)
    expect((await board({ draggable: false })).registry.begin('a', () => {})).toBe(false)
    expect((await board()).registry.begin('a', () => {})).toBe(true)
  })

  it('inserts before the first card whose middle is below the dragged card', async () => {
    const { registry, updates, moves } = await board()
    registry.begin('a', () => {})
    registry.move('c2', at(600, 200))
    const [, , done] = registry.targets('a')
    expect(registry.targets('a').map((target) => target.accept())).toEqual([false, false, true])
    registry.leave()
    expect(done!.accept()).toBe(true)
    registry.drop()
    expect(updates).toHaveLength(1)
    expect(updates[0]!.map((card) => `${card.id}:${card.column}`)).toEqual([
      'b:doing',
      'c:done',
      'd:to do',
      'a:done',
      'e:done',
    ])
    expect(moves).toEqual([expect.objectContaining({ id: 'a', to: 'done' })])
    registry.drop()
    expect(updates).toHaveLength(1)
  })

  it('appends below the last card and follows the latest position', async () => {
    const { registry, updates } = await board()
    registry.begin('a', () => {})
    registry.move('c2', at(600, 120))
    registry.move('c2', at(600, 400))
    registry.drop()
    expect(updates[0]!.map((card) => card.id)).toEqual(['b', 'c', 'd', 'e', 'a'])
  })

  it('rejects a column at capacity and a release outside every column', async () => {
    const full = await board({
      modelValue: cards.map((card) => (card.id === 'c' ? { ...card, column: 'doing' } : card)),
    })
    full.registry.begin('a', () => {})
    full.registry.move('c1', at(300, 120))
    expect(full.registry.targets('a').some((target) => target.accept())).toBe(false)
    full.registry.drop()
    expect(full.updates).toEqual([])

    const outside = await board()
    outside.registry.begin('a', () => {})
    outside.registry.move('c2', at(600, 120))
    outside.registry.move(undefined, at(900, 900))
    expect(outside.registry.targets('a').some((target) => target.accept())).toBe(false)
    outside.registry.drop()
    expect(outside.updates).toEqual([])
  })

  it('keeps cards hidden by the filter when a visible one moves', async () => {
    const { registry, updates } = await board({ query: 'a' })
    registry.begin('a', () => {})
    registry.move('c1', at(300, 400))
    registry.drop()
    expect(updates[0]).toHaveLength(cards.length)
    expect(updates[0]!.find((card) => card.id === 'a')!.column).toBe('doing')
  })

  it('gives the board to the latest drag and ignores a finish from another card', async () => {
    const { registry, updates } = await board()
    const first = vi.fn()
    registry.begin('a', first)
    registry.move('c2', at(600, 400))
    registry.begin('b', () => {})
    expect(first).toHaveBeenCalledOnce()
    registry.finish('a')
    registry.move('c2', at(600, 400))
    registry.drop()
    expect(updates[0]!.find((card) => card.id === 'b')!.column).toBe('done')
    expect(updates[0]!.find((card) => card.id === 'a')!.column).toBe('to do')
  })
})
