import type { PropType } from '@vue/runtime-core'
import type { ChoiceOption, ChoiceValue } from '../choice.js'
import type { MarqueeItem, SwipeCard, TourStep } from '../creative-controls.js'
const label = { type: String, required: true as const }
const animated = { type: Boolean, default: true }
export const colorPickerProps = {
  id: String,
  label,
  modelValue: { type: String, default: '#9C5270' },
  disabled: Boolean,
  readonly: Boolean,
  alpha: Boolean,
  animated,
  palette: {
    type: Array as PropType<readonly string[]>,
    default: () => ['#9C5270', '#51847B', '#BF733E', '#6366A4', '#213A32', '#E6C88E'],
  },
  colorLabel: { type: String, default: 'HEX or RGB' },
  hueLabel: { type: String, default: 'Hue' },
  saturationLabel: { type: String, default: 'Saturation' },
  brightnessLabel: { type: String, default: 'Brightness' },
  alphaLabel: { type: String, default: 'Opacity' },
  paletteLabel: { type: String, default: 'Palette' },
  invalidLabel: { type: String, default: 'Enter a valid HEX or RGB color.' },
}
export const swipeDeckProps = {
  id: String,
  label,
  items: { type: Array as PropType<readonly SwipeCard[]>, required: true as const },
  modelValue: { type: [String, Number] as PropType<ChoiceValue | null>, default: null },
  disabled: Boolean,
  animated,
  height: { type: Number, default: 340 },
  threshold: { type: Number, default: 90 },
  acceptLabel: { type: String, default: 'Keep' },
  rejectLabel: { type: String, default: 'Pass' },
  undoLabel: { type: String, default: 'Undo' },
  canUndo: Boolean,
  emptyLabel: { type: String, default: 'All caught up.' },
}
export const gaugeProps = {
  id: String,
  label,
  value: { type: Number, required: true as const },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  size: { type: Number, default: 220 },
  strokeWidth: { type: Number, default: 7 },
  semi: Boolean,
  animated,
  animateNumber: Boolean,
  color: String,
  suffix: { type: String, default: '' },
  formatValue: Function as PropType<(value: number) => string>,
}
export const transferListProps = {
  id: String,
  label,
  options: { type: Array as PropType<readonly ChoiceOption[]>, required: true as const },
  modelValue: { type: Array as PropType<readonly ChoiceValue[]>, default: () => [] },
  disabled: Boolean,
  animated,
  availableLabel: { type: String, default: 'Available' },
  selectedLabel: { type: String, default: 'Selected' },
  searchLabel: { type: String, default: 'Filter' },
  addLabel: { type: String, default: 'Add selected' },
  removeLabel: { type: String, default: 'Remove selected' },
  emptyLabel: { type: String, default: 'No matches' },
}
export const tourProps = {
  id: String,
  label,
  steps: { type: Array as PropType<readonly TourStep[]>, required: true as const },
  modelValue: { type: String as PropType<string | null>, default: null },
  animated,
  nextLabel: { type: String, default: 'Next' },
  backLabel: { type: String, default: 'Back' },
  skipLabel: { type: String, default: 'End tour' },
  finishLabel: { type: String, default: 'Finish' },
}
export const tourTargetProps = { name: { type: String, required: true as const } }
export const marqueeProps = {
  id: String,
  label,
  items: { type: Array as PropType<readonly MarqueeItem[]>, required: true as const },
  autoplay: Boolean,
  paused: Boolean,
  speed: { type: Number, default: 35 },
  direction: { type: String as PropType<'left' | 'right'>, default: 'left' },
  itemWidth: { type: Number, default: 180 },
  gap: { type: Number, default: 16 },
  playLabel: { type: String, default: 'Play motion' },
  pauseLabel: { type: String, default: 'Pause motion' },
}
