/** Why a sheet closed: the component's own control, a platform dismissal, or `open` set to false. */
export type SheetCloseReason = 'button' | 'backdrop' | 'escape' | 'back' | 'swipe' | 'program'

export const sheetCloseReasons: readonly SheetCloseReason[] = [
  'button',
  'backdrop',
  'escape',
  'back',
  'swipe',
  'program',
]

export function checkSheetName(title: string | undefined, label: string | undefined) {
  if (!title && !label) {
    throw new RangeError('A sheet needs a title or an accessibilityLabel')
  }
}
