import { defineComponent, h } from 'nativescript-vue'
import { Utils, isAndroid, type EventData, type TimePicker } from '@nativescript/core'
import { createTimePicker, timePickerProps } from '@getcortexlabs/mavis-core/vue'
import { localTime, timeMinutes, timeOptions } from '@getcortexlabs/mavis-core'
import { MInput } from './MInput.js'
import { MColumn, MRow } from './layout.js'
import { MButton } from './MButton.js'
import { MText } from './MText.js'
import { MSheet } from './MSheet.js'

declare const NSLocale: { alloc(): { initWithLocaleIdentifier(locale: string): unknown } }
declare const java: { lang: { Boolean: { valueOf(value: boolean): unknown } } }

const TimeWheel = defineComponent({
  props: timePickerProps,
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => {
      const minutes = timeMinutes(props.modelValue ?? '00:00')
      const { cycle, step } = timeOptions(props)
      return h('TimePicker', {
        // A Date is only the native widget transport. The public model remains HH:mm.
        key: `${props.locale}:${cycle}:${step}`,
        time: new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60),
        minuteInterval: step,
        iosPreferredDatePickerStyle: 1,
        accessibilityLabel: props.label,
        onLoaded: (event: EventData) => {
          const picker = event.object as TimePicker
          if (isAndroid) picker.android.setIs24HourView(java.lang.Boolean.valueOf(cycle === 'h23'))
          else
            picker.ios.locale = NSLocale.alloc().initWithLocaleIdentifier(
              `${props.locale.replace('-', '_')}@hours=${cycle}`,
            )
        },
        onTimeChange: (event: EventData) => {
          const picker = event.object as TimePicker
          if (picker.isLoaded)
            emit('update:modelValue', localTime(picker.hour * 60 + picker.minute))
        },
      })
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
    Picker: TimeWheel,
    beforeOpen: () => Utils.dismissKeyboard(),
  },
  'native',
)
