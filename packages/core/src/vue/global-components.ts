import type { AccordionPanelProps } from '../accordion.js'
import type { TabPanelProps } from '../tabs.js'
import type { CivilDate, DateRange, DateRangeDraft, DateValidation } from '../date.js'
import type { ChoiceValue, ChoiceOption } from '../choice.js'
import type { DefineComponent } from '@vue/runtime-core'
import type { ComponentProps } from './component-props.js'
import type { DialogCloseReason } from '../dialog.js'
import type { SheetCloseReason } from '../sheet.js'
import type { InputHandle, InputActionHandle } from '../input.js'

type Action = { onClick?: () => void; onError?: (error: unknown) => void }
type Model = { 'onUpdate:modelValue'?: (value: number) => void }
type InputEvents = {
  onAction?: () => void
  'onUpdate:modelValue'?: (value: string) => void
  onFocus?: () => void
  onBlur?: () => void
  onSubmit?: (value: string) => void
}

/** Additional input attributes supplied by a renderer, without DOM dependencies in core. */
export interface InputPlatformAttributes {}
type SheetEvents = {
  'onUpdate:open'?: (value: boolean) => void
  onClose?: (reason: SheetCloseReason) => void
  onOpened?: () => void
}

/** Template props come from the same declarations used by both renderers. */
declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    MPopover: DefineComponent<
      ComponentProps['MPopover'] & {
        'onUpdate:open'?: (open: boolean) => void
        onClose?: (reason: import('../popover.js').PopoverCloseReason) => void
        onOpened?: () => void
      }
    > & { new (): { $slots: { default?: (scope: { close(): void }) => unknown } } }
    MMenu: DefineComponent<
      ComponentProps['MMenu'] & {
        'onUpdate:open'?: (open: boolean) => void
        onClose?: (reason: import('../popover.js').PopoverCloseReason) => void
        onSelect?: (value: ChoiceValue, item: import('../collections.js').MenuAction) => void
      }
    >
    MAppBar: DefineComponent<
      ComponentProps['MAppBar'] & { onBack?: () => void; onError?: (error: unknown) => void }
    > & {
      new (): { $slots: { leading?: () => unknown; actions?: () => unknown } }
    }
    MTabBar: DefineComponent<ComponentProps['MTabBar'] & { onError?: (error: unknown) => void }>
    MTimePicker: DefineComponent<
      ComponentProps['MTimePicker'] & {
        'onUpdate:modelValue'?: (value: string | null) => void
        'onUpdate:draft'?: (value: string) => void
        onValidityChange?: (value: import('../time.js').TimeValidation) => void
        onFocus?: () => void
        onBlur?: () => void
      },
      InputHandle
    >
    MVirtualList: import('./virtual-list.js').VirtualListComponent
    MThemeProvider: typeof import('./theme-provider.js').MThemeProvider
    MPlatform: typeof import('./platform.js').MPlatform
    MSpan: typeof import('./inline-content.js').MSpan
    MDatePicker: DefineComponent<
      ComponentProps['MDatePicker'] & {
        'onUpdate:modelValue'?: (value: CivilDate | null) => void
        'onUpdate:draft'?: (value: string) => void
        onValidityChange?: (value: DateValidation) => void
        onFocus?: () => void
        onBlur?: () => void
      },
      InputHandle
    >
    MDateRangePicker: DefineComponent<
      ComponentProps['MDateRangePicker'] & {
        'onUpdate:modelValue'?: (value: DateRange) => void
        'onUpdate:draft'?: (value: DateRangeDraft) => void
        onValidityChange?: (value: DateValidation) => void
        onFocus?: () => void
        onBlur?: () => void
      },
      InputHandle
    >
    MCombobox: DefineComponent<
      ComponentProps['MCombobox'] & {
        'onUpdate:modelValue'?: (value: ChoiceValue | null) => void
        'onUpdate:query'?: (value: string) => void
        onSelect?: (value: ChoiceOption | null) => void
        onFocus?: () => void
        onBlur?: () => void
      },
      InputHandle
    >
    MNumberInput: DefineComponent<
      ComponentProps['MNumberInput'] & {
        'onUpdate:modelValue'?: (value: number | null) => void
        'onUpdate:draft'?: (value: string) => void
        onValidityChange?: (value: import('../number-input.js').NumberDraft) => void
        onFocus?: () => void
        onBlur?: () => void
      },
      InputHandle
    >
    MMultiSelect: DefineComponent<
      ComponentProps['MMultiSelect'] & { 'onUpdate:modelValue'?: (value: ChoiceValue[]) => void }
    >
    MImage: DefineComponent<
      ComponentProps['MImage'] & { onLoad?: (src: string) => void; onError?: (src: string) => void }
    >
    MFilePicker: DefineComponent<ComponentProps['MFilePicker'], InputHandle>
    MFormGroup: DefineComponent<ComponentProps['MFormGroup']>
    MFormErrors: DefineComponent<
      ComponentProps['MFormErrors'] & { onFocus?: (field: string, focused: boolean) => void }
    >
    MSteps: DefineComponent<
      ComponentProps['MSteps'] & { 'onUpdate:modelValue'?: (value: ChoiceValue) => void }
    >
    MPagination: DefineComponent<
      ComponentProps['MPagination'] & { 'onUpdate:modelValue'?: (value: number) => void }
    >
    MScreen: DefineComponent<ComponentProps['MScreen']>
    MRow: DefineComponent<ComponentProps['MRow']>
    MColumn: DefineComponent<ComponentProps['MColumn']>
    MStack: DefineComponent<ComponentProps['MStack']>
    MGrid: DefineComponent<ComponentProps['MGrid']>
    MLink: DefineComponent<
      ComponentProps['MLink'] & Action & { onError?: (error: unknown) => void }
    >
    MBox: DefineComponent<ComponentProps['MBox']>
    MCard: DefineComponent<ComponentProps['MCard'] & Action>
    MText: DefineComponent<ComponentProps['MText']>
    MButton: DefineComponent<ComponentProps['MButton'] & Action> & {
      new (): {
        $slots: { default?: () => unknown; leading?: () => unknown; trailing?: () => unknown }
      }
    }
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
    MInput: DefineComponent<
      ComponentProps['MInput'] & InputEvents & InputPlatformAttributes,
      InputActionHandle
    >
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
