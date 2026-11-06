import { MotionRows } from './MotionRows.js'
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
    gestures: (move, direction) => ({
      tabindex: 0,
      onPointerdownCapture: (event: PointerEvent) => {
        direction.value =
          getComputedStyle(event.currentTarget as HTMLElement).direction === 'rtl' ? -1 : 1
      },
      onKeydown: (event: KeyboardEvent) => {
        if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey)
          return
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          event.preventDefault()
          direction.value =
            getComputedStyle(event.currentTarget as HTMLElement).direction === 'rtl' ? -1 : 1
          move((event.key === 'ArrowRight' ? 1 : -1) * direction.value)
        }
      },
    }),
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
              h(MotionRows, {
                nodes: rows.map((row) =>
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
              }),
            ],
          ),
        ],
      )
    },
  },
  'web',
)
