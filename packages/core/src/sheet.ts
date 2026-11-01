/** Why a sheet closed: the component's own control, a platform dismissal, or `open` set to false. */
export type SheetCloseReason = 'button' | 'backdrop' | 'escape' | 'back' | 'swipe' | 'program'

export type SheetName =
  { title: string; accessibilityLabel?: string } | { title?: string; accessibilityLabel: string }

export const sheetCloseReasons: readonly SheetCloseReason[] = [
  'button',
  'backdrop',
  'escape',
  'back',
  'swipe',
  'program',
]

export function checkSheetName(title: string | undefined, label: string | undefined) {
  const name = title?.trim() || label?.trim()
  if (!name) throw new RangeError('A sheet needs a nonempty title or accessibilityLabel')
  return name
}
