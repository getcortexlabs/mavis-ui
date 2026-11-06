import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import {
  colorHex,
  colorHsv,
  hsvColor,
  parseColor,
  deckDecision,
  gaugeGeometry,
  transferValues,
  validateTour,
} from '../packages/core/src/creative-controls.js'
import {
  createMavis,
  MColorPicker,
  MSwipeDeck,
  MGauge,
  MTransferList,
  MTour,
  MTourTarget,
  MMarquee,
} from '../packages/web/src/index.js'
import type { RefreshAction } from '../packages/core/src/screen-components.js'
// Web consumers keep the full standard AbortSignal, including fetch compatibility.
const refresh: RefreshAction = async ({ signal }) => {
  await fetch('/example', { signal })
}
void refresh
const render = (
  component: Parameters<typeof h>[0],
  props: Record<string, unknown>,
  children?: Parameters<typeof h>[2],
) => {
  const app = createSSRApp({ render: () => h(component as never, props, children) })
  app.use(createMavis())
  return renderToString(app)
}
describe('creative contracts', () => {
  it('round-trips shorthand HEX and preserves alpha without accepting CSS injection', () => {
    expect(colorHex(parseColor('#f08c')!, true)).toBe('#FF0088CC')
    expect(colorHex(parseColor('rgba(12, 34, 56, .5)')!, true)).toBe('#0C223880')
    for (const input of [
      'red',
      'var(--color)',
      '#12345',
      '#12zz00',
      'rgb(300,2,1)',
      'rgba(1,2,3,2)',
      'url(x)',
    ])
      expect(parseColor(input)).toBeNull()
  })
  it('converts all HSV sectors, white, black and gray without losing quantized RGB', () => {
    for (const input of [
      '#FF0000',
      '#00FF00',
      '#0000FF',
      '#FF00FF',
      '#00FFFF',
      '#FFFF00',
      '#000000',
      '#FFFFFF',
      '#9C5270CC',
      '#888888',
    ]) {
      const color = parseColor(input)!
      expect(colorHex(hsvColor(colorHsv(color)), input.length === 9)).toBe(input)
    }
    expect(colorHex(hsvColor({ h: 360, s: 100, v: 100, a: 1 }))).toBe('#FF0000')
  })
  it('requires deliberate swipe distance or velocity, and preserves direction', () => {
    expect(deckDecision(8, 1200, 90)).toBeNull()
    expect(deckDecision(40, 0, 90)).toBeNull()
    expect(deckDecision(100, 0, 90)).toBe('accept')
    expect(deckDecision(-30, -800, 90)).toBe('reject')
    expect(() => deckDecision(0, NaN, 90)).toThrow()
  })
  it('moves only enabled checked choices, retaining opaque application ids and identity types', () => {
    const options = [
      { value: 1, label: 'One' },
      { value: '1', label: 'String' },
      { value: 'fixed', label: 'Fixed', disabled: true },
    ]
    expect(transferValues(options, ['unknown', 'fixed'], [1, 'fixed', 'missing'], 'add')).toEqual([
      'unknown',
      'fixed',
      1,
    ])
    expect(transferValues(options, [1, '1', 'fixed'], [1, 'fixed'], 'remove')).toEqual([
      '1',
      'fixed',
    ])
    expect(() => transferValues([...options, options[0]!], [], [], 'add')).toThrow(/Duplicate/)
  })
  it('clamps gauge semantics with the drawing and rejects invalid ranges', () => {
    expect(gaugeGeometry(150, 0, 100, true)).toMatchObject({ value: 100, ratio: 1 })
    expect(gaugeGeometry(-20, 0, 100, false)).toMatchObject({ value: 0, ratio: 0 })
    expect(() => gaugeGeometry(5, 10, 10, false)).toThrow()
    expect(() => gaugeGeometry(NaN, 0, 100, false)).toThrow()
  })
  it('rejects ambiguous tour targets', () => {
    expect(() =>
      validateTour([
        { id: 'a', title: 'A', description: '' },
        { id: 'a', title: 'Again', description: '' },
      ]),
    ).toThrow(/Duplicate/)
    expect(() => validateTour([{ id: '', title: 'A', description: '' }])).toThrow()
  })
})
describe('creative SSR', () => {
  it('renders real color controls and canonical alpha without client globals', async () => {
    const html = await render(MColorPicker, {
      label: 'Color',
      modelValue: '#12345680',
      alpha: true,
    })
    expect(html).toContain('value="#12345680"')
    expect(html).toContain('Opacity')
    expect(html).toContain('type="range"')
  })
  it('renders gauge semantics and its final SVG before hydration', async () => {
    const html = await render(MGauge, { label: 'Balance', value: 72, semi: true, suffix: '%' })
    expect(html).toContain('role="meter"')
    expect(html).toContain('aria-valuenow="72"')
    expect(html).toContain('72%')
    expect(html).toContain('<svg')
  })
  it('keeps deck actions and transfer checkboxes available without animation', async () => {
    expect(
      await render(MSwipeDeck, {
        label: 'Discover',
        modelValue: 'a',
        items: [{ id: 'a', title: 'First' }],
      }),
    ).toContain('Keep')
    const html = await render(MTransferList, {
      label: 'Kit',
      modelValue: [1],
      options: [
        { value: 1, label: 'Camera' },
        { value: 2, label: 'Radio', disabled: true },
      ],
    })
    expect(html).toContain('Camera')
    expect(html).toContain('Radio')
    expect(html).toContain('disabled')
  })
  it('renders a single static marquee list by default and with requested autoplay on the server', async () => {
    for (const autoplay of [false, true]) {
      const html = await render(MMarquee, {
        label: 'Reminders',
        autoplay,
        items: [{ id: 'a', label: 'Stay curious' }],
      })
      expect(html.match(/Stay curious/g)).toHaveLength(1)
      expect(html).toContain('disabled')
    }
  })
  it('keeps tour target editors mounted without a client overlay', async () => {
    const html = await render(
      MTour,
      {
        label: 'Welcome',
        modelValue: null,
        steps: [{ id: 'name', title: 'Name', description: 'Your name' }],
      },
      {
        default: () =>
          h(MTourTarget, { name: 'name' }, { default: () => h('input', { value: 'Retained' }) }),
      },
    )
    expect(html).toContain('value="Retained"')
    expect(html).not.toContain('role="dialog"')
  })
})
