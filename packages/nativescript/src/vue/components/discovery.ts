import { h, type Component } from 'nativescript-vue'
import type { SwipeGestureEventData } from '@nativescript/core'
import {
  createDiscoveryControls,
  createCarousel,
  createTreeView,
  createDataTable,
} from '@getcortexlabs/mavis-core/vue'
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
export const { MCalendar, MRating } = createDiscoveryControls(ui, 'native')
export const MTreeView = createTreeView(ui, 'native')
export const MCarousel = createCarousel(
  {
    ...ui,
    gestures: (move) => ({
      onSwipe: (event: SwipeGestureEventData) => {
        if (event.direction === 2) move(1)
        else if (event.direction === 1) move(-1)
      },
    }),
  },
  'native',
)
export const MDataTable = createDataTable(
  {
    ...ui,
    Checkbox: (props: Record<string, unknown>) =>
      h(MCheckbox as Component, { ...props, labelHidden: true }),
    table: (columns, header, rows, label) =>
      h('ScrollView', { orientation: 'horizontal', accessibilityLabel: label }, [
        h('StackLayout', { verticalAlignment: 'top', horizontalAlignment: 'left' }, [
          h(
            'GridLayout',
            {
              columns: columns.map((column) => column.width ?? 160).join(','),
              rows: 'auto',
              padding: 8,
            },
            header.map((content, index) =>
              h('StackLayout', { col: index, padding: 8, verticalAlignment: 'middle' }, [content]),
            ),
          ),
          ...rows.map((row) =>
            h(
              'GridLayout',
              {
                key: row.key,
                columns: columns.map((column) => column.width ?? 160).join(','),
                rows: 'auto',
                padding: 8,
              },
              row.cells.map((content, index) =>
                h('StackLayout', { col: index, padding: 8, verticalAlignment: 'middle' }, [
                  columns[index]!.label
                    ? h(MText, {
                        text: columns[index]!.label,
                        variant: 'caption',
                        tone: 'muted',
                        align: columns[index]!.align === 'end' ? 'right' : 'left',
                      })
                    : null,
                  content,
                ]),
              ),
            ),
          ),
        ]),
      ]),
  },
  'native',
)
