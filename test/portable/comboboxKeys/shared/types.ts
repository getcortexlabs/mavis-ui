export type SelectOption = {
  value: string | number
  label: string
  helperText: string | undefined
  disabled: boolean | undefined
}
export type ComboboxSnapshot = {
  query: string
  options: SelectOption[]
}
