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
