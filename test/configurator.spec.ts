import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import {
  formatNumber,
  parseNumberDraft,
  stepNumber,
  validateNumberConstraints,
} from '../packages/core/src/number-input.js'
import { toggleMultiSelection, validateMultiSelection } from '../packages/core/src/multi-select.js'
import { MNumberInput, MMultiSelect, MImage, createMavis } from '../packages/web/src/index.js'

const bounds = { min: -10, max: 10, step: 0.1 }
describe('configurator controls', () => {
  it('separates incomplete text, localized decimals, range errors and empty values', () => {
    for (const text of ['-', '+', '.', '1.'])
      expect(parseNumberDraft(text, 'en-US', bounds).status).toBe('incomplete')
    expect(parseNumberDraft('1,25', 'pt-BR', bounds)).toEqual({ status: 'valid', value: 1.25 })
    expect(parseNumberDraft('1.25', 'pt-BR', bounds)).toEqual({ status: 'valid', value: 1.25 })
    expect(parseNumberDraft('1.234,5', 'pt-BR', bounds).status).toBe('invalid')
    expect(parseNumberDraft('1,000', 'en-US', bounds).status).toBe('invalid')
    expect(parseNumberDraft('11', 'en-US', bounds).status).toBe('range')
    expect(parseNumberDraft('NaN', 'en-US', bounds).status).toBe('invalid')
    expect(parseNumberDraft('', 'en-US', bounds)).toEqual({ status: 'empty', value: null })
  })
  it('steps decimals without tails and clamps to inclusive bounds', () => {
    expect(stepNumber(0.2, 1, bounds)).toBe(0.3)
    expect(stepNumber(1234567890123456, 1, { step: 1 })).toBe(1234567890123457)
    for (const value of [1e-25, 1e21, -1.23e-8, 0.0000001])
      expect(parseNumberDraft(formatNumber(value, 'pt-BR'), 'pt-BR', { step: 1 }).value).toBe(value)
    expect(stepNumber(9.95, 1, bounds)).toBe(10)
    expect(stepNumber(-10, -1, bounds)).toBe(-10)
    expect(() => validateNumberConstraints({ min: 2, max: 1, step: 1 })).toThrow()
    expect(() => validateNumberConstraints({ step: 0 })).toThrow()
  })
  it('preserves typed identities, maximum selection and disabled options', () => {
    const options = [
      { value: 1, label: 'One' },
      { value: '1', label: 'String' },
      { value: 2, label: 'Disabled', disabled: true },
    ]
    expect(toggleMultiSelection(options, [1], '1', 2)).toEqual([1, '1'])
    expect(toggleMultiSelection(options, [1], '1', 1)).toBeNull()
    expect(toggleMultiSelection(options, [1], 1, 1)).toEqual([])
    expect(toggleMultiSelection(options, [], 2)).toBeNull()
    expect(() => validateMultiSelection(options, [1, 1])).toThrow(/unique/)
    expect(() => validateMultiSelection(options, ['missing'])).toThrow(/matching/)
  })
  it('renders deterministic SSR fields and image geometry without acquiring browser resources', async () => {
    const app = createSSRApp({
      render: () =>
        h('section', [
          h(MNumberInput, {
            label: 'Quantity',
            modelValue: 1.5,
            locale: 'pt-BR',
            name: 'quantity',
          }),
          h(MMultiSelect, {
            label: 'Extras',
            options: [{ value: 'a', label: 'Alpha' }],
            modelValue: ['a'],
          }),
          h(MImage, { src: '/product.png', alt: 'A product', aspectRatio: 2 }),
        ]),
    })
    app.use(createMavis())
    const html = await renderToString(app)
    expect(html).toContain('value="1,5"')
    expect(html).toContain('name="quantity"')
    expect(html).toContain('Alpha')
    expect(html).toContain('aspect-ratio:2')
    expect(html).toContain('alt="A product"')
  })
})

it('ignores stale image callbacks after source replacement and unmount', async () => {
  const { ref, nextTick } = await import('vue')
  const { node, renderer, find, fire } = await import('./renderer.js')
  const source = ref('/first.png')
  const loaded: string[] = [],
    failed: string[] = []
  const root = node('root')
  const app = renderer
    .createApp({
      render: () =>
        h(MImage, {
          src: source.value,
          alt: 'Print',
          onLoad: (src) => loaded.push(src),
          onError: (src) => failed.push(src),
        }),
    })
    .use(createMavis())
  app.mount(root)
  const stale = find(root, 'img')
  source.value = '/second.png'
  await nextTick()
  fire(stale, 'onLoad')
  fire(stale, 'onError')
  expect(find(root, 'div').props['data-state']).toBe('loading')
  const current = find(root, 'img')
  fire(current, 'onLoad')
  await nextTick()
  expect(loaded).toEqual(['/second.png'])
  expect(failed).toEqual([])
  app.unmount()
  fire(current, 'onError')
  expect(failed).toEqual([])
})
