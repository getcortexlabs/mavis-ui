import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import {
  moveRange,
  rangeValue,
  ratingValue,
  treeEntries,
  selectPage,
  nextDataSort,
  validateColumns,
  type TreeNode,
} from '../packages/core/src/discovery.js'
import {
  createMavis,
  MDataTable,
  MCarousel,
  MRangeSlider,
  MCalendar,
  MRating,
  MTreeView,
} from '../packages/web/src/index.js'

describe('discovery contracts', () => {
  it('snaps decimal endpoints and clamps crossing without changing thumb identity', () => {
    expect(rangeValue([0.24, 0.76], 0, 1, 0.1)).toEqual([0.2, 0.8])
    expect(moveRange([0.2, 0.8], 0, 1, 0, 1, 0.1)).toEqual([0.8, 0.8])
    expect(moveRange([0.2, 0.8], 1, 0, 0, 1, 0.1)).toEqual([0.2, 0.2])
    expect(moveRange([0, 0.9], 1, 1, 0, 1, 0.3)).toEqual([0, 1])
    expect(() => rangeValue([8, 2], 0, 10, 1)).toThrow(/ordered/)
    expect(() => rangeValue([NaN, 2], 0, 10, 1)).toThrow(/finite/)
  })
  it('keeps off-page selection and number/string identities', () => {
    expect(selectPage(['other', 1], ['1', 2], true)).toEqual(['other', 1, '1', 2])
    expect(selectPage(['other', 1, '1'], ['1', 2], false)).toEqual(['other', 1])
    expect(nextDataSort(null, 'name')).toEqual({ key: 'name', direction: 'ascending' })
    expect(nextDataSort({ key: 'name', direction: 'ascending' }, 'name')).toEqual({
      key: 'name',
      direction: 'descending',
    })
    expect(nextDataSort({ key: 'name', direction: 'descending' }, 'name')).toBeNull()
    expect(() =>
      validateColumns([
        { key: 'a', label: 'A' },
        { key: 'a', label: 'B' },
      ]),
    ).toThrow(/unique/)
  })
  it('validates hidden descendants and cycles while preserving parent/position metadata', () => {
    const nodes: TreeNode[] = [
      { key: 1, label: 'Root', children: [{ key: '1', label: 'Child' }] },
      { key: 2, label: 'Second' },
    ]
    expect(treeEntries(nodes, []).map((entry) => entry.node.key)).toEqual([1, 2])
    expect(treeEntries(nodes, [1])[1]).toMatchObject({
      parent: 1,
      level: 2,
      position: 1,
      siblings: 1,
    })
    const loop: TreeNode = { key: 'loop', label: 'Loop' }
    loop.children = [loop]
    expect(() => treeEntries([loop], [])).toThrow(/cycles/)
    expect(() =>
      treeEntries(
        [{ key: 'root', label: 'Root', children: [{ key: 'root', label: 'Again' }] }],
        [],
      ),
    ).toThrow(/unique/)
  })
  it('supports half ratings and rejects invalid ranges', () => {
    expect(ratingValue(3.6, 5, 0.5)).toBe(3.5)
    expect(ratingValue(9, 5, 1)).toBe(5)
    expect(() => ratingValue(2, 5, 0.25)).toThrow()
  })
})

describe('discovery SSR', () => {
  it('renders all six without a clock or browser and keeps request themes isolated', async () => {
    const render = () => {
      const app = createSSRApp({
        render: () =>
          h('main', [
            h(MDataTable, {
              label: 'People',
              items: [{ id: 1, name: 'Ada' }],
              columns: [{ key: 'name', label: 'Name', sortable: true }],
              selectable: true,
            }),
            h(
              MCarousel,
              {
                label: 'Stories',
                items: [
                  { id: 1, title: 'One' },
                  { id: 2, title: 'Two' },
                ],
              },
              { default: ({ item }: { item: { title: string } }) => h('p', item.title) },
            ),
            h(MRangeSlider, { label: 'Budget', min: 0, max: 100, modelValue: [20, 80] }),
            h(MCalendar, { label: 'Date', initialMonth: '2026-11' }),
            h(MRating, { label: 'Score', modelValue: 3.5, step: 0.5 }),
            h(MTreeView, {
              label: 'Files',
              nodes: [
                { key: 'root', label: 'Root', children: [{ key: 'child', label: 'Hidden child' }] },
              ],
            }),
          ]),
      })
      app.use(createMavis())
      return renderToString(app)
    }
    const [a, b] = await Promise.all([render(), render()])
    expect(a).toEqual(b)
    expect(a).toContain('November 2026')
    expect(a).toContain('role="treeitem"')
    expect(a).not.toContain('Hidden child')
    expect(a).toContain('aria-valuenow="20"')
    expect(a).toContain('<table')
  })
})
