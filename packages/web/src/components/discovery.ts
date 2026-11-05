import { h } from 'vue'
import {
  createDiscoveryControls,
  createCarousel,
  createTreeView,
  createDataTable,
} from '@getcortexlabs/mavis-core/vue'
import type { DataColumn } from '@getcortexlabs/mavis-core'
import { MRow, MColumn, MBox } from './layout.js'
import { MText } from './MText.js'
import { MButton } from './MButton.js'
import { MIcon } from './MIcon.js'
import { MSlider } from './MSlider.js'
import { MCheckbox } from './MCheckbox.js'
import { MProgress } from './MProgress.js'
import { MReveal } from './MReveal.js'
import { DateCalendar } from './DateCalendar.js'

const ui = {
  Row: MRow,
  Column: MColumn,
  Box: MBox,
  Text: MText,
  Button: MButton,
  Icon: MIcon,
  Slider: MSlider,
  Checkbox: MCheckbox,
  Progress: MProgress,
  Reveal: MReveal,
  Calendar: DateCalendar,
}
export const { MCalendar, MRating } = createDiscoveryControls(ui, 'web')
export const MTreeView = createTreeView(
  {
    ...ui,
    focus: (id) => document.getElementById(id)?.focus(),
    containsFocus: (id) => !!document.getElementById(id)?.contains(document.activeElement),
  },
  'web',
)
export const MCarousel = createCarousel(
  {
    ...ui,
    gestures: (move) => {
      let start: { x: number; y: number; id: number } | undefined
      return {
        tabindex: 0,
        onKeydown: (event: KeyboardEvent) => {
          if (
            event.target !== event.currentTarget ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey
          )
            return
          const rtl = getComputedStyle(event.currentTarget as HTMLElement).direction === 'rtl'
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault()
            move((event.key === 'ArrowRight' ? 1 : -1) * (rtl ? -1 : 1))
          }
        },
        onPointerdown: (event: PointerEvent) => {
          start = undefined
          if (
            !event.isPrimary ||
            event.button !== 0 ||
            (event.target as HTMLElement).closest(
              'button,a,input,textarea,select,[contenteditable]',
            )
          )
            return
          start = { x: event.clientX, y: event.clientY, id: event.pointerId }
          ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
        },
        onPointercancel: () => {
          start = undefined
        },
        onPointerup: (event: PointerEvent) => {
          const point = start
          start = undefined
          if (!point || point.id !== event.pointerId) return
          const dx = event.clientX - point.x,
            dy = event.clientY - point.y
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            const rtl = getComputedStyle(event.currentTarget as HTMLElement).direction === 'rtl'
            move((dx < 0 ? 1 : -1) * (rtl ? -1 : 1))
          }
        },
      }
    },
  },
  'web',
)

// Theme access must happen in setup, not in the render callback supplied to the factory.
export const MDataTable = createDataTable(
  {
    ...ui,
    table: (columns, header, rows, label, busy) => {
      const cell = (column: DataColumn) => ({
        padding: '12px 16px',
        minWidth: `${column.width ?? 144}px`,
        width: column.width ? `${column.width}px` : undefined,
        textAlign: column.align === 'end' ? ('end' as const) : ('start' as const),
        verticalAlign: 'middle',
      })
      return h(
        'div',
        {
          class: 'm-data-table-scroll',
          tabindex: 0,
          role: 'region',
          'aria-label': label,
          style: { overflowX: 'auto', borderRadius: 'inherit' },
        },
        [
          h(
            'table',
            {
              'aria-label': label,
              'aria-busy': busy,
              style: { width: '100%', borderCollapse: 'collapse' },
            },
            [
              h('thead', [
                h(
                  'tr',
                  columns.map((column, index) =>
                    h(
                      'th',
                      {
                        key: column.key,
                        scope: 'col',
                        'aria-sort': (column as DataColumn & { sort?: string }).sort,
                        style: cell(column),
                      },
                      [header[index]],
                    ),
                  ),
                ),
              ]),
              h(
                'tbody',
                rows.map((row) =>
                  h(
                    'tr',
                    { key: row.key, 'data-selected': row.selected },
                    row.cells.map((content, index) =>
                      h('td', { key: columns[index]!.key, style: cell(columns[index]!) }, [
                        content,
                      ]),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      )
    },
  },
  'web',
)
