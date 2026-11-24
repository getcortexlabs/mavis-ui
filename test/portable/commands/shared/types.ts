export type CommandItem = {
  value: string
  label: string
  description: string | undefined
  keywords: string[] | undefined
  group: string | undefined
  icon: string | undefined
  shortcut: string | undefined
  disabled: boolean | undefined
}
