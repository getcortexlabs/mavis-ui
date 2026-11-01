import type { AccordionPanelProps } from '../accordion.js'
import type { TabPanelProps } from '../tabs.js'
import type { ChoiceValue } from '../choice.js'
import type { DefineComponent } from '@vue/runtime-core'
import type { ComponentProps } from './props.js'
import type { DialogCloseReason } from '../dialog.js'
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
    MSelect: DefineComponent<
      ComponentProps['MSelect'] & { 'onUpdate:modelValue'?: (value: ChoiceValue) => void }
    >
    MTabs: DefineComponent<
      ComponentProps['MTabs'] & { 'onUpdate:modelValue'?: (value: ChoiceValue) => void }
    > & {
      new (): { $slots: { default?: (props: TabPanelProps) => unknown } }
    }
    MListItem: DefineComponent<ComponentProps['MListItem'] & Action> & {
      new (): { $slots: { leading?: () => unknown; trailing?: () => unknown } }
    }
    MSeparator: DefineComponent<ComponentProps['MSeparator']>
    MAvatar: DefineComponent<ComponentProps['MAvatar']>
    MBadge: DefineComponent<ComponentProps['MBadge']>
    MSkeleton: DefineComponent<ComponentProps['MSkeleton']>
    MChip: DefineComponent<
      ComponentProps['MChip'] & {
        'onUpdate:modelValue'?: (value: boolean) => void
        onRemove?: () => void
      }
    >
    MEmptyState: DefineComponent<ComponentProps['MEmptyState']> & {
      new (): { $slots: { illustration?: () => unknown; actions?: () => unknown } }
    }
    MProgress: DefineComponent<ComponentProps['MProgress']>
    MAccordion: DefineComponent<
      ComponentProps['MAccordion'] & { 'onUpdate:modelValue'?: (value: ChoiceValue[]) => void }
    > & {
      new (): { $slots: { default?: (props: AccordionPanelProps) => unknown } }
    }
    MSegmentedControl: DefineComponent<
      ComponentProps['MSegmentedControl'] & { 'onUpdate:modelValue'?: (value: ChoiceValue) => void }
    >

    MAlert: DefineComponent<ComponentProps['MAlert'] & { onClose?: () => void }> & {
      new (): { $slots: { actions?: () => unknown } }
    }
    MToast: DefineComponent<ComponentProps['MToast']>
    MDialog: DefineComponent<
      ComponentProps['MDialog'] & {
        'onUpdate:open'?: (value: boolean) => void
        onConfirm?: () => void
        onClose?: (reason: DialogCloseReason) => void
      }
    >
    MIcon: DefineComponent<ComponentProps['MIcon']>
    MReveal: DefineComponent<ComponentProps['MReveal']>
    MSheet: DefineComponent<ComponentProps['MSheet'] & SheetEvents>
  }
}
