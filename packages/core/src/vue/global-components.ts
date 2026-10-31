import type { ChoiceValue } from '../choice.js'
import type { DefineComponent } from '@vue/runtime-core'
import type { ComponentProps } from './props.js'
import type { SheetCloseReason } from '../sheet.js'

type Action = { onClick?: () => void }
type Model = { 'onUpdate:modelValue'?: (value: number) => void }
type InputEvents = {
  'onUpdate:modelValue'?: (value: string) => void
  onFocus?: () => void
  onBlur?: () => void
  onSubmit?: (value: string) => void
}
type SheetEvents = {
  'onUpdate:open'?: (value: boolean) => void
  onClose?: (reason: SheetCloseReason) => void
  onOpened?: () => void
}

/** Template props come from the same declarations used by both renderers. */
declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    MScreen: DefineComponent<ComponentProps['MScreen']>
    MRow: DefineComponent<ComponentProps['MRow']>
    MColumn: DefineComponent<ComponentProps['MColumn']>
    MBox: DefineComponent<ComponentProps['MBox']>
    MCard: DefineComponent<ComponentProps['MCard'] & Action>
    MText: DefineComponent<ComponentProps['MText']>
    MButton: DefineComponent<ComponentProps['MButton'] & Action>
    MSlider: DefineComponent<ComponentProps['MSlider'] & Model>
    MSwitch: DefineComponent<
      ComponentProps['MSwitch'] & { 'onUpdate:modelValue'?: (value: boolean) => void }
    >
    MCheckbox: DefineComponent<
      ComponentProps['MCheckbox'] & {
        'onUpdate:modelValue'?: (value: boolean) => void
        'onUpdate:indeterminate'?: (value: boolean) => void
      }
    >
    MRadioGroup: DefineComponent<
      ComponentProps['MRadioGroup'] & { 'onUpdate:modelValue'?: (value: ChoiceValue) => void }
    >
    MInput: DefineComponent<ComponentProps['MInput'] & InputEvents>
    MIcon: DefineComponent<ComponentProps['MIcon']>
    MReveal: DefineComponent<ComponentProps['MReveal']>
    MSheet: DefineComponent<ComponentProps['MSheet'] & SheetEvents>
  }
}
