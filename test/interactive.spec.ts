import {
  numberFlowFractionDigits,
  resolveNumberFlowFormat,
} from '../packages/core/src/number-flow-format.js'
import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import {
  finiteRange,
  moveItem,
  panelValue,
  swipeDestination,
  validateActions,
  validateViewer,
} from '../packages/core/src/interactive.js'
import {
  createMavis,
  MNumberFlow,
  MSortableList,
  MSwipeActions,
  MResizablePanels,
  MImageCompare,
  MImageViewer,
} from '../packages/web/src/index.js'

describe('interactive contracts', () => {
  it('keeps currency precision defaults and rejects unsupported formatter options', () => {
    expect(resolveNumberFlowFormat({ style: 'currency', currency: 'brl' }).currency).toBe('BRL')
    expect(numberFlowFractionDigits({ style: 'currency' }, 0)).toEqual({ minimum: 0, maximum: 0 })
    expect(numberFlowFractionDigits({ style: 'decimal', minimumFractionDigits: 4 })).toEqual({
      minimum: 4,
      maximum: 4,
    })
    expect(numberFlowFractionDigits({ style: 'currency', maximumFractionDigits: 0 })).toEqual({
      minimum: 0,
      maximum: 0,
    })
    expect(numberFlowFractionDigits({ style: 'percent' })).toEqual({ minimum: 0, maximum: 0 })
    expect(() => resolveNumberFlowFormat({ style: 'currency' })).toThrow(/currency code/)
    expect(() =>
      resolveNumberFlowFormat({ minimumFractionDigits: 3, maximumFractionDigits: 1 }),
    ).toThrow(/cannot exceed/)
    expect(() => resolveNumberFlowFormat({ notation: 'compact' } as never)).toThrow(/formatValue/)
  })
  it('reorders immutably by stable identity, keeping number and string keys separate', () => {
    const items = [{ id: 1 }, { id: '1' }, { id: 3 }]
    const next = moveItem(items, 'id', 3, '1')!
    expect(next.items).toEqual([{ id: 1 }, { id: 3 }, { id: '1' }])
    expect(next.move).toEqual({ key: 3, beforeKey: '1', fromIndex: 2, toIndex: 1 })
    expect(next.items[1]).toBe(items[2])
    expect(items).toEqual([{ id: 1 }, { id: '1' }, { id: 3 }])
    expect(moveItem(items, 'id', 1, null)?.items.map((item) => item.id)).toEqual(['1', 3, 1])
  })
  it('does not commit unknown, identical or already-adjacent moves', () => {
    const items = [{ id: 'a' }, { id: 'b' }]
    expect(moveItem(items, 'id', 'a', 'a')).toBeNull()
    expect(moveItem(items, 'id', 'a', 'b')).toBeNull()
    expect(moveItem(items, 'id', 'b', null)).toBeNull()
    expect(moveItem(items, 'id', 'missing', null)).toBeNull()
    expect(moveItem(items, 'id', 'a', 'missing')).toBeNull()
    expect(() => moveItem([{ id: 1 }, { id: 1 }], 'id', 1, null)).toThrow(/unique/)
  })
  it('settles swipe direction using velocity, bounds and logical RTL', () => {
    expect(swipeDestination(55, 0, 96, 96)).toBe('start')
    expect(swipeDestination(-55, 0, 96, 96)).toBe('end')
    expect(swipeDestination(5, 400, 96, 96)).toBe('start')
    expect(swipeDestination(20, 0, 96, 96)).toBeNull()
    expect(swipeDestination(100, 0, 0, 96)).toBeNull()
    expect(swipeDestination(-55, 0, 96, 96, -1)).toBe('start')
  })
  it('rejects duplicate or unnamed actions across the whole row', () => {
    expect(() =>
      validateActions([{ value: 'a', label: 'Archive' }], [{ value: 'a', label: 'Again' }]),
    ).toThrow(/unique/)
    expect(() => validateActions([{ value: 'a', label: ' ' }], [])).toThrow(/labels/)
    expect(() =>
      validateActions([{ value: 1, label: 'One' }], [{ value: '1', label: 'String' }]),
    ).not.toThrow()
  })
  it('validates panel bounds while treating zero as an explicit collapse', () => {
    expect(panelValue(0, 20, 80, true)).toBe(0)
    expect(panelValue(0, 20, 80, false)).toBe(20)
    expect(panelValue(90, 20, 80, true)).toBe(80)
    expect(() => panelValue(30, 80, 20, true)).toThrow()
    expect(() => panelValue(30, -1, 80, true)).toThrow()
    expect(() => panelValue(NaN, 20, 80, true)).toThrow()
    expect(() => finiteRange(Infinity, 0, 100)).toThrow()
  })
  it('rejects ambiguous gallery identities and invalid media before opening', () => {
    expect(() =>
      validateViewer([
        { key: 'a', src: 'a.jpg', alt: 'A' },
        { key: 'a', src: 'b.jpg', alt: 'B' },
      ]),
    ).toThrow(/unique/)
    expect(() => validateViewer([{ key: 1, src: '', alt: 'Photo' }])).toThrow(/src/)
    expect(() => validateViewer([{ key: 1, src: 'a.jpg', alt: ' ' }])).toThrow(/alt/)
    expect(() => validateViewer([{ key: 1, src: 'a.jpg', alt: 'A', aspectRatio: 0 }])).toThrow(
      /positive/,
    )
  })
})

describe('interactive SSR', () => {
  it('rejects invalid durations before an animation can reach Jolt', async () => {
    const app = createSSRApp({ render: () => h(MNumberFlow, { value: 10, duration: 0 }) })
    app.use(createMavis())
    await expect(renderToString(app)).rejects.toThrow('duration must be positive')
  })
  it('renders the six controls without browser globals, clocks or modal presentation', async () => {
    const app = createSSRApp({
      render: () =>
        h('main', [
          h(MNumberFlow, {
            value: 1234.5,
            label: 'Revenue',
            format: { style: 'currency', currency: 'USD' },
          }),
          h(
            MSortableList,
            {
              modelValue: [
                { id: 'a', title: 'Alpha' },
                { id: 'b', title: 'Beta' },
              ],
              label: 'Queue',
              itemLabel: (item) => (item as { title: string }).title,
            },
            {
              default: ({ item }: { item: { title: string } }) => h('input', { value: item.title }),
            },
          ),
          h(
            MSwipeActions,
            {
              label: 'Message',
              start: [{ value: 'star', label: 'Star' }],
              end: [{ value: 'archive', label: 'Archive' }],
            },
            () => h('p', 'Weekend plans'),
          ),
          h(
            MResizablePanels,
            { label: 'Workspace', modelValue: 40 },
            { primary: () => h('p', 'Notes'), secondary: () => h('input', { value: 'Draft' }) },
          ),
          h(MImageCompare, { label: 'Compare', before: 'a.jpg', after: 'b.jpg' }),
          h(MImageViewer, {
            label: 'Gallery',
            images: [{ key: 'a', src: 'a.jpg', alt: 'Alpine lake' }],
            open: true,
          }),
        ]),
    })
    app.use(createMavis())
    const html = await renderToString(app)
    expect(html).toContain('Revenue: $1,234.50')
    expect(html).toContain('Reorder: Alpha')
    expect(html).toContain('Move down: Alpha')
    expect(html).toContain('Weekend plans')
    expect(html).toContain('aria-valuenow="40"')
    expect(html).toContain('aria-valuenow="50"')
    expect(html).toContain('Alpine lake')
    expect(html).not.toContain('<dialog open')
    expect(html).not.toContain('undefined%')
    expect(html).not.toContain('NaN')
  })
  it('keeps full image geometry independent of the compare value and renders collapse without removing drafts', async () => {
    const app = createSSRApp({
      render: () =>
        h('main', [
          h(MImageCompare, { label: 'Compare', before: 'a.jpg', after: 'b.jpg', modelValue: 25 }),
          h(
            MResizablePanels,
            { label: 'Workspace', modelValue: 0, collapsible: true },
            { primary: () => h('input', { value: 'Still here' }), secondary: () => h('p', 'Main') },
          ),
        ]),
    })
    app.use(createMavis())
    const html = await renderToString(app)
    expect(html).toContain('inset(0 75% 0 0)')
    expect(html).toContain('value="Still here"')
    expect(html).toContain('inert')
  })
})
