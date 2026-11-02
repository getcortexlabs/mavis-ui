import { markRaw, onBeforeUnmount, onDeactivated, type PropType } from '@vue/runtime-core'
import {
  createFileSelection,
  type FileSelectionController,
  type FileSelectionOptions,
  type FileItem,
  type FileSelectionErrorCode,
} from '../files.js'

/** Own this in the component that owns the selected files, not in a module singleton. */
export function useFileSelection(options: FileSelectionOptions = {}) {
  const selection = markRaw(createFileSelection(options))
  onDeactivated(() => selection.pause())
  onBeforeUnmount(() => selection.dispose())
  return selection
}

export const filePickerProps = {
  selection: { type: Object as PropType<FileSelectionController>, required: true as const },
  label: { type: String, required: true as const },
  disabled: Boolean,
  chooseLabel: { type: String, default: 'Choose files' },
  uploadLabel: { type: String, default: 'Upload' },
  cancelLabel: { type: String, default: 'Cancel' },
  retryLabel: { type: String, default: 'Retry' },
  removeLabel: { type: String, default: 'Remove' },
  emptyLabel: { type: String, default: 'No files selected' },
  pendingLabel: { type: String, default: 'Working' },
  statusLabels: {
    type: Object as PropType<Partial<Record<FileItem['status'], string>>>,
    default: () => ({}),
  },
  errorLabels: {
    type: Object as PropType<Partial<Record<FileSelectionErrorCode, string>>>,
    default: () => ({}),
  },
}

export function fileStatusText(
  item: FileItem,
  labels: Partial<Record<FileItem['status'], string>>,
) {
  return (
    labels[item.status] ??
    {
      selected: 'Ready',
      uploading: 'Uploading',
      uploaded: 'Uploaded',
      failed: 'Failed',
      cancelled: 'Cancelled',
    }[item.status]
  )
}
