import type { DateTimeValue, DateTimeFormatOptions, CivilDate } from '@getcortexlabs/mavis-core'
export type { DateTimeValue, DateTimeFormatOptions, DateTimeStyle } from '@getcortexlabs/mavis-core'

/** NativeScript resolves the .ios/.android implementation in a device bundle. */
export function formatDateTime(_value: DateTimeValue, _options: DateTimeFormatOptions): string {
  throw new Error(
    'Native date formatting requires an iOS or Android runtime. Use the Web formatter on the server.',
  )
}
export function dateTimeToCivilDate(
  _value: DateTimeValue,
  _options: Pick<DateTimeFormatOptions, 'timeZone'>,
): CivilDate {
  throw new Error(
    'Native date formatting requires an iOS or Android runtime. Use the Web formatter on the server.',
  )
}

export function schedulerParts(
  _value: number,
  _options: { timeZone: string },
): import('@getcortexlabs/mavis-core').SchedulerCivilTime {
  throw new Error('Native scheduling requires an iOS or Android runtime.')
}
