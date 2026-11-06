import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import {
  donutGeometry,
  sparklineGeometry,
  moveKanban,
  validateKanban,
  effectColors,
} from '../packages/core/src/dashboard.js'
import {
  createMavis,
  MKanban,
  MDonutChart,
  MSparkline,
  MGradientBackground,
  MParticleField,
  MConfetti,
} from '../packages/web/src/index.js'
const columns = [
  { id: 'todo', title: 'Ideas' },
  { id: 'doing', title: 'Making', limit: 2 },
  { id: 'done', title: 'Done' },
]
const cards = [
  { id: 'a', title: 'A', column: 'todo', metadata: { color: 'green' } },
  { id: 'b', title: 'B hidden by filter', column: 'doing' },
  { id: 'c', title: 'C', column: 'doing' },
  { id: 'd', title: 'D', column: 'todo', disabled: true },
]
const render = (
  component: Parameters<typeof h>[0],
  props: Record<string, unknown>,
  text?: string,
) => {
  const app = createSSRApp({
    render: () =>
      h(component as never, props, text ? { default: () => h('button', text) } : undefined),
  })
  app.use(createMavis())
  return renderToString(app)
}
describe('dashboard contracts', () => {
  it('retains hidden cards and app metadata when moving by stable identity', () => {
    const result = moveKanban(columns, cards, 'a', 'done')!
    expect(result.cards.map((c) => c.id)).toEqual(['b', 'c', 'd', 'a'])
    expect(result.cards.at(-1)?.metadata).toBe(cards[0]!.metadata)
    expect(cards[0]!.column).toBe('todo')
    expect(result.move).toEqual({ id: 'a', from: 'todo', to: 'done', before: null })
  })
  it('counts filtered-out cards against capacity and rejects disabled/invalid destinations', () => {
    expect(moveKanban(columns, cards, 'a', 'doing')).toBeNull()
    expect(moveKanban(columns, cards, 'd', 'done')).toBeNull()
    expect(moveKanban(columns, cards, 'a', 'missing')).toBeNull()
    expect(moveKanban(columns, cards, 'a', 'done', 'b')).toBeNull()
  })
  it('reorders a full column without consuming extra capacity and suppresses no-op updates', () => {
    expect(
      moveKanban(columns, cards, 'c', 'doing', 'b')
        ?.cards.filter((c) => c.column === 'doing')
        .map((c) => c.id),
    ).toEqual(['c', 'b'])
    expect(moveKanban(columns, cards, 'c', 'doing')).toBeNull()
    expect(moveKanban(columns, cards, 'b', 'doing', 'b')).toBeNull()
  })
  it('rejects ambiguous identity and orphan cards', () => {
    expect(() => validateKanban(columns, [...cards, cards[0]!])).toThrow(/unique/)
    expect(() => validateKanban(columns, [{ id: 'x', title: 'X', column: 'missing' }])).toThrow(
      /column/,
    )
    expect(() => validateKanban([{ id: 'a', title: 'A', limit: 1.2 }], [])).toThrow(/integer/)
  })
  it('creates contiguous arcs by ID and handles an all-zero distribution', () => {
    const result = donutGeometry([
      { id: 'a', label: 'A', value: 3 },
      { id: 'b', label: 'B', value: 1 },
    ])
    expect(result.total).toBe(4)
    expect(result.segments.map((s) => [s.start, s.end])).toEqual([
      [0, 0.75],
      [0.75, 1],
    ])
    expect(donutGeometry([{ id: 'a', label: 'A', value: 0 }]).segments[0]?.ratio).toBe(0)
    expect(donutGeometry([])).toEqual({ total: 0, segments: [] })
    expect(() => donutGeometry([{ id: 'a', label: 'A', value: -1 }])).toThrow()
    expect(() => donutGeometry([{ id: 'a', label: 'A', value: Infinity }])).toThrow()
  })
  it('shares chart domain rules, preserves missing samples and paints isolated samples', () => {
    const points = [
      { id: 'a', label: 'A', value: -5 },
      { id: 'b', label: 'B', value: null },
      { id: 'c', label: 'C', value: 10 },
    ]
    const result = sparklineGeometry(points)
    expect([result.min, result.max]).toEqual([-5, 10])
    expect(result.paths).toHaveLength(2)
    expect(result.paths.every((p) => p.d.includes(' L'))).toBe(true)
    expect(sparklineGeometry([]).paths).toEqual([])
    expect(() => sparklineGeometry(points, [0, 10])).toThrow(/contain/)
    expect(() => sparklineGeometry([...points, points[0]!])).toThrow(/unique/)
  })
  it('bounds decorative input without accepting arbitrary CSS', () => {
    expect(effectColors(['#123456', '#abcdef'])).toHaveLength(2)
    for (const colors of [[], ['red', '#000000'], ['url(x)', '#000000']])
      expect(() => effectColors(colors)).toThrow()
  })
})
describe('dashboard server rendering', () => {
  it('keeps filtered capacity and keyboard alternatives in the board', async () => {
    const html = await render(MKanban, { label: 'Studio', columns, modelValue: cards, query: 'A' })
    expect(html).toContain('Making · 2 / 2')
    expect(html).toContain('Column full')
    expect(html).toContain('Move card: A')
  })
  it('renders canonical accessible values and static arcs before enhancement', async () => {
    const html = await render(MDonutChart, {
      label: 'Hours',
      segments: [
        { id: 'a', label: 'Design', value: 75 },
        { id: 'b', label: 'Research', value: 25 },
      ],
    })
    expect(html).toContain('Design · 75 · 75%')
    expect(html).toContain('Total: 100')
    expect(html).toContain('<svg')
  })
  it('keeps sparkline details available without pointer-only interaction', async () => {
    const html = await render(MSparkline, {
      label: 'Revenue',
      points: [
        { id: 'a', label: 'Monday', value: -2 },
        { id: 'b', label: 'Tuesday', value: null },
      ],
      showData: true,
    })
    expect(html).toContain('Monday: -2')
    expect(html).toContain('Tuesday: —')
    expect(html).toContain('View data')
  })
  it('never emits decoration on the server and preserves content inside all effect wrappers', async () => {
    for (const component of [MGradientBackground, MParticleField, MConfetti]) {
      const html = await render(component, { active: true, trigger: 3 }, 'Continue')
      expect(html).toContain('<button>Continue</button>')
      expect(html).not.toContain('<canvas')
    }
  })
})
