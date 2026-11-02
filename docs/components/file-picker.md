---
title: FilePicker
description: User-triggered document selection and host-owned upload states for Web and NativeScript.
---

# FilePicker

`MFilePicker` opens the platform document selector and presents selected names, optional previews, progress and actions. The application supplies upload transport. Selecting a file never starts an upload.

::: info Unreleased
This component is not included in the published alpha.4.
:::

<ComponentPreview component="file-picker" :height="1100" />

## Shared selection

```vue
<script setup lang="ts">
import { useFileSelection } from '@getcortexlabs/mavis-core/vue'

const selection = useFileSelection({
  multiple: true,
  accept: ['image/*', '.pdf'],
  maxCount: 3,
  maxSize: 5 * 1024 * 1024,
})
</script>

<template>
  <m-file-picker :selection="selection" label="Trip documents" />
</template>
```

`useFileSelection` creates a controller owned by the current Vue component. Unmount cancels operations and releases resources. Deactivation pauses operations and retains files for explicit retry. Keep the owner above a conditional `MFilePicker` if its selection should survive hiding the control. Hiding, unloading or disabling the picker pauses its work; remounting does not resume uploads automatically.

The framework-neutral `createFileSelection(options)` from `@getcortexlabs/mavis-core` has the same state and actions; its owner must call `dispose()`. Create one per owner/request, never a server module singleton.

| Option | Default | Meaning |
| --- | --- | --- |
| `multiple` | `false` | Single selection replaces the prior file after validation. Multiple selection appends. |
| `accept` | `[]` | Extensions, exact MIME types or families such as `image/*`. |
| `maxCount` | `1`, or `10` when multiple | Maximum selected descriptors. Single mode always accepts at most one. |
| `maxSize` | unset | Per-file byte limit. A provider with unknown size cannot be checked locally. |
| `initial` | `[]` | Serializable existing descriptors; no local handles or previews are created. |
| `upload` | unset | Host callback for explicit upload/retry. No callback means selection-only UI. |

Cancelling preserves the previous selection. Invalid batches are rejected as a whole and their new resources are released. Reselecting the same file is allowed; each accepted selection gets a new ID. Multiple mode does not deduplicate separate selections. Accept/type/size checks help the UI; the server still owns authoritative validation. Unknown file types require a matching extension hint when MIME metadata is unavailable.

## State and transport

`selection.state` contains `items`, `picking` and an optional selection `error` with code `picker`, `type`, `size` or `count`. Use `subscribe(listener)` for external observation; it returns an unsubscribe function. Snapshots are immutable. Each `FileItem` contains only `id`, `name`, optional `size`/`type`, `status`, optional `progress` and `error`. Status is `selected`, `uploading`, `uploaded`, `failed` or `cancelled`.

The injected `upload({ item, handle, cancellation, progress })` returns a promise. Fulfilment marks success; rejection marks failure. `progress(loaded, total?)` reports bytes, with a positive total for known progress. Omitting total displays indeterminate progress. Reaching 100% does not complete the promise. Connect `cancellation.onCancel(callback)` to the host request's abort mechanism and release that subscription when the request settles.

The controller exposes `upload(id)`, `retry(id)`, `cancel(id)`, `remove(id)`, `clear()`, `pause()` and `dispose()`. Retry calls the same host callback with the retained local handle and begins a new attempt. It does not imply resumable transfer or server idempotency. Cancel retains the local file; remove/clear/dispose release it. Completion and progress from cancelled, removed or replaced attempts are ignored, including transports that fail to abort. Successful local files remain available for preview until released by their owner.

For example, the Web host can translate the opaque handle into a browser `File`:

```ts
import { getWebFile } from '@getcortexlabs/mavis-web'
import type { FileUpload } from '@getcortexlabs/mavis-core'

// uploadURL comes from application configuration; authentication stays in the host.
const upload: FileUpload = async ({ handle, cancellation }) => {
  const abort = new AbortController()
  const unsubscribe = cancellation.onCancel(() => abort.abort())
  try {
    const body = new FormData()
    body.append('file', getWebFile(handle))
    const response = await fetch(uploadURL, { method: 'POST', body, signal: abort.signal })
    if (!response.ok) throw new Error('Upload failed. Try again.')
  } finally {
    unsubscribe()
  }
}
```

This example has indeterminate progress because `fetch` does not report uploaded bytes here. Endpoints, credentials, request headers, timeouts, storage, retention and resumable upload policy remain application concerns. Mavis supplies no background transfer service.

## Platform resources and previews

Web uses a fresh `<input type="file">` created during button activation. Images may get an object URL preview; the URL is revoked on resource release. A broken preview leaves the name and actions intact. The normal button supports Tab, Enter and Space. Focus returns to the selector after selection/cancellation and before a selected item is removed.

iOS uses `UIDocumentPickerViewController` with copy/import mode on iOS 14+. The system makes a temporary private copy, which Mavis deletes on release; the original document is untouched. Quick Look requests a bounded thumbnail. Android uses `ACTION_OPEN_DOCUMENT` and transient read access to the selected content URI. It does not request broad storage permissions or take persistent URI grants. Provider thumbnails are available on Android API 29+ when supported. The Activity pause caused by opening the system picker keeps that selection request alive; leaving or unmounting its Vue owner cancels it. These are document pickers that can select images; there is no camera capture or dedicated Photos-library picker. Cloud providers may download their selected document or thumbnail. See [Apple document picker](https://developer.apple.com/documentation/uikit/uidocumentpickerviewcontroller), [Quick Look thumbnails](https://developer.apple.com/documentation/quicklookthumbnailing/qlthumbnailgenerator) and [Android document access](https://developer.android.com/training/data-storage/shared/documents-files).

Native hosts import `getNativeFile(handle)` from `@getcortexlabs/mavis/vue`. It returns `{ platform, native, openRead }`: `native` is an Android content `Uri` or iOS `NSURL`; `openRead()` returns `{ native, close }`, containing a `java.io.InputStream` or opened `NSInputStream`. Native objects have type `unknown` at this boundary; narrow/cast them with the host's platform typings. Close streams after use; removing/disposal also closes streams opened through this accessor. Accessors reject released handles. Raw paths and URI strings are not a portable file API. Handles belong to the current process/selection and cannot be saved for a later launch.

Preview failure does not reject selection. `selection.preview(id)` is renderer-specific client state, separate from serializable descriptors. Use `hasFile(id)` to distinguish local resources from metadata-only entries. SSR renders initial names/statuses and placeholders without activating a picker or allocating object URLs. Initial descriptors never restore local upload/retry capability; the user must select a file again. Serialize only `selection.state.items`, never the controller, handles, previews, `File`, `Blob` or native resources.

## Component props

| Prop | Purpose |
| --- | --- |
| `selection` | Required `FileSelectionController`. |
| `label` | Required nonempty visible/accessibility label. |
| `disabled` | Blocks actions and pauses active work; defaults to false. |
| `chooseLabel / uploadLabel / cancelLabel / retryLabel / removeLabel` | Translate action text; defaults are English. File action names include the filename. |
| `emptyLabel / pendingLabel` | Translate empty and indeterminate states. |
| `statusLabels` | Optional mapping for all five status names. |
| `errorLabels` | Optional mapping for selection error codes. Host transport owns its error messages. |

There are no component events or slots. The controller owns the state, and can be used independently of forms. Names wrap and actions wrap onto additional rows at narrow widths. Previews are decorative; the visible filename remains the content label. The [shared demonstration source](#full-example) simulates transfer locally and sends no files.

A component ref exposes the portable `InputHandle` methods `focus()` and `blur()`. Focus targets the Choose action without opening the platform selector; it does nothing while disabled or a selection is pending. Blur releases that action's focus without cancelling selection or upload. This supports form error targets and focus after a step transition:

```ts
import { ref } from 'vue'
import type { InputHandle } from '@getcortexlabs/mavis-core'

const attachmentPicker = ref<InputHandle>() // bind ref="attachmentPicker" on MFilePicker
// After the control is mounted:
attachmentPicker.value?.focus()
attachmentPicker.value?.blur()
```

## Full example

<<< @/../examples/catalog/shared/demos/FilePickerDemo.vue
