export type FileItem = {
  id: string
  name: string
  size: number | undefined
  type: string | undefined
  status: string
  progress: number | undefined
  error: string | undefined
}
export type FileStatusLabels = {
  selected: string | undefined
  uploading: string | undefined
  uploaded: string | undefined
  failed: string | undefined
  cancelled: string | undefined
}
