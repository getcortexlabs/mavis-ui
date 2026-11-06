import type { IconName } from './icon.js'
import type { ChoiceValue } from './choice.js'

export interface SpeedDialAction {
  value: ChoiceValue
  label: string
  icon?: IconName
  disabled?: boolean
}
export interface ComposerAttachment {
  id: string
  name: string
}
export interface ComposerMessage {
  text: string
  attachments: readonly ComposerAttachment[]
}
/** Native/core-only consumers need no DOM typings; Web retains fetch's full signal type. */
export type RefreshSignal = typeof globalThis extends {
  AbortController: { prototype: { signal: infer Signal } }
}
  ? Signal
  : {
      readonly aborted: boolean
      readonly reason: unknown
      throwIfAborted(): void
      addEventListener(type: 'abort', listener: () => void, options?: { once?: boolean }): void
      removeEventListener(type: 'abort', listener: () => void): void
    }
export interface RefreshContext {
  readonly signal: RefreshSignal
  readonly cancelled: boolean
  /** Apply results only while this refresh still owns the component. */
  commit(change: () => void | Promise<void>): Promise<boolean>
}
export type RefreshAction = (context: RefreshContext) => void | Promise<void>
export type RefreshState = 'idle' | 'refreshing' | 'success' | 'error'
export function pinLength(length: number) {
  if (!Number.isInteger(length) || length < 2 || length > 12)
    throw new RangeError('MPinInput length must be an integer between 2 and 12.')
  return length
}
/** Accept pasted separators and full-width digits without accepting arbitrary code. */
export function normalizePin(value: string, length: number) {
  return value
    .replace(/[０-９]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xfee0))
    .replace(/[^0-9]/g, '')
    .slice(0, pinLength(length))
}
export function uniqueActions(actions: readonly SpeedDialAction[]) {
  const keys = new Set<string>()
  for (const action of actions) {
    const key = `${typeof action.value}:${action.value}`
    if (!action.label.trim() || keys.has(key))
      throw new TypeError('Speed dial actions require unique values and nonempty labels.')
    keys.add(key)
  }
  return actions
}
