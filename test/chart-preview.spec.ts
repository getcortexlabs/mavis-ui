import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, reactive, type App } from 'vue'
import { createChart } from '../packages/core/src/vue/chart.js'
import type { ChartSelection } from '../packages/core/src/chart.js'
import { renderer, node, find, type TestNode } from './renderer.js'

// Layout adapters are intentionally absent. This verifies the shared presentation/selection
// boundary; the browser suite supplies real SVG coordinates and pointer events.
const part = (tag: string) =>
  defineComponent({
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () => h(tag, attrs, slots.default?.())
    },
  })
const Chart = createChart(
  {
    Row: part('row'),
    Column: part('column'),
    Box: part('box'),
    Text: part('text'),
    Button: part('button'),
    Reveal: part('reveal'),
    Select: part('select'),
    Plot: part('plot'),
  },
  'web',
)
let app: App | undefined
afterEach(() => {
  app?.unmount()
  app = undefined
})
function mount() {
  const state = reactive({
    modelValue: { category: 'mon', series: 1 } as ChartSelection | null,
    categories: [
      { key: 'mon', label: 'Monday' },
      { key: 'tue', label: 'Tuesday' },
    ],
    series: [
      { key: 1, label: 'Numeric', values: [10, 30] as (number | null)[] },
      { key: '1', label: 'Text', values: [20, null] as (number | null)[] },
    ],
    hiddenSeries: [] as (string | number)[],
    disabled: false,
    type: 'line' as 'line' | 'bar',
  })
  const changed = vi.fn()
  const root = node('root')
  app = renderer.createApp(
    defineComponent({
      setup: () => () =>
        h(Chart, {
          ...state,
          label: 'Activity',
          description: 'Overview',
          'onUpdate:modelValue': changed,
        }),
    }),
  )
  app.mount(root)
  const all = (tree: TestNode): TestNode[] => [tree, ...tree.children.flatMap(all)]
  const summary = () => all(root).find((item) => item.props.role === 'status')!.props.text
  const preview = async (hit: { category: number; series: number } | null) => {
    ;(find(root, 'plot').props.onPreview as (hit: unknown) => void)(hit)
    await nextTick()
  }
  return { state, changed, root, summary, preview, all }
}

describe('chart pointer preview', () => {
  it('explores a typed key without selecting, then restores the app selection on leave', async () => {
    const { state, root, changed, summary, preview, all } = mount()
    expect(summary()).toBe('Monday · Numeric: 10')
    await preview({ category: 0, series: 1 })
    expect(summary()).toBe('Monday · Text: 20')
    expect(find(root, 'plot').props.selected).toEqual({ category: 0, series: 1 })
    expect(
      all(root)
        .filter((item) => item.tag === 'select')
        .map((item) => item.props.modelValue),
    ).toEqual(['mon', 1])
    expect(state.modelValue).toEqual({ category: 'mon', series: 1 })
    expect(changed).not.toHaveBeenCalled()
    await preview(null)
    expect(summary()).toBe('Monday · Numeric: 10')
    const select = find(root, 'plot').props.onSelect as (category: number, series: number) => void
    select(0, 1)
    expect(changed).toHaveBeenCalledExactlyOnceWith({ category: 'mon', series: '1' })
    // An emitted proposal does not mutate a controlled model before the app accepts it.
    expect(state.modelValue).toEqual({ category: 'mon', series: 1 })
  })
  it('clears stale previews on data, hidden series, disabled and canonical selection changes', async () => {
    const { state, summary, preview, changed } = mount()
    await preview({ category: 1, series: 0 })
    expect(summary()).toBe('Tuesday · Numeric: 30')
    state.series[0]!.values[1] = 35
    await nextTick()
    expect(summary()).toBe('Monday · Numeric: 10')
    await preview({ category: 1, series: 1 }) // missing mark
    expect(summary()).toBe('Monday · Numeric: 10')
    await preview({ category: 0, series: 1 })
    state.hiddenSeries = ['1']
    await nextTick()
    expect(summary()).toBe('Monday · Numeric: 10')
    await preview({ category: 1, series: 0 })
    state.disabled = true
    await nextTick()
    expect(summary()).toBe('Monday · Numeric: 10')
    await preview({ category: 1, series: 0 })
    expect(summary()).toBe('Monday · Numeric: 10')
    state.disabled = false
    await preview({ category: 1, series: 0 })
    state.modelValue = null
    await nextTick()
    expect(summary()).toBe('Overview')
    expect(changed).not.toHaveBeenCalled()
  })
  it('shares preview behavior with bars and clears it when changing plot type', async () => {
    const { state, preview, summary, changed } = mount()
    await preview({ category: 1, series: 0 })
    state.type = 'bar'
    await nextTick()
    expect(summary()).toBe('Monday · Numeric: 10')
    await preview({ category: 0, series: 1 })
    expect(summary()).toBe('Monday · Text: 20')
    expect(changed).not.toHaveBeenCalled()
  })
})
