---
title: Dialog
description: Controlled confirmations, destructive decisions and processing on NativeScript and Web.
---

# Dialog

`MDialog` · A moment to decide.

::: info Next alpha
Dialog is available in the repository; it is not part of `0.1.0-alpha.3`.
:::

<ComponentPreview component="dialog" :height="700" />

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
const open = ref(false)
const loading = ref(false)
const error = ref('')
async function confirm() {
  loading.value = true
  error.value = ''
  try {
    await saveChanges() // Your application's operation.
    open.value = false
  } catch {
    error.value = 'Could not save. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
<template>
  <m-screen>
    <m-button @click="open = true">Save changes</m-button>
    <m-dialog v-model:open="open" title="Save changes?"
      :description="error || 'Your profile will be updated.'"
      :loading="loading" confirmLabel="Save" cancelLabel="Keep editing"
      loadingLabel="Saving…" @confirm="confirm" />
  </m-screen>
</template>
```

`saveChanges` represents your application operation. `confirm` does not close the Dialog: the parent controls `open`, can show an error in `description` and permit another attempt. On NativeScript, place it inside `MScreen` and use the router back integration described in [Sheet](./sheet).

## Props

| Prop | Type | Default | Behavior |
| --- | --- | --- | --- |
| `open` | `boolean` | `false` | `v-model:open`. |
| `title` | `string` | required | Nonempty title and accessible name. |
| `description` | `string` | `''` | Optional plain text. HTML is not interpreted. |
| `tone` | `default \| danger` | `default` | Icon and confirmation emphasis. |
| `confirmLabel` | `string` | `Continue` | Primary action; nonempty. |
| `cancelLabel` | `string` | `Cancel` | Explicit cancellation; nonempty. |
| `loading` | `boolean` | `false` | Blocks actions, backdrop, Escape and back. |
| `loadingLabel` | `string` | `Working…` | Confirmation label while processing; nonempty. |
| `dismissible` | `boolean` | `true` | Allows backdrop, Escape and back. Cancel remains available. |
| `id` | `string` | — | Modal surface identifier. |

## Events and lifecycle

- `confirm()` requests the action and keeps the dialog open.
- `update:open(false)` requests dismissal; the parent can accept or reject it.
- `close(reason)` identifies `cancel`, `backdrop`, `escape`, `back`, `program` or `navigation`. It fires when dismissal is requested/started, before the animation finishes. A rejected request still reports its reason without leaving the dialog inert.

`DialogCloseReason` is exported by core. Setting `open` to `false` closes even while `loading` and emits `program`. Native navigation unload releases the layer and requests `navigation`, including retained pages; background unload preserves state for resume. On Web, route unmount removes the dialog and releases focus/scroll locking; it does not emit a navigation event.

The backdrop blocks the screen. On Web, Cancel receives initial focus; Tab stays between actions and closing restores a still-mounted opener. While processing, focus stays on the panel. Android handles back and Tab/Escape keys; iOS isolates modal content for assistive technology. This is not a comprehensive screen-reader or physical-device audit.

Long text scrolls inside the panel with actions in a separate area. Native opening dismisses the keyboard; the surface respects insets and follows rotation. Native entry uses Jolt; Web uses CSS. Both follow reduced motion. Toast waits while the modal is presented.

Use one modal at a time. Do not open Dialog inside Sheet or Select. Arbitrary slots, forms, stacking, global services and promise helpers are outside this first contract. Use Sheet for custom content.

## Full example

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/DialogDemo.vue

</details>

[Profile](../showcase/profile) requests confirmation before discarding edits.
