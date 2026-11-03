import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import {
  formatTime,
  localTime,
  parseTime,
  timeMinutes,
  timeOptions,
  validateTime,
} from '../packages/core/src/time.js'
import { placePopover } from '../packages/core/src/popover.js'
import {
  validateMenu,
  validateNavigation,
  virtualKeys,
  virtualWindow,
} from '../packages/core/src/collections.js'
import {
  createMavis,
  MPopover,
  MMenu,
  MAppBar,
  MTabBar,
  MTimePicker,
  MVirtualList,
} from '../packages/web/src/index.js'

describe('local time editing', () => {
  it('round-trips every minute in both hour cycles without a Date or timezone', () => {
    for (const hourCycle of ['h12', 'h23'] as const) {
      for (let minute = 0; minute < 1440; minute++) {
        const value = localTime(minute)
        expect(parseTime(formatTime(value, { hourCycle }), { hourCycle })).toEqual({
          status: 'valid',
          value,
        })
      }
    }
    expect(formatTime('00:00')).toBe('12:00 AM')
    expect(formatTime('12:00')).toBe('12:00 PM')
    expect(formatTime('18:30', { locale: 'pt-BR' })).toBe('18:30')
  })
  it('separates incomplete edits, invalid values and inclusive minute constraints', () => {
    const options = { min: '08:00', max: '18:00', minuteStep: 15, hourCycle: 'h23' as const }
    expect(parseTime('09:', options).status).toBe('incomplete')
    expect(parseTime('xx:00', options).status).toBe('invalid')
    expect(parseTime('24:00', options).status).toBe('invalid')
    expect(parseTime('12:99', options).status).toBe('invalid')
    expect(parseTime('09:07', options).status).toBe('step')
    expect(parseTime('07:45', options).status).toBe('range')
    expect(parseTime('18:00', options).value).toBe('18:00')
    expect(parseTime('', options).status).toBe('empty')
    expect(parseTime('0:15 PM').status).toBe('invalid')
    expect(parseTime('1:15 pm').value).toBe('13:15')
    expect(validateTime('9:00', options).status).toBe('invalid')
    expect(() => timeOptions({ min: '22:00', max: '06:00' })).toThrow(RangeError)
    expect(() => timeOptions({ minuteStep: 7 })).toThrow(RangeError)
    expect(() => timeOptions({ min: '08:01', max: '08:04', minuteStep: 5 })).toThrow(RangeError)
    expect(() => timeMinutes('08:00:00')).toThrow(RangeError)
  })
})

describe('anchored placement and collection identity', () => {
  it('flips from the bottom edge and mirrors inline alignment in RTL', () => {
    const anchor = { x: 100, y: 550, width: 80, height: 40 }
    const panel = { width: 200, height: 150 }
    const viewport = { x: 0, y: 0, width: 400, height: 640 }
    expect(placePopover(anchor, panel, viewport, 'bottom-start')).toEqual({ x: 100, y: 392 })
    expect(placePopover(anchor, panel, viewport, 'bottom-start', true)).toEqual({ x: 8, y: 392 })
    expect(
      placePopover({ x: 350, y: 20, width: 40, height: 20 }, panel, viewport, 'top-start'),
    ).toEqual({ x: 192, y: 48 })
  })
  it('rejects ambiguous keys and unsafe navigation without conflating number/string identities', () => {
    expect(virtualKeys([{ id: 1 }, { id: '1' }], 'id')).toEqual([1, '1'])
    expect(() => virtualKeys([{ id: 1 }, { id: 1 }], 'id')).toThrow(/unique/)
    expect(() => virtualKeys([{}], 'id')).toThrow(/keys/)
    expect(() =>
      validateMenu([
        { value: 'x', label: 'X' },
        { value: 'x', label: 'Other' },
      ]),
    ).toThrow(/unique/)
    expect(() =>
      validateNavigation([{ value: 1, label: 'Oops', href: 'javascript:alert(1)' }]),
    ).toThrow(/executable/)
  })
  it('bounds rendered work at the start, middle, end and after a collection shrinks', () => {
    expect(virtualWindow(10000, 50, 300, 0)).toMatchObject({
      start: 0,
      end: 9,
      totalHeight: 500000,
    })
    expect(virtualWindow(10000, 50, 300, 250000)).toMatchObject({ start: 4997, end: 5009 })
    expect(virtualWindow(2, 50, 300, 250000)).toMatchObject({ start: 0, end: 2, scrollTop: 0 })
    expect(virtualWindow(0, 50, 300, 0)).toMatchObject({ start: 0, end: 0 })
    expect(() => virtualWindow(10, 0, 300, 0)).toThrow(RangeError)
    expect(() => virtualWindow(10, 50, 300, 0, -1)).toThrow(RangeError)
  })
})

describe('navigation component SSR', () => {
  it('renders a deterministic bounded list and time while deferring popup presentation', async () => {
    const app = createSSRApp({
      render: () =>
        h('main', [
          h(MAppBar, { title: 'Library' }),
          h(MTabBar, {
            label: 'Destinations',
            modelValue: 'saved',
            items: [{ value: 'saved', label: 'Saved', href: '/saved', badge: 3 }],
          }),
          h(
            MPopover,
            { label: 'Details', triggerLabel: 'Open details', open: true },
            () => 'Deferred content',
          ),
          h(MMenu, {
            label: 'Actions',
            triggerLabel: 'Open actions',
            items: [{ value: 1, label: 'Edit' }],
            open: true,
          }),
          h(MTimePicker, { label: 'Time', modelValue: '13:30', name: 'time' }),
          h(
            MVirtualList,
            {
              label: 'Records',
              items: Array.from({ length: 10000 }, (_, id) => ({ id })),
              rowHeight: 50,
              height: 300,
            },
            { default: ({ index }: { index: number }) => `Record ${index}` },
          ),
        ]),
    }).use(createMavis())
    const html = await renderToString(app)
    expect(html).toContain('1:30 PM')
    expect(html).toContain('value="13:30"')
    expect(html).toContain('aria-current="page"')
    expect(html).not.toContain('Deferred content')
    expect(html.match(/role="listitem"/g)).toHaveLength(9)
    expect(html).toContain('aria-setsize="10000"')
    expect(html).not.toContain('Record 9999')
  })
})
