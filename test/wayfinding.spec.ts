import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import {
  breadcrumbParts,
  filterCommands,
  validateRail,
  validateTimeline,
} from '../packages/core/src/wayfinding.js'
import { chartGeometry, chartHitTest } from '../packages/core/src/chart.js'
import {
  createMavis,
  MCommandPalette,
  MNavigationRail,
  MBreadcrumb,
  MTooltip,
  MTimeline,
  MChart,
} from '../packages/web/src/index.js'

describe('wayfinding contracts', () => {
  it('searches accent-insensitive terms across labels, descriptions and keywords without losing identity', () => {
    const items = [
      { value: 1, label: 'Análise do café', keywords: ['exportar', 'report'] },
      { value: '1', label: 'Invitar', disabled: true },
    ]
    expect(filterCommands(items, 'CAFE report')).toEqual([items[0]])
    expect(filterCommands(items, 'invitar')).toEqual([items[1]])
    expect(filterCommands(items, '')).toEqual(items)
    expect(() => filterCommands([...items, items[0]!], '')).toThrow(/unique/)
  })
  it('collapses only the middle path and rejects broken ancestors or duplicate navigation identities', () => {
    const items = Array.from({ length: 6 }, (_, key) => ({
      key,
      label: `Page ${key}`,
      ...(key < 5 ? { href: `/page/${key}` } : {}),
    }))
    const parts = breadcrumbParts(items, 3)
    expect(parts.before.map((item) => item.key)).toEqual([0])
    expect(parts.hidden.map((item) => item.key)).toEqual([1, 2, 3])
    expect(parts.after.map((item) => item.key)).toEqual([4, 5])
    expect(() => breadcrumbParts(items, 1)).toThrow(/at least 2/)
    expect(() =>
      breadcrumbParts(
        [
          { key: 'a', label: 'A' },
          { key: 'b', label: 'B' },
        ],
        4,
      ),
    ).toThrow(/destinations/)
    expect(() =>
      validateRail([
        { key: 'a', label: 'A', items: [{ value: 1, label: 'One', href: '/' }] },
        { key: 'b', label: 'B', items: [{ value: 1, label: 'Again', href: '/b' }] },
      ]),
    ).toThrow(/unique/)
    expect(() =>
      validateRail([
        {
          key: 'a',
          label: 'A',
          items: [{ value: 'x', label: 'Bad', href: 'javascript:alert(1)' }],
        },
      ]),
    ).toThrow(/executable/)
  })
  it('validates timeline keys while allowing caller-owned localized timestamps', () => {
    expect(() =>
      validateTimeline([
        { key: 1, title: 'Done', time: 'ontem', status: 'complete' },
        { key: '1', title: 'Next', status: 'upcoming' },
      ]),
    ).not.toThrow()
    expect(() =>
      validateTimeline([
        { key: 1, title: 'Done' },
        { key: 1, title: 'Duplicate' },
      ]),
    ).toThrow(/unique/)
  })
})

describe('chart geometry', () => {
  const categories = [
    { key: 1, label: 'A' },
    { key: '1', label: 'B' },
    { key: 3, label: 'C' },
  ]
  it('shares a signed scale across series and preserves null gaps', () => {
    const scene = chartGeometry(categories, [
      { key: 'one', label: 'One', values: [-10, null, 30] },
      { key: 'two', label: 'Two', values: [0, 10, 20] },
    ])
    expect(scene.min).toBe(-10)
    expect(scene.max).toBe(30)
    expect(scene.zero).toBe(0.75)
    expect(scene.series[0]!.points).toEqual([
      { x: 1 / 6, y: 1, index: 0, value: -10 },
      null,
      { x: 5 / 6, y: 0, index: 2, value: 30 },
    ])
    expect(scene.ticks).toEqual([-10, 0, 10, 20, 30])
  })
  it('handles empty and constant data without dividing by zero', () => {
    expect(chartGeometry([], []).ticks).toEqual([0, 0.25, 0.5, 0.75, 1])
    expect(chartGeometry([], [], [0, Number.MAX_VALUE]).ticks.every(Number.isFinite)).toBe(true)
    const zero = chartGeometry(categories, [{ key: 'zero', label: 'Zero', values: [0, 0, 0] }])
    expect(zero.series[0]!.points.every((point) => point?.y === 1)).toBe(true)
    expect(
      chartGeometry(categories, [{ key: 'gap', label: 'Gap', values: [null, null, null] }])
        .series[0]!.points,
    ).toEqual([null, null, null])
  })
  it('uses bar group positions and line proximity without selecting missing data', () => {
    const scene = chartGeometry(
      [{ key: 'a', label: 'A' }],
      [
        { key: 'one', label: 'One', values: [3] },
        { key: 'two', label: 'Two', values: [5] },
        { key: 'empty', label: 'Empty', values: [null] },
      ],
    )
    expect(chartHitTest(scene, 'bar', 0.2, 0)).toEqual({ category: 0, series: 0 })
    expect(chartHitTest(scene, 'bar', 0.5, 1)).toEqual({ category: 0, series: 1 })
    expect(chartHitTest(scene, 'bar', 0.8, 0)).toBeNull()
    expect(chartHitTest(scene, 'line', 0.5, 0)).toEqual({ category: 0, series: 1 })
    expect(chartHitTest(scene, 'line', 0.5, 1)).toEqual({ category: 0, series: 0 })
    expect(chartHitTest(scene, 'line', NaN, 0)).toBeNull()
  })
  it('rejects non-finite, unmatched and misleading out-of-domain data', () => {
    const series = (values: readonly (number | null)[]) => [{ key: 'a', label: 'A', values }]
    expect(() => chartGeometry(categories, series([1, 2]))).toThrow(/one value/)
    expect(() => chartGeometry(categories, series([NaN, 1, 2]))).toThrow(/finite/)
    expect(() => chartGeometry(categories, series([1, 2, 3]), [0, 2])).toThrow(/contain/)
    expect(() => chartGeometry(categories, series([1, 2, 3]), [3, 3])).toThrow(/increasing/)
    expect(() =>
      chartGeometry(categories, series([-Number.MAX_VALUE, 0, Number.MAX_VALUE])),
    ).toThrow(/span/)
    expect(() =>
      chartGeometry(categories, [{ ...series([1, 2, 3])[0]!, color: 'var(--accent)' }]),
    ).toThrow(/hex/)
    expect(() =>
      chartGeometry(
        Array.from({ length: 101 }, (_, key) => ({ key, label: String(key) })),
        [],
      ),
    ).toThrow(/100/)
  })
})

it('renders six controls on the server with stable identities and request-local state', async () => {
  async function render() {
    const app = createSSRApp({
      render: () =>
        h('main', [
          h(MCommandPalette, {
            label: 'Commands',
            items: [{ value: 'a', label: 'Action' }],
            shortcut: true,
          }),
          h(MNavigationRail, {
            label: 'Navigate',
            groups: [
              { key: 'g', label: 'Group', items: [{ value: 'a', label: 'Home', href: '/' }] },
            ],
            modelValue: 'a',
          }),
          h(MBreadcrumb, {
            items: [
              { key: 'a', label: 'Home', href: '/' },
              { key: 'b', label: 'Here' },
            ],
          }),
          h(MTooltip, { triggerLabel: 'Help', text: 'Context' }),
          h(MTimeline, {
            label: 'Activity',
            items: [{ key: 'a', title: 'Created', time: 'Yesterday' }],
          }),
          h(MChart, {
            label: 'Revenue',
            categories: [{ key: 'a', label: 'November' }],
            series: [{ key: 's', label: 'Sales', values: [42] }],
            showData: true,
          }),
        ]),
    })
    app.use(createMavis())
    return renderToString(app)
  }
  const [a, b] = await Promise.all([render(), render()])
  expect(a).toBe(b)
  expect(a).toContain('aria-current="page"')
  expect(a).toContain('role="tooltip"')
  expect(a).toContain('Sales: 42')
  expect(a).not.toContain('NaN')
  expect(a).not.toContain('Infinity')
})
