// The custom unit renderer has no DOM; real press/calendar focus runs in date.browser.ts.
vi.mock('../packages/web/src/motion.ts', async (original) => ({
  ...(await original<typeof import('../packages/web/src/motion.js')>()),
  usePressFeedback: () => ({}),
}))
import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, h, nextTick, ref } from 'vue'
import { renderToString } from '@vue/server-renderer'
import {
  addCivilDays,
  addCivilMonths,
  calendarMonth,
  civilDate,
  civilWeekday,
  isCivilDate,
  validateDateConstraints,
  validateDateDraft,
  validateDateRangeDraft,
  type CivilDate,
  type DateRange,
} from '../packages/core/src/date.js'
import { MDatePicker, MDateRangePicker } from '../packages/web/src/components/MDatePicker.js'
import { fire, node, renderer, type TestNode } from './renderer.js'

function all(root: TestNode, tag: string): TestNode[] {
  return [...(root.tag === tag ? [root] : []), ...root.children.flatMap((child) => all(child, tag))]
}

describe('Gregorian civil date contract', () => {
  it('accepts exact civil dates and rejects ambiguous, impossible and instant values', () => {
    for (const valid of [
      '0001-01-01',
      '0099-12-31',
      '1900-02-28',
      '2000-02-29',
      '2024-02-29',
      '9999-12-31',
    ])
      expect(isCivilDate(valid), valid).toBe(true)
    for (const invalid of [
      '',
      '2024-2-29',
      '29/02/2024',
      '02/03/2024',
      '2024-02-30',
      '1900-02-29',
      '0000-01-01',
      '10000-01-01',
      '2024-13-01',
      ' 2024-02-29',
      '2024-02-29T00:00:00Z',
      new Date(0),
    ])
      expect(isCivilDate(invalid), String(invalid)).toBe(false)
    expect(() => civilDate('2023-02-29')).toThrow(RangeError)
  })
  it('crosses leap, century, month/year and DST boundaries without local-time arithmetic', () => {
    expect(addCivilDays('2024-02-28', 1)).toBe('2024-02-29')
    expect(addCivilDays('2024-02-29', 1)).toBe('2024-03-01')
    expect(addCivilDays('1900-02-28', 1)).toBe('1900-03-01')
    expect(addCivilDays('2000-02-28', 1)).toBe('2000-02-29')
    expect(addCivilDays('2024-12-31', 1)).toBe('2025-01-01')
    expect(addCivilDays('2024-03-09', 2)).toBe('2024-03-11')
    expect(addCivilDays('2024-11-02', 2)).toBe('2024-11-04')
    expect(addCivilDays('0001-01-01', -1)).toBe('0001-01-01')
    expect(addCivilDays('9999-12-31', 1)).toBe('9999-12-31')
    expect(addCivilMonths('2024-01-31', 1)).toBe('2024-02-29')
    expect(addCivilMonths('2024-02-29', 12)).toBe('2025-02-28')
    expect(civilWeekday('0001-01-01')).toBe(1)
    expect(civilWeekday('2000-01-01')).toBe(6)
    expect(civilWeekday('2024-02-29')).toBe(4)
    for (const timezone of [
      'Pacific/Kiritimati',
      'Pacific/Pago_Pago',
      'America/New_York',
      'Europe/Berlin',
    ]) {
      vi.stubEnv('TZ', timezone)
      expect(addCivilDays('2024-03-10', 1)).toBe('2024-03-11')
      expect(addCivilDays('2024-11-03', 1)).toBe('2024-11-04')
    }
    vi.unstubAllEnvs()
  })
  it('uses inclusive limits and exact unavailable days without mutating source values', () => {
    const bounds = {
      min: '2024-02-01',
      max: '2024-02-29',
      unavailableDates: ['2024-02-14'],
    } as const
    expect(validateDateDraft('', bounds)).toEqual({ valid: true, complete: false, reason: 'empty' })
    expect(validateDateDraft('2024-02-', bounds).reason).toBe('incomplete')
    expect(validateDateDraft('2024-02-30', bounds).reason).toBe('invalid')
    expect(validateDateDraft('2024-01-31', bounds).reason).toBe('before-min')
    expect(validateDateDraft('2024-03-01', bounds).reason).toBe('after-max')
    expect(validateDateDraft('2024-02-14', bounds).reason).toBe('unavailable')
    expect(validateDateDraft(bounds.min, bounds).valid).toBe(true)
    expect(validateDateDraft(bounds.max, bounds).valid).toBe(true)
    expect(() => validateDateConstraints({ min: '2024-03-01', max: '2024-02-29' })).toThrow(
      RangeError,
    )
    expect(() => validateDateConstraints({ unavailableDates: ['2023-02-29'] })).toThrow(RangeError)
  })
  it('preserves partial ranges, equal endpoints and reversed drafts, rejecting blocked interior days', () => {
    expect(validateDateRangeDraft({ start: '', end: '' }).reason).toBe('empty')
    expect(validateDateRangeDraft({ start: '', end: '2024-03-11' })).toEqual({
      valid: true,
      complete: false,
      reason: 'partial',
    })
    expect(validateDateRangeDraft({ start: '2024-03-', end: '2024-03-11' }).reason).toBe(
      'incomplete',
    )
    expect(validateDateRangeDraft({ start: '2024-03-11', end: '2024-03-11' }).valid).toBe(true)
    expect(validateDateRangeDraft({ start: '2024-03-12', end: '2024-03-11' }).reason).toBe(
      'reversed',
    )
    expect(
      validateDateRangeDraft(
        { start: '2024-03-09', end: '2024-03-11' },
        { unavailableDates: ['2024-03-10'] },
      ).reason,
    ).toBe('unavailable-range')
  })
  it('keeps constrained partial ranges incomplete even when their existing endpoint is invalid', () => {
    expect(validateDateRangeDraft({ start: '2024-01-01', end: '' }, { min: '2024-02-01' })).toEqual(
      { valid: false, complete: false, reason: 'before-min' },
    )
    expect(validateDateRangeDraft({ start: '', end: '2024-03-01' }, { max: '2024-02-29' })).toEqual(
      { valid: false, complete: false, reason: 'after-max' },
    )
    expect(
      validateDateRangeDraft({ start: '2024-01-01', end: '2024-03-01' }, { min: '2024-02-01' }),
    ).toEqual({ valid: false, complete: true, reason: 'before-min' })
  })

  it('aligns weeks explicitly, including both ends of the supported calendar', () => {
    const monday = calendarMonth('2024-02-29', 1)
    expect(monday.slice(0, 4)).toEqual([null, null, null, '2024-02-01'])
    expect(monday.filter(Boolean)).toHaveLength(29)
    expect(monday.length % 7).toBe(0)
    expect(calendarMonth('0001-01-01', 1)[0]).toBe('0001-01-01')
    expect(calendarMonth('9999-12-31', 0).filter(Boolean).at(-1)).toBe('9999-12-31')
    expect(() => calendarMonth('2024-01-01', 7)).toThrow(RangeError)
  })
})

describe('date picker editing and SSR', () => {
  it('server-renders persisted incomplete drafts with unavailable JS actions and editable fields', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(MDatePicker, {
            label: 'Restored',
            modelValue: '2024-02-01',
            draft: '2024-03-',
          }),
      }),
    )
    expect(html).toContain('value="2024-03-"')
    for (const button of html.matchAll(/<button[^>]*>/g)) expect(button[0]).toContain('disabled')
    expect(html.match(/<input[^>]*>/)?.[0]).not.toContain('disabled')
  })
  it('restores controlled drafts, preserves the editor, and reconciles rejected edits', async () => {
    const draft = ref('2024-02-'),
      accept = ref(true),
      change = vi.fn()
    const root = node('root')
    const app = renderer.createApp({
      render: () =>
        h(MDatePicker, {
          label: 'Draft',
          draft: draft.value,
          'onUpdate:modelValue': change,
          'onUpdate:draft': (next: string) => {
            if (accept.value) draft.value = next
          },
        }),
    })
    app.mount(root)
    try {
      const input = all(root, 'input')[0]!
      fire(input, 'onInput', { target: { value: '2024-02-3' } })
      await nextTick()
      await nextTick()
      expect(draft.value).toBe('2024-02-3')
      expect(change).not.toHaveBeenCalled()
      accept.value = false
      fire(input, 'onInput', { target: { value: '2024-02-4' } })
      await nextTick()
      await nextTick()
      expect(input.props.value).toBe('2024-02-3')
      draft.value = '2025-'
      await nextTick()
      expect(all(root, 'input')[0]).toBe(input)
      expect(input.props.value).toBe('2025-')
    } finally {
      app.unmount()
    }
  })
  it('server-renders explicit ISO models, stable labels and names without opening calendar or reading time', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h('div', [
            h(MDatePicker, {
              id: 'day',
              label: 'Departure',
              modelValue: '2024-02-29',
              locale: 'pt-BR',
              name: 'departure',
            }),
            h(MDateRangePicker, {
              id: 'trip',
              label: 'Journey',
              modelValue: { start: '2024-03-09', end: null },
              startName: 'start',
              endName: 'end',
            }),
          ]),
      }),
    )
    expect(html).toContain('for="day"')
    expect(html).toContain('value="2024-02-29"')
    expect(html).toContain('placeholder="AAAA-MM-DD"')
    expect(html).toContain('name="departure"')
    expect(html).toContain('name="start"')
    expect(html).toContain('name="end"')
    expect(html).toContain('for="trip-start"')
    expect(html).toContain('for="trip-end"')
    expect(html).not.toContain('role="grid"')
  })
  it('retains incomplete/invalid drafts, emits only valid requests, and applies external changes', async () => {
    const model = ref<CivilDate | null>('2024-02-01')
    const changes = vi.fn((value: CivilDate | null) => {
      model.value = value
    })
    const drafts = vi.fn()
    const root = node('root')
    const app = renderer.createApp({
      render: () =>
        h(MDatePicker, {
          label: 'Date',
          modelValue: model.value,
          'onUpdate:modelValue': changes,
          'onUpdate:draft': drafts,
        }),
    })
    app.mount(root)
    const input = () => all(root, 'input')[0]!
    const edit = async (value: string) => {
      fire(input(), 'onInput', { target: { value } })
      await nextTick()
    }
    try {
      await edit('2024-02-')
      expect(changes).not.toHaveBeenCalled()
      expect(input().props.value).toBe('2024-02-')
      await edit('2024-02-30')
      expect(changes).not.toHaveBeenCalled()
      expect(input().props.value).toBe('2024-02-30')
      expect(input().props['aria-invalid']).toBe('true')
      await edit('2024-02-29')
      expect(changes).toHaveBeenLastCalledWith('2024-02-29')
      expect(input().props.value).toBe('2024-02-29')
      await edit('')
      expect(changes).toHaveBeenLastCalledWith(null)
      model.value = '2024-03-01'
      await nextTick()
      expect(input().props.value).toBe('2024-03-01')
      expect(drafts.mock.calls.map(([value]) => value)).toEqual([
        '2024-02-',
        '2024-02-30',
        '2024-02-29',
        '',
      ])
    } finally {
      app.unmount()
    }
  })
  it('does not reorder a reversed range or discard either edited endpoint', async () => {
    const model = ref<DateRange>({ start: '2024-03-09', end: '2024-03-11' })
    const update = vi.fn((value: DateRange) => {
      model.value = value
    })
    const root = node('root')
    const app = renderer.createApp({
      render: () =>
        h(MDateRangePicker, {
          label: 'Range',
          modelValue: model.value,
          'onUpdate:modelValue': update,
        }),
    })
    app.mount(root)
    try {
      fire(all(root, 'input')[0]!, 'onInput', { target: { value: '2024-03-12' } })
      await nextTick()
      expect(update).not.toHaveBeenCalled()
      expect(all(root, 'input').map((input) => input.props.value)).toEqual([
        '2024-03-12',
        '2024-03-11',
      ])
      fire(all(root, 'input')[1]!, 'onInput', { target: { value: '2024-03-12' } })
      await nextTick()
      expect(model.value).toEqual({ start: '2024-03-12', end: '2024-03-12' })
      fire(all(root, 'input')[0]!, 'onInput', { target: { value: '' } })
      await nextTick()
      expect(model.value).toEqual({ start: null, end: '2024-03-12' })
    } finally {
      app.unmount()
    }
  })
  it('honors parent rejection and boundary updates without rewriting the model', async () => {
    const max = ref<CivilDate>('2024-03-31')
    const update = vi.fn()
    const root = node('root')
    const app = renderer.createApp({
      render: () =>
        h(MDatePicker, {
          label: 'Controlled',
          modelValue: '2024-02-29',
          max: max.value,
          'onUpdate:modelValue': update,
        }),
    })
    app.mount(root)
    try {
      fire(all(root, 'input')[0]!, 'onInput', { target: { value: '2024-03-01' } })
      await nextTick()
      await nextTick()
      expect(update).toHaveBeenCalledWith('2024-03-01')
      expect(all(root, 'input')[0]!.props.value).toBe('2024-02-29')
      max.value = '2024-02-20'
      await nextTick()
      expect(all(root, 'input')[0]!.props.value).toBe('2024-02-29')
      expect(all(root, 'input')[0]!.props['aria-invalid']).toBe('true')
      expect(update).toHaveBeenCalledOnce()
    } finally {
      app.unmount()
    }
  })
})
