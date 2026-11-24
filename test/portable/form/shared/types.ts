export type TaskDraft = {
  title: string
  notes: string
  priority: string | number | undefined
  done: boolean
}
export type SelectOption = {
  value: string | number
  label: string
  helperText: string | undefined
  disabled: boolean | undefined
}
