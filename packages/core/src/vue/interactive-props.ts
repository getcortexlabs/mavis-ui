import type { PropType } from '@vue/runtime-core'
import type { ChoiceValue } from '../choice.js'
import type { VirtualItemKey } from '../collections.js'
import type { SwipeAction, SwipeSide, ViewerImage } from '../interactive.js'
import type { NumberFlowFormat } from '../number-flow-format.js'
import { textProps } from './props.js'

const label = { type: String, required: true as const }
export const numberFlowProps = {
  id: String,
  value: { type: Number, required: true as const },
  locale: { type: String, default: 'en-US' },
  format: Object as PropType<NumberFlowFormat>,
  formatValue: Function as PropType<(value: number) => string>,
  label: String,
  variant: { ...textProps.variant, default: 'title' },
  tone: textProps.tone,
  duration: { type: Number, default: 650 },
  animated: { type: Boolean, default: true },
  announce: Boolean,
}
export const sortableListProps = {
  id: String,
  label,
  modelValue: { type: Array as PropType<readonly unknown[]>, required: true as const },
  itemKey: { type: [String, Function] as PropType<VirtualItemKey>, default: 'id' },
  itemLabel: Function as PropType<(item: unknown) => string>,
  height: { type: Number, default: 360 },
  disabled: Boolean,
  handleLabel: { type: String, default: 'Reorder' },
  moveUpLabel: { type: String, default: 'Move up' },
  moveDownLabel: { type: String, default: 'Move down' },
  emptyLabel: { type: String, default: 'No items' },
}
export const swipeActionsProps = {
  label,
  modelValue: { type: String as PropType<SwipeSide>, default: null },
  start: { type: Array as PropType<readonly SwipeAction[]>, default: () => [] },
  end: { type: Array as PropType<readonly SwipeAction[]>, default: () => [] },
  disabled: Boolean,
  actionWidth: { type: Number, default: 96 },
  direction: { type: String as PropType<'ltr' | 'rtl'>, default: 'ltr' },
  actionsLabel: { type: String, default: 'Actions' },
  closeLabel: { type: String, default: 'Close actions' },
}
export const resizablePanelsProps = {
  id: String,
  label,
  modelValue: { type: Number, default: 40 },
  min: { type: Number, default: 20 },
  max: { type: Number, default: 80 },
  step: { type: Number, default: 2 },
  snap: { type: Array as PropType<readonly number[]>, default: () => [25, 50, 75] },
  orientation: { type: String as PropType<'horizontal' | 'vertical'>, default: 'horizontal' },
  direction: { type: String as PropType<'ltr' | 'rtl'>, default: 'ltr' },
  height: { type: Number, default: 360 },
  collapsible: Boolean,
  disabled: Boolean,
  primaryLabel: { type: String, default: 'First panel' },
  secondaryLabel: { type: String, default: 'Second panel' },
  collapseLabel: { type: String, default: 'Collapse panel' },
  expandLabel: { type: String, default: 'Expand panel' },
}
export const imageCompareProps = {
  label,
  before: { type: String, required: true as const },
  after: { type: String, required: true as const },
  beforeLabel: { type: String, default: 'Before' },
  afterLabel: { type: String, default: 'After' },
  modelValue: { type: Number, default: 50 },
  step: { type: Number, default: 1 },
  aspectRatio: { type: Number, default: 1.5 },
  orientation: { type: String as PropType<'horizontal' | 'vertical'>, default: 'horizontal' },
  disabled: Boolean,
}
export const imageViewerProps = {
  label,
  images: { type: Array as PropType<readonly ViewerImage[]>, required: true as const },
  modelValue: { type: [String, Number] as PropType<ChoiceValue | null>, default: null },
  open: Boolean,
  maxZoom: { type: Number, default: 4 },
  disabled: Boolean,
  closeLabel: { type: String, default: 'Close viewer' },
  previousLabel: { type: String, default: 'Previous image' },
  nextLabel: { type: String, default: 'Next image' },
  zoomInLabel: { type: String, default: 'Zoom in' },
  zoomOutLabel: { type: String, default: 'Zoom out' },
  resetLabel: { type: String, default: 'Reset zoom' },
  errorLabel: { type: String, default: 'Image unavailable' },
}
