import type { NumberFlowFormat } from '@getcortexlabs/mavis-core'

/** NativeScript resolves the platform implementation inside a device bundle. */
export function numberFlowFormatter(
  _locale: string,
  _options: NumberFlowFormat,
): (value: number) => string {
  throw new Error('Native number formatting requires an iOS or Android runtime.')
}
