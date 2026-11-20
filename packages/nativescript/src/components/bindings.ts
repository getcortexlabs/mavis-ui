import type { NativeComponentEvents } from './contracts.js'

/** Framework-specific event syntax maps to these semantic callbacks. */
export interface ComponentCallbacks {
  onClick?(): void
  onError?(error: unknown): void
  onValueChange?(value: string): void
  onSubmit?(value: string): void
  onFocus?(): void
  onBlur?(): void
  onAction?(): void
}
export function componentEvents(props: ComponentCallbacks): NativeComponentEvents {
  return {
    activate: props.onClick,
    error: props.onError,
    valueChange: props.onValueChange,
    submit: props.onSubmit,
    focus: props.onFocus,
    blur: props.onBlur,
    action: props.onAction,
  }
}

export function plainComponentText(value: unknown): string {
  if (value === null || value === undefined || typeof value === 'boolean') return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.map(plainComponentText).join('')
  throw new TypeError(
    'This foundation text slot accepts text. Use the text prop for computed content.',
  )
}
