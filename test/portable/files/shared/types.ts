export type TreeNode = {
  key: string
  label: string
  disabled: boolean | undefined
  children: TreeNode[] | undefined
  hasChildren: boolean | undefined
}
