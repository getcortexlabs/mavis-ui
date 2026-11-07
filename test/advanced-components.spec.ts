import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import * as web from '../packages/web/src/index'
import { describe, it, expect } from 'vitest'
import {
  treeSelectRows,
  visibleTreeSelection,
  toggleTreeSelection,
  masonryLayout,
  heatmapCalendar,
  heatmapColor,
  updateNotifications,
} from '../packages/core/src/advanced-collections'
import { civilDate } from '../packages/core/src/date'
import {
  fitImageCrop,
  moveImageCrop,
  zoomImageCrop,
  cropPresentation,
  cropOutputSize,
  validateImageCrop,
} from '../packages/core/src/image-crop'
import {
  schedulerInstant,
  schedulerLayout,
  schedulerOffset,
  changeSchedulerEvent,
  type SchedulerClock,
} from '../packages/core/src/scheduler'
const clock: SchedulerClock = {
  parts(instant, timeZone) {
    const p = Object.fromEntries(
      new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      })
        .formatToParts(instant)
        .map((p) => [p.type, p.value]),
    )
    return {
      date: civilDate(`${p.year}-${p.month}-${p.day}`),
      minute: Number(p.hour) * 60 + Number(p.minute),
    }
  },
}
const day = civilDate('2026-11-07')
describe('advanced shared contracts', () => {
  it('search retains ancestors, while disabled subtrees and unknown selections are preserved', () => {
    const nodes = [
      {
        id: 'root',
        label: 'Root',
        selectable: false,
        children: [
          { id: 'leaf', label: 'Ferns' },
          {
            id: 'lock',
            label: 'Locked',
            disabled: true,
            children: [{ id: 'child', label: 'Child' }],
          },
        ],
      },
    ]
    const rows = treeSelectRows(nodes)
    expect(visibleTreeSelection(rows, [], 'fern').map((x) => x.node.id)).toEqual(['root', 'leaf'])
    expect(visibleTreeSelection(rows, [], '').map((x) => x.node.id)).toEqual(['root'])
    expect(toggleTreeSelection(nodes, ['missing'], 'child', true)).toEqual(['missing'])
    expect(toggleTreeSelection(nodes, ['missing'], 'leaf', true)).toEqual(['missing', 'leaf'])
    expect(toggleTreeSelection(nodes, ['missing'], 'leaf', false)).toEqual(['leaf'])
    expect(() => treeSelectRows([nodes[0]!, nodes[0]!])).toThrow(/unique/)
  })
  it('masonry measures variable heights without reordering or overlap at each breakpoint', () => {
    const items = Array.from({ length: 15 }, (_, i) => ({
      id: String(i),
      estimatedHeight: 70 + i * 13,
    }))
    for (const width of [180, 390, 768, 1440]) {
      const layout = masonryLayout(items, width, 220, 16, 4)
      expect(layout.placements.map((x) => x.id)).toEqual(items.map((x) => x.id))
      for (const a of layout.placements) {
        expect(a.x + a.width).toBeLessThanOrEqual(width + 0.001)
        expect(a.y + a.height).toBeLessThanOrEqual(layout.height + 0.001)
        for (const b of layout.placements.filter((b) => b.column === a.column && b.y > a.y))
          expect(b.y).toBeGreaterThanOrEqual(a.y + a.height + 16)
      }
    }
    expect(masonryLayout(items, 500, 220, 16, 4, new Map([['0', 340]])).placements[0]!.height).toBe(
      340,
    )
    expect(() => masonryLayout([{ id: 'a', estimatedHeight: NaN }], 400, 220, 16, 4)).toThrow()
  })
  it('heatmap distinguishes zero from missing, covers leap days and validates ranges', () => {
    const g = heatmapCalendar(civilDate('2024-02-28'), civilDate('2024-03-01'), [
      { date: civilDate('2024-02-29'), value: 0 },
    ])
    expect(g.cells.map((c) => [c.date, c.value, c.missing])).toEqual([
      ['2024-02-28', null, true],
      ['2024-02-29', 0, false],
      ['2024-03-01', null, true],
    ])
    expect(heatmapColor(0, 0, ['#ffffff', '#000000'])).toBe('#ffffff')
    expect(heatmapColor(null, 0, ['#ffffff', '#000000'])).toBe('transparent')
    expect(() => heatmapCalendar(day, civilDate('2028-01-01'), [])).toThrow(/366/)
    expect(() => heatmapCalendar(day, day, [{ date: day, value: -1 }])).toThrow()
  })
  it('crop pans, clamps, zooms and rotates in source pixels without changing output aspect', () => {
    const source = { width: 800, height: 400 },
      crop = fitImageCrop(source, 1)
    expect(crop).toEqual({ x: 200, y: 0, width: 400, height: 400, rotation: 0 })
    const zoom = zoomImageCrop(source, crop, 2)
    expect(zoom).toEqual({ x: 300, y: 100, width: 200, height: 200, rotation: 0 })
    expect(moveImageCrop(source, zoom, 999, -999)).toMatchObject({ x: 600, y: 0 })
    const rotated = fitImageCrop(source, 2, 90)
    expect(rotated).toEqual({ x: 0, y: 300, width: 400, height: 200, rotation: 90 })
    expect(cropPresentation(source, crop, 200)).toEqual({
      width: 400,
      height: 200,
      x: -100,
      y: 0,
      rotation: 0,
    })
    expect(cropOutputSize(rotated, { mimeType: 'image/png', quality: 1, width: 600 })).toEqual({
      width: 600,
      height: 300,
    })
    expect(() => validateImageCrop(source, { ...crop, x: 500 })).toThrow()
    expect(() => cropOutputSize(crop, { mimeType: 'image/png', quality: 2 })).toThrow()
    expect(
      zoomImageCrop({ width: 4, height: 4 }, fitImageCrop({ width: 4, height: 4 }, 1), 8).width,
    ).toBe(1)
  })
  it('scheduler rejects DST gaps, distinguishes repeated hours and supports half-hour offsets', () => {
    const zone = 'America/New_York'
    expect(() =>
      schedulerInstant({ date: civilDate('2026-03-08'), minute: 150 }, zone, clock),
    ).toThrow(/does not exist/)
    const local = { date: civilDate('2026-11-01'), minute: 90 }
    expect(() => schedulerInstant(local, zone, clock)).toThrow(/twice/)
    const early = schedulerInstant(local, zone, clock, 'earlier'),
      late = schedulerInstant(local, zone, clock, 'later')
    expect(late - early).toBe(3600000)
    expect(schedulerOffset(early, zone, clock)).toBe('UTC−04:00')
    expect(schedulerOffset(late, zone, clock)).toBe('UTC−05:00')
    expect(
      new Date(schedulerInstant({ date: day, minute: 600 }, 'Asia/Kolkata', clock)).toISOString(),
    ).toBe('2026-11-07T04:30:00.000Z')
    expect(() => schedulerInstant({ date: day, minute: 600 }, 'Not/AZone', clock)).toThrow()
  })
  it('scheduler clips bounds and assigns non-overlapping lanes without inventing early events', () => {
    const event = (id: string, start: number, end: number) => ({
      id,
      title: id,
      start: Date.parse(`${day}T${String(start).padStart(2, '0')}:00:00Z`),
      end: Date.parse(`${day}T${String(end).padStart(2, '0')}:00:00Z`),
    })
    const data = [event('early', 4, 6), event('a', 9, 11), event('b', 10, 12), event('c', 12, 13)]
    const rows = schedulerLayout(data, day, 1, 'UTC', clock, 8, 19)[0]!.segments
    expect(rows.map((x) => x.event.id)).toEqual(['a', 'b', 'c'])
    expect(rows.map((x) => [x.lane, x.lanes])).toEqual([
      [0, 2],
      [1, 2],
      [0, 1],
    ])
    const metadata = { ...data[1]!, owner: 'Fern' }
    expect(
      changeSchedulerEvent([metadata], {
        id: 'a',
        start: metadata.start + 60000,
        end: metadata.end + 60000,
        kind: 'move',
      })[0]!.owner,
    ).toBe('Fern')
  })
  it('notification actions preserve metadata, locked rows and non-dismissible messages', () => {
    const data = [
      { id: 'a', title: 'A', read: false, owner: 7 },
      { id: 'b', title: 'B', read: false, disabled: true },
      { id: 'c', title: 'C', dismissible: false },
    ]
    expect(updateNotifications(data, ['a', 'b'], 'read')).toMatchObject([
      { read: true, owner: 7 },
      { read: false },
      {},
    ])
    expect(updateNotifications(data, ['a', 'b', 'c'], 'dismiss').map((x) => x.id)).toEqual([
      'b',
      'c',
    ])
    expect(data[0]!.read).toBe(false)
  })
})

describe('advanced SSR rendering', () => {
  it('renders all six without DOM/native APIs or lost content', async () => {
    const app = createSSRApp({
      render: () =>
        h(web.MColumn, {}, () => [
          h(web.MTreeSelect, {
            nodes: [{ id: 'a', label: 'Fern' }],
            modelValue: ['a'],
            label: 'Discipline',
          }),
          h(
            web.MMasonry,
            { items: [{ id: 'a' }], label: 'Collection' },
            { item: () => h(web.MText, { text: 'A retained story' }) },
          ),
          h(web.MHeatmap, {
            start: day,
            end: day,
            values: [{ date: day, value: 0 }],
            label: 'Activity',
          }),
          h(web.MImageCropper, { src: 'unloaded://server-image', label: 'Cover' }),
          h(web.MScheduler, {
            modelValue: [
              {
                id: 'e',
                title: 'A short meeting',
                start: Date.parse(`${day}T09:00:00Z`),
                end: Date.parse(`${day}T09:15:00Z`),
              },
            ],
            date: day,
            timeZone: 'UTC',
            label: 'Agenda',
            days: 1,
          }),
          h(web.MNotificationCenter, {
            modelValue: [{ id: 'n', title: 'A server notification' }],
            label: 'Inbox',
          }),
        ]),
    }).use(web.createMavis())
    const html = await renderToString(app)
    for (const text of [
      'Fern',
      'A retained story',
      '2026-11-07: 0',
      'Cover',
      'A short meeting',
      'UTC+00:00',
      'A server notification',
    ])
      expect(html).toContain(text)
    expect(html).not.toContain('NaN')
    expect(html).not.toContain('unloaded://server-image')
  })
})
