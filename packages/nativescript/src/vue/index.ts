import { MPopover } from './components/MPopover.js'
import { MMenu, MAppBar, MTabBar } from './components/navigation.js'
import { MTimePicker } from './components/MTimePicker.js'
import { MVirtualList } from './components/MVirtualList.js'
import { MNumberInput, MMultiSelect } from './components/configurator.js'
import { MImage } from './components/MImage.js'
import { MStack } from './components/MStack.js'
import { MGrid } from './components/MGrid.js'
import { MLink } from './components/MLink.js'
import { MDatePicker, MDateRangePicker } from './components/MDatePicker.js'
import { MCombobox } from './components/MCombobox.js'
import { MFilePicker } from './components/MFilePicker.js'
import { MFormGroup, MFormErrors, MSteps, MPagination } from './components/workflows.js'
import { MChip } from './components/MChip.js'
import { MEmptyState } from './components/MEmptyState.js'
import type { App, Component } from 'nativescript-vue'
import { createMavisServices, type MavisServiceOptions } from './services.js'
export { createMavisServices } from './services.js'
export type { MavisServiceOptions } from './services.js'
import { MThemeProvider, MSpan } from '@getcortexlabs/mavis-core/vue'
import { MScreen } from './components/MScreen.js'
import { MBox, MRow, MColumn } from './components/layout.js'
import { MCard } from './components/MCard.js'
import { MText } from './components/MText.js'
import { MButton } from './components/MButton.js'
import { MToast } from './components/MToast.js'
import { MDialog } from './components/MDialog.js'
import { MListItem } from './components/MListItem.js'
import { MSeparator } from './components/MSeparator.js'
import { MAvatar } from './components/MAvatar.js'
import { MBadge } from './components/MBadge.js'
import { MSkeleton } from './components/MSkeleton.js'
import { MProgress } from './components/MProgress.js'
import { MAccordion } from './components/MAccordion.js'
import { MSegmentedControl } from './components/MSegmentedControl.js'
import { MAlert } from './components/MAlert.js'
import { MTabs } from './components/MTabs.js'
import { MSelect } from './components/MSelect.js'
import { MRadioGroup } from './components/MRadioGroup.js'
import { MCheckbox } from './components/MCheckbox.js'
import { MSwitch } from './components/MSwitch.js'
import { MSlider } from './components/MSlider.js'
import { MInput } from './components/MInput.js'
import { MIcon } from './components/MIcon.js'
import { MReveal } from './components/MReveal.js'
import { MSheet } from './components/MSheet.js'
import type { ClaimSystemBack, SystemBackClaimant } from './system-back.js'

export {
  MThemeProvider,
  MSpan,
  MScreen,
  MBox,
  MRow,
  MColumn,
  MStack,
  MGrid,
  MLink,
  MCard,
  MText,
  MButton,
  MSlider,
  MSwitch,
  MCheckbox,
  MRadioGroup,
  MSelect,
  MToast,
  MDialog,
  MTabs,
  MSkeleton,
  MChip,
  MEmptyState,
  MProgress,
  MAccordion,
  MSegmentedControl,
  MAlert,
  MListItem,
  MSeparator,
  MAvatar,
  MBadge,
  MInput,
  MIcon,
  MReveal,
  MSheet,
  MDatePicker,
  MDateRangePicker,
  MNumberInput,
  MMultiSelect,
  MImage,
  MCombobox,
  MFilePicker,
  MFormGroup,
  MFormErrors,
  MSteps,
  MPagination,
  MPopover,
  MMenu,
  MAppBar,
  MTabBar,
  MTimePicker,
  MVirtualList,
}
export {
  useMavisTheme,
  useToast,
  useFormController,
  useFormField,
  useFileSelection,
  useMavisNavigation,
} from '@getcortexlabs/mavis-core/vue'
export type {
  MavisThemeContext,
  Appearance,
  AppearanceMode,
  AppearanceSource,
} from '@getcortexlabs/mavis-core/vue'
export type { Align, Justify } from './components/layout.js'
export type {} from '@getcortexlabs/mavis-core/vue'

export type { SystemBackClaimant, ClaimSystemBack }

export type MavisOptions = MavisServiceOptions & { components?: false | Record<string, Component> }

/** Create one plugin per application; `system` appearance follows the device. Vue also resolves MButton as <m-button>. */
export function createMavis(options: MavisOptions = {}) {
  return {
    install(app: App) {
      const { components, ...services } = options
      createMavisServices(services).install(app)
      if (components === false) return
      for (const [name, component] of Object.entries(
        components ?? {
          MThemeProvider,
          MSpan,
          MScreen,
          MBox,
          MRow,
          MColumn,
          MStack,
          MGrid,
          MLink,
          MCard,
          MText,
          MButton,
          MSlider,
          MSwitch,
          MCheckbox,
          MRadioGroup,
          MSelect,
          MToast,
          MDialog,
          MTabs,
          MSkeleton,
          MChip,
          MEmptyState,
          MProgress,
          MAccordion,
          MSegmentedControl,
          MAlert,
          MListItem,
          MSeparator,
          MAvatar,
          MBadge,
          MInput,
          MIcon,
          MReveal,
          MSheet,
          MDatePicker,
          MDateRangePicker,
          MNumberInput,
          MMultiSelect,
          MImage,
          MCombobox,
          MFilePicker,
          MFormGroup,
          MFormErrors,
          MSteps,
          MPagination,
          MPopover,
          MMenu,
          MAppBar,
          MTabBar,
          MTimePicker,
          MVirtualList,
        },
      )) {
        app.component(name, component)
      }
    },
  }
}

export * from '../files.js'
