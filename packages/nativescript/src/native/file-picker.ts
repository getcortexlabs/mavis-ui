import type { FilePickerAdapter } from '@getcortexlabs/mavis-core'

/** NativeScript resolves this module to the .ios/.android implementation at bundle time. */
export function createNativeFilePicker(): FilePickerAdapter {
  return {
    pick: () => Promise.reject(new Error('File picking requires the iOS or Android runtime')),
  }
}
