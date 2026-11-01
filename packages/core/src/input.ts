import { iconGlyph, type IconName } from './icon.js'

export interface InputAction {
  icon: IconName
  label: string
  disabled?: boolean
}

/** Icon-only actions have a fixed touch target, independent of the accessible label length. */
export const inputActionSize = 48

export interface InputHandle {
  focus(): void
  blur(): void
}

/** Editing limits constrain user input; they never rewrite application state. */
export function validateInput(options: {
  multiline: boolean
  type: string
  rows: number
  maxLength?: number
  trailingIcon?: IconName
  trailingAction?: InputAction
}) {
  if (options.trailingAction) {
    iconGlyph(options.trailingAction.icon)
    if (typeof options.trailingAction.label !== 'string' || !options.trailingAction.label.trim()) {
      throw new RangeError('An input action needs a nonempty label')
    }
    if (options.trailingIcon) {
      throw new RangeError('Use either trailingIcon or trailingAction on an input')
    }
  }
  if (!Number.isSafeInteger(options.rows) || options.rows < 1) {
    throw new RangeError('rows must be a positive integer')
  }
  if (
    options.maxLength !== undefined &&
    (!Number.isInteger(options.maxLength) ||
      options.maxLength < 0 ||
      options.maxLength > 2147483647)
  ) {
    throw new RangeError('maxLength must be an integer from 0 to 2147483647')
  }
  if (options.multiline && options.type !== 'text') {
    throw new RangeError('multiline requires type="text"')
  }
}
