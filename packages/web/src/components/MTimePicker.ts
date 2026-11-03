import { defineComponent, h } from 'vue'
import { createTimePicker, timePickerProps, useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { localTime, timeMinutes, timeOptions } from '@getcortexlabs/mavis-core'
import { MInput } from './MInput.js'
import { MColumn, MRow } from './layout.js'
import { MButton } from './MButton.js'
import { MText } from './MText.js'
import { MSheet } from './MSheet.js'

const TimeFields = defineComponent({
  props: timePickerProps,
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { theme } = useMavisTheme()
    // Browser-native selects keep hour/minute selection within the current sheet.
    function field(
      label: string,
      value: string | number,
      options: { value: string | number; label: string }[],
      change: (value: string) => void,
    ) {
      const { colors, radius } = theme.value
      return h(
        'label',
        {
          class: 'm-time-part',
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flex: '1 1 80px',
            minWidth: 0,
            font: 'inherit',
          },
        },
        [
          h('span', { style: { fontSize: '14px', fontWeight: 600 } }, label),
          h(
            'select',
            {
              value: String(value),
              style: {
                boxSizing: 'border-box',
                width: '100%',
                minHeight: '48px',
                padding: '8px',
                font: 'inherit',
                background: colors.surface,
                color: colors.text,
                border: `1px solid ${colors.border}`,
                borderRadius: `${radius.md}px`,
                colorScheme: theme.value.appearance,
              },
              onChange: (event: Event) => change((event.target as HTMLSelectElement).value),
            },
            options.map((option) =>
              h('option', { key: option.value, value: String(option.value) }, option.label),
            ),
          ),
        ],
      )
    }
    return () => {
      const { cycle, step } = timeOptions(props)
      const minutes = timeMinutes(props.modelValue ?? '00:00')
      const hour = Math.floor(minutes / 60)
      const twelve = cycle === 'h12'
      return h(MRow, { gap: 'sm', wrap: true }, () => [
        field(
          props.hourLabel,
          twelve ? hour % 12 || 12 : hour,
          Array.from({ length: twelve ? 12 : 24 }, (_, i) => ({
            value: twelve ? i + 1 : i,
            label: String(twelve ? i + 1 : i).padStart(2, '0'),
          })),
          (value) =>
            emit(
              'update:modelValue',
              localTime(
                (twelve ? (Number(value) % 12) + (hour >= 12 ? 12 : 0) : Number(value)) * 60 +
                  (minutes % 60),
              ),
            ),
        ),
        field(
          props.minuteLabel,
          minutes % 60,
          Array.from({ length: 60 / step }, (_, i) => ({
            value: i * step,
            label: String(i * step).padStart(2, '0'),
          })),
          (value) => emit('update:modelValue', localTime(hour * 60 + Number(value))),
        ),
        twelve
          ? field(
              props.periodLabel,
              hour >= 12 ? 'PM' : 'AM',
              [
                { value: 'AM', label: 'AM' },
                { value: 'PM', label: 'PM' },
              ],
              (value) =>
                emit(
                  'update:modelValue',
                  localTime(((hour % 12) + (value === 'PM' ? 12 : 0)) * 60 + (minutes % 60)),
                ),
            )
          : null,
      ])
    }
  },
})
export const MTimePicker = createTimePicker(
  {
    Input: MInput,
    Column: MColumn,
    Row: MRow,
    Button: MButton,
    Text: MText,
    Sheet: MSheet,
    Picker: TimeFields,
  },
  'web',
)
