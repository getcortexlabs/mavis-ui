export type DialogCloseReason = 'cancel' | 'backdrop' | 'escape' | 'back' | 'program' | 'navigation'
export const dialogCloseReasons: readonly DialogCloseReason[] = [
  'cancel',
  'backdrop',
  'escape',
  'back',
  'program',
  'navigation',
]
export function checkDialogLabels(title: string, confirm: string, cancel: string, loading: string) {
  for (const [name, value] of Object.entries({
    title,
    confirmLabel: confirm,
    cancelLabel: cancel,
    loadingLabel: loading,
  })) {
    if (typeof value !== 'string' || !value.trim())
      throw new TypeError(`Dialog ${name} must be a non-empty string`)
  }
}
