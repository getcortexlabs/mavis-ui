import { MAnimatedText, MNumberFlow } from './text-effects.mjs'
import { MReveal } from './reveal.mjs'
// One module per component or family. A definition holds everything the compiler knows about a
// primitive, and each stage reads its part:
//
//   props          property name → kind: a shared kind (see kinds in model.mjs) or a reader
//                  function ({ value, attribute, ctx, ... }) => model property
//   required       properties the source must set; instead names, for one of them, the
//                  properties that stand in for it (a button with an href needs no onClick)
//   children       'elements' for containers, 'text' for text content; none otherwise
//   slots          named content besides the children, such as MScreen's overlay: a TSX
//                  slotOverlay property, a <template #overlay> in a Vue file; scoped, by slot,
//                  what a slot hands its content, (props, { record, T }) => [{ name, type }]
//   screen         the whole view of a component: the root of it, never inside anything, and
//                  its component is never shown inside another one
//   inline         only inside the text of MText (MSpan): never a view of its own
//   control        an interactive control, which a card with onClick cannot contain
//   failing        the handlers that may call a function that throws: the component shows it
//   handlers       event kinds of its own, by name: ({ T, record }) => the types an event of
//                  that kind passes its listener; a property takes the kind by that name
//   reveals        an animated Show may sit directly inside
//   animatesList   an animated For may sit directly inside
//   types          supporting ambient types, and records the record types among them
//   declaration    the ambient declaration that type-checks the sources
//   check          source rules once the properties are read; checkChildren after the children
//   swift          the SwiftUI view for a node; swiftRuntime the Swift helpers it calls, and
//                  uses the helpers it shares with other components (see flex.mjs)
//   focus          whether a node needs its view's focus state
//   composable     a function of the Mavis API that makes a handle the screen calls, such as
//                  useToast for MToast: its name and ambient declaration, what its calls become
//                  in the model, and the Swift that declares the handle
//   swiftRoot      a modifier the node puts on the root view of the shared component it is in
//   vue            what differs from passing properties through: rename, webOnly, attribute,
//                  webAttributes, script (imports and setup lines) and runtime (helper source);
//                  and for reading a Vue file, source: the properties it has no spelling for
//                  (hidden), the attribute an event needs beside it (flags), the name it
//                  needs then (names) and the property its content is (slot); declaration,
//                  the type a Vue file's use is checked against when it differs from the
//                  ambient one (a value that may be missing is null there)
//                  needs then (names) and the property its content is (slot); and types, the
//                  ambient types of its data a Vue file imports from Mavis by the same name
//
// Adding a component is adding a module and listing it here.
import { MTour, MTourTarget } from './tour.mjs'
import { MDatePicker, MDateRangePicker } from './date-picker.mjs'
import { MTimePicker } from './time-picker.mjs'
import { MScheduler } from './scheduler.mjs'
import { MCalendar } from './calendar.mjs'
import { MScreen } from './screen.mjs'
import { MColumn, MRow, MStack } from './stack.mjs'
import { MGrid } from './grid.mjs'
import { MCard } from './card.mjs'
import { MSpan, MText } from './text.mjs'
import { MBox } from './box.mjs'
import { MSeparator } from './separator.mjs'
import { MButton } from './button.mjs'
import { MInput, MCheckbox, MSelect } from './fields.mjs'
import { MThemeProvider } from './theme.mjs'
import { MPlatform } from './platform.mjs'
import { MMasonry } from './masonry.mjs'
import { MResizablePanels } from './panels.mjs'
import { MVirtualList } from './virtual-list.mjs'
import { MCollapsibleHeader, MRefreshControl } from './scroll-frame.mjs'
import { MIcon } from './icon.mjs'
import { MLink } from './link.mjs'
import { MBadge } from './badge.mjs'
import { MProgress } from './progress.mjs'
import { MSkeleton } from './skeleton.mjs'
import { MAlert } from './alert.mjs'
import { MEmptyState } from './empty-state.mjs'
import { MSwitch } from './switch.mjs'
import { MRangeSlider, MSlider } from './sliders.mjs'
import { MSegmentedControl } from './segmented.mjs'
import { MRadioGroup } from './radio.mjs'
import { MMultiSelect } from './multi-select.mjs'
import { MListItem } from './list-item.mjs'
import { MAccordion } from './accordion.mjs'
import { MTabs } from './tabs.mjs'
import { MPagination, MSteps } from './workflow.mjs'
import { MSparkline } from './sparkline.mjs'
import { MSheet } from './sheet.mjs'
import { MChip } from './chip.mjs'
import { MNumberInput } from './number-input.mjs'
import { MAvatar, MImage } from './image.mjs'
import { MDonutChart } from './donut.mjs'
import { MGauge } from './gauge.mjs'
import { MTimeline } from './timeline.mjs'
import { MTreeView } from './tree-view.mjs'
import { MAppBar, MBreadcrumb } from './wayfinding.mjs'
import { MNavigationRail, MTabBar } from './destinations.mjs'
import { MDialog } from './dialog.mjs'
import { MCommandPalette } from './command-palette.mjs'
import { MTooltip } from './tooltip.mjs'
import { MToast } from './toast.mjs'
import { MNotificationCenter } from './notification-center.mjs'
import { MFormGroup, MFormErrors } from './form.mjs'
import { MRating } from './rating.mjs'
import { MPinInput } from './pin-input.mjs'
import { MGradientBackground } from './gradient.mjs'
import { MCarousel } from './carousel.mjs'
import { MImageCompare } from './image-compare.mjs'
import { MImageCropper } from './image-cropper.mjs'
import { MImageViewer } from './image-viewer.mjs'
import { MDataTable } from './data-table.mjs'
import { MSortableList } from './sortable-list.mjs'
import { MSwipeActions } from './swipe-actions.mjs'
import { MSwipeDeck } from './swipe-deck.mjs'
import { MKanban } from './kanban.mjs'
import { MCombobox } from './combobox.mjs'
import { MTransferList } from './transfer-list.mjs'
import { MTreeSelect } from './tree-select.mjs'
import { MChart } from './chart.mjs'
import { MHeatmap } from './heatmap.mjs'
import { MComposer } from './composer.mjs'
import { MColorPicker } from './color-picker.mjs'
import { MFilePicker } from './file-picker.mjs'
import { MPopover, MMenu, MSpeedDial } from './popover.mjs'

/** In the order declarations and runtime helpers are written. */
export const components = {
  MTour,
  MTourTarget,
  MCalendar,
  MTimePicker,
  MScheduler,
  MDatePicker,
  MDateRangePicker,
  MScreen,
  MColumn,
  MReveal,
  MAnimatedText,
  MNumberFlow,
  MRow,
  MStack,
  MGrid,
  MBox,
  MCard,
  MText,
  MSpan,
  MSeparator,
  MThemeProvider,
  MPlatform,
  MButton,
  MInput,
  MCheckbox,
  MSelect,
  MMasonry,
  MResizablePanels,
  MVirtualList,
  MCollapsibleHeader,
  MRefreshControl,
  MIcon,
  MBadge,
  MProgress,
  MSkeleton,
  MAlert,
  MEmptyState,
  MSwitch,
  MSlider,
  MSegmentedControl,
  MRadioGroup,
  MMultiSelect,
  MListItem,
  MAccordion,
  MTabs,
  MSteps,
  MPagination,
  MSparkline,
  MImage,
  MSheet,
  MChip,
  MNumberInput,
  MRangeSlider,
  MAvatar,
  MDonutChart,
  MGauge,
  MTimeline,
  MTreeView,
  MBreadcrumb,
  MAppBar,
  MTabBar,
  MNavigationRail,
  MLink,
  MDialog,
  MCommandPalette,
  MTooltip,
  MToast,
  MNotificationCenter,
  MFormGroup,
  MFormErrors,
  MRating,
  MPinInput,
  MGradientBackground,
  MCarousel,
  MImageCompare,
  MDataTable,
  MSortableList,
  MSwipeActions,
  MSwipeDeck,
  MKanban,
  MImageCropper,
  MImageViewer,
  MCombobox,
  MTransferList,
  MTreeSelect,
  MChart,
  MHeatmap,
  MComposer,
  MColorPicker,
  MFilePicker,
  MPopover,
  MMenu,
  MSpeedDial,
}

const named = (flag) => {
  const names = Object.keys(components).filter((name) => components[name][flag])
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} or ${names.at(-1)}` : names[0]
}

/**
 * The composables that make a handle a screen calls, such as useToast, by name. A component
 * brings one with composable: { name, kind, declaration, exports, open, call, unused, swift }.
 */
export const composables = Object.fromEntries(
  Object.entries(components).flatMap(([owner, { composable }]) =>
    composable ? [[composable.name, { ...composable, owner }]] : [],
  ),
)

/** Whether a component's view is a whole screen: the app opens it, nothing shows it inside. */
export const isScreen = (view) => view?.v === 'element' && Boolean(components[view.tag]?.screen)

/** For messages: the components an animated Show or For can sit in. */
export const revealing = named('reveals')
export const listing = named('animatesList')
