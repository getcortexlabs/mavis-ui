import type { IconName } from './icon.js'

export type AlertTone = 'info' | 'success' | 'warning' | 'error'
export const alertAppearance = {
  info: { icon: 'info', tone: 'accent' },
  success: { icon: 'circle-check', tone: 'success' },
  warning: { icon: 'triangle-alert', tone: 'warning' },
  error: { icon: 'circle-alert', tone: 'danger' },
} as const satisfies Record<AlertTone, { icon: IconName; tone: string }>

export function checkAlertLabels(title: string, dismissible: boolean, closeLabel: string) {
  if (typeof title !== 'string' || !title.trim())
    throw new TypeError('Alert title must be a non-empty string')
  if (dismissible && (typeof closeLabel !== 'string' || !closeLabel.trim()))
    throw new TypeError('A dismissible Alert needs a non-empty closeLabel')
}
