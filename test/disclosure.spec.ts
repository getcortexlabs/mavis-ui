import { describe, expect, it } from 'vitest'
import {
  accordionFocusTarget,
  toggleAccordion,
  validateAccordion,
} from '../packages/core/src/accordion.js'
import { segmentedFocusTarget, validateSegments } from '../packages/core/src/segmented.js'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { MAccordion, MSegmentedControl, MText, createMavis } from '../packages/web/src/index.js'
const items = [
  { value: 0, title: 'Number' },
  { value: '0', title: 'String' },
  { value: 'off', title: 'Blocked', disabled: true },
  { value: 'last', title: 'Last' },
]
const options = items.map((item) => ({ ...item, label: item.title }))
describe('Expandable sections', () => {
  it('keeps a stable array model and never mutates the caller', () => {
    const expanded = Object.freeze([0])
    expect(toggleAccordion(items[0]!, expanded, false)).toEqual([])
    expect(toggleAccordion(items[1]!, expanded, false)).toEqual(['0'])
    expect(toggleAccordion(items[1]!, expanded, true)).toEqual([0, '0'])
    expect(toggleAccordion(items[2]!, expanded, true)).toBeUndefined()
    expect(toggleAccordion(items[1]!, expanded, true, true)).toBeUndefined()
    expect(expanded).toEqual([0])
  })
  it('rejects ambiguous state while allowing missing values owned by the app', () => {
    const check = (values: (string | number)[], multiple = false) =>
      validateAccordion(items, values, multiple, 'Help', 'Open', 'Closed')
    expect(() => check(['removed'])).not.toThrow()
    expect(() => check([0, '0'])).toThrow(RangeError)
    expect(() => check([0, '0'], true)).not.toThrow()
    expect(() => check([0, 0], true)).toThrow(RangeError)
    expect(() => check([NaN])).toThrow(TypeError)
    expect(() =>
      validateAccordion([...items, items[0]!], [], false, 'Help', 'Open', 'Closed'),
    ).toThrow(RangeError)
    expect(() => validateAccordion(items, [], false, ' ', 'Open', 'Closed')).toThrow(TypeError)
    expect(() => validateAccordion(items, [], false, 'Help', '', 'Closed')).toThrow(TypeError)
    expect(() =>
      validateAccordion([{ value: 'a', title: '' }], [], false, 'Help', 'Open', 'Closed'),
    ).toThrow(TypeError)
  })
  it('moves header focus independently of the expanded state', () => {
    expect(accordionFocusTarget(items, '0', 'ArrowDown')?.value).toBe('last')
    expect(accordionFocusTarget(items, 0, 'ArrowUp')?.value).toBe('last')
    expect(accordionFocusTarget(items, 'last', 'ArrowDown')?.value).toBe(0)
    expect(accordionFocusTarget(items, 0, 'End')?.value).toBe('last')
    expect(accordionFocusTarget(items, 'last', 'Home')?.value).toBe(0)
    expect(accordionFocusTarget(items, 0, 'Enter')).toBeUndefined()
    expect(accordionFocusTarget([], 0, 'ArrowDown')).toBeUndefined()
  })
})
describe('Compact single selection', () => {
  it('keeps empty/removed selections and requires unique values and a group name', () => {
    expect(() => validateSegments([], null, 'Period')).not.toThrow()
    expect(() => validateSegments(options, 'removed', 'Period')).not.toThrow()
    expect(() => validateSegments(options, Infinity, 'Period')).toThrow(TypeError)
    expect(() => validateSegments(options, 0, '')).toThrow(TypeError)
    expect(() => validateSegments([...options, options[0]!], 0, 'Period')).toThrow(RangeError)
  })
  it('wraps, skips disabled values and mirrors horizontal movement in RTL', () => {
    expect(segmentedFocusTarget(options, 0, 'ArrowRight')?.value).toBe('0')
    expect(segmentedFocusTarget(options, '0', 'ArrowRight')?.value).toBe('last')
    expect(segmentedFocusTarget(options, 'last', 'ArrowRight')?.value).toBe(0)
    expect(segmentedFocusTarget(options, 0, 'ArrowRight', true)?.value).toBe('last')
    expect(segmentedFocusTarget(options, 0, 'ArrowLeft', true)?.value).toBe('0')
    expect(segmentedFocusTarget(options, 0, 'ArrowDown')?.value).toBe('0')
    expect(segmentedFocusTarget(options, 0, 'End')?.value).toBe('last')
    expect(segmentedFocusTarget(options, 'last', 'Home')?.value).toBe(0)
    expect(segmentedFocusTarget(options, 0, 'Enter')).toBeUndefined()
    expect(
      segmentedFocusTarget(
        options.map((option) => ({ ...option, disabled: true })),
        0,
        'ArrowRight',
      ),
    ).toBeUndefined()
  })
})
it('renders independent server-side IDs and only expanded bodies without browser globals', async () => {
  const app = createSSRApp({
    render: () =>
      h('div', [
        ...[1, 2].map(() =>
          h(
            MAccordion,
            { items, modelValue: [0], label: 'Help' },
            {
              default: ({ item }: { item: (typeof items)[number] }) =>
                h(MText, { text: `Body ${typeof item.value}` }),
            },
          ),
        ),
        h(MSegmentedControl, { options, modelValue: '0', label: 'Period' }),
      ]),
  })
  app.use(createMavis())
  const html = await renderToString(app)
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1])
  expect(new Set(ids).size).toBe(ids.length)
  expect(html.match(/Body number/g)).toHaveLength(2)
  expect(html).not.toContain('Body string')
  expect(html).toContain('role="radiogroup"')
  expect(html.match(/aria-checked="true"/g)).toHaveLength(1)
})
