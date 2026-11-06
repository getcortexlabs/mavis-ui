import type { PropType } from '@vue/runtime-core'
import type { ComposerAttachment, RefreshAction, SpeedDialAction } from '../screen-components.js'
import { textProps, inputProps, buttonProps } from './props.js'

const label = { type: String, required: true as const }
export const animatedTextProps = {
  id: String,
  text: label,
  variant: { ...textProps.variant, default: 'title' },
  tone: textProps.tone,
  by: { type: String as PropType<'word' | 'letter'>, default: 'word' },
  duration: { type: Number, default: 650 },
  stagger: { type: Number, default: 35 },
  distance: { type: Number, default: 16 },
  animated: { type: Boolean, default: true },
  appear: { type: Boolean, default: true },
  replayKey: { type: [String, Number], default: 0 },
}
export const composerProps = {
  id: String,
  label,
  modelValue: { type: String, default: '' },
  placeholder: String,
  disabled: Boolean,
  readonly: Boolean,
  loading: Boolean,
  maxLength: inputProps.maxLength,
  rows: { type: Number, default: 2 },
  error: String,
  attachments: { type: Array as PropType<readonly ComposerAttachment[]>, default: () => [] },
  attachable: { type: Boolean, default: true },
  attachLabel: { type: String, default: 'Add attachment' },
  removeLabel: { type: String, default: 'Remove attachment' },
  sendLabel: { type: String, default: 'Send message' },
  sendingLabel: { type: String, default: 'Sending' },
  /** Use only for an overlay composer; ordinary flowing content follows its screen. */
  followKeyboard: Boolean,
  keyboardOffset: { type: Number, default: 0 },
  /** Ctrl/Cmd+Enter only. Plain Enter always retains multiline editing. */
  shortcut: { type: Boolean, default: true },
}
export const pinInputProps = {
  id: String,
  label,
  modelValue: { type: String, default: '' },
  length: { type: Number, default: 6 },
  disabled: Boolean,
  readonly: Boolean,
  required: Boolean,
  name: String,
  form: String,
  error: String,
  helperText: String,
}
export const speedDialProps = {
  id: String,
  label,
  open: Boolean,
  disabled: Boolean,
  actions: { type: Array as PropType<readonly SpeedDialAction[]>, required: true as const },
  icon: { ...buttonProps.icon, default: 'plus' },
  closeLabel: { type: String, default: 'Close actions' },
  direction: { type: String as PropType<'up' | 'down'>, default: 'up' },
}
export const refreshControlProps = {
  id: String,
  label,
  refresh: { type: Function as PropType<RefreshAction>, required: true as const },
  height: { type: Number, default: 480 },
  disabled: Boolean,
  threshold: { type: Number, default: 80 },
  refreshLabel: { type: String, default: 'Refresh' },
  refreshingLabel: { type: String, default: 'Refreshing' },
  successLabel: { type: String, default: 'Up to date' },
  errorLabel: { type: String, default: 'Could not refresh' },
  retryLabel: { type: String, default: 'Try again' },
  cancelLabel: { type: String, default: 'Cancel refresh' },
}
export const collapsibleHeaderProps = {
  id: String,
  title: label,
  subtitle: String,
  image: String,
  height: { type: Number, default: 540 },
  expandedHeight: { type: Number, default: 240 },
  collapsedHeight: { type: Number, default: 64 },
  sectionHeight: { type: Number, default: 0 },
  parallax: { type: Number, default: 0.35 },
  backLabel: { type: String, default: 'Go back' },
  back: Boolean,
  topLabel: { type: String, default: 'Back to top' },
}
