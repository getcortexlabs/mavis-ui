export type FileSelectionState = {
  items: FileItem[]
  picking: boolean
  error: FileSelectionFailure | undefined
}
export type FileItem = {
  id: string
  name: string
  size: number | undefined
  type: string | undefined
  status: string
  progress: number | undefined
  error: string | undefined
}
export type FileSelectionFailure = {
  code: string
  message: string
}
