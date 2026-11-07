import {
  treeSelectProps,
  masonryProps,
  heatmapProps,
  imageCropperProps,
  schedulerProps,
  notificationCenterProps,
} from './advanced-props.js'
import {
  kanbanProps,
  donutChartProps,
  sparklineProps,
  gradientBackgroundProps,
  particleFieldProps,
  confettiProps,
} from './dashboard-props.js'
import {
  colorPickerProps,
  swipeDeckProps,
  gaugeProps,
  tourProps,
  tourTargetProps,
  transferListProps,
  marqueeProps,
} from './creative-props.js'
import {
  collapsibleHeaderProps,
  refreshControlProps,
  composerProps,
  speedDialProps,
  pinInputProps,
  animatedTextProps,
} from './screen-component-props.js'
import {
  sortableListProps,
  swipeActionsProps,
  numberFlowProps,
  resizablePanelsProps,
  imageCompareProps,
  imageViewerProps,
} from './interactive-props.js'
import {
  commandPaletteProps,
  navigationRailProps,
  breadcrumbProps,
  tooltipProps,
  timelineProps,
  chartProps,
} from './wayfinding-props.js'
import {
  dataTableProps,
  carouselProps,
  rangeSliderProps,
  calendarProps,
  ratingProps,
  treeViewProps,
} from './discovery-props.js'
import {
  popoverProps,
  menuProps,
  appBarProps,
  tabBarProps,
  timePickerProps,
  virtualListProps,
} from './navigation-props.js'
import { numberInputProps, multiSelectProps, imageProps } from './configurator-props.js'
import type { ExtractPublicPropTypes } from '@vue/runtime-core'
import type { SheetName } from '../sheet.js'
import { componentProps as foundationProps } from './props.js'
import { datePickerProps, dateRangePickerProps } from './date-props.js'
import { comboboxProps } from './combobox.js'
import { filePickerProps } from './files.js'
import { formGroupProps, formErrorsProps, stepsProps, paginationProps } from './workflow-props.js'

/** Complete registry, kept separate from the primitives used to compose controls. */
export const componentProps = {
  ...foundationProps,
  MTreeSelect: treeSelectProps,
  MMasonry: masonryProps,
  MHeatmap: heatmapProps,
  MImageCropper: imageCropperProps,
  MScheduler: schedulerProps,
  MNotificationCenter: notificationCenterProps,
  MKanban: kanbanProps,
  MDonutChart: donutChartProps,
  MSparkline: sparklineProps,
  MGradientBackground: gradientBackgroundProps,
  MParticleField: particleFieldProps,
  MConfetti: confettiProps,

  MColorPicker: colorPickerProps,
  MSwipeDeck: swipeDeckProps,
  MGauge: gaugeProps,
  MTour: tourProps,
  MTourTarget: tourTargetProps,
  MTransferList: transferListProps,
  MMarquee: marqueeProps,

  MCollapsibleHeader: collapsibleHeaderProps,
  MRefreshControl: refreshControlProps,
  MComposer: composerProps,
  MSpeedDial: speedDialProps,
  MPinInput: pinInputProps,
  MAnimatedText: animatedTextProps,

  MSortableList: sortableListProps,
  MSwipeActions: swipeActionsProps,
  MNumberFlow: numberFlowProps,
  MResizablePanels: resizablePanelsProps,
  MImageCompare: imageCompareProps,
  MImageViewer: imageViewerProps,

  MCommandPalette: commandPaletteProps,
  MNavigationRail: navigationRailProps,
  MBreadcrumb: breadcrumbProps,
  MTooltip: tooltipProps,
  MTimeline: timelineProps,
  MChart: chartProps,
  MDataTable: dataTableProps,
  MCarousel: carouselProps,
  MRangeSlider: rangeSliderProps,
  MCalendar: calendarProps,
  MRating: ratingProps,
  MTreeView: treeViewProps,
  MNumberInput: numberInputProps,
  MMultiSelect: multiSelectProps,
  MImage: imageProps,
  MDatePicker: datePickerProps,
  MDateRangePicker: dateRangePickerProps,
  MCombobox: comboboxProps,
  MFilePicker: filePickerProps,
  MFormGroup: formGroupProps,
  MFormErrors: formErrorsProps,
  MSteps: stepsProps,
  MPagination: paginationProps,
  MPopover: popoverProps,
  MMenu: menuProps,
  MAppBar: appBarProps,
  MTabBar: tabBarProps,
  MTimePicker: timePickerProps,
  MVirtualList: virtualListProps,
}
export type ComponentProps = {
  [Name in keyof typeof componentProps]: ExtractPublicPropTypes<(typeof componentProps)[Name]> &
    (Name extends 'MSheet' ? SheetName : unknown)
}
