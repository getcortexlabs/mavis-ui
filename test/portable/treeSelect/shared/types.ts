export type TreeSelectNode = {
  id: string
  label: string
  disabled: boolean | undefined
  selectable: boolean | undefined
  children: TreeSelectNode[] | undefined
}
