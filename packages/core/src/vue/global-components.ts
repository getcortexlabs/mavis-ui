import type { DefineComponent } from '@vue/runtime-core'
import type { ComponentProps } from './props.js'

type Action = { onClick?: () => void }
type Model = { 'onUpdate:modelValue'?: (value: number) => void }
type InputEvents = {
  'onUpdate:modelValue'?: (value: string) => void
  onFocus?: () => void
  onBlur?: () => void
  onSubmit?: (value: string) => void
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
    MInput: DefineComponent<ComponentProps['MInput'] & InputEvents>
    MReveal: DefineComponent<ComponentProps['MReveal']>
  }
}
