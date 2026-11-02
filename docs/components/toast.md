---
title: Toast
description: Local and application queued feedback with themed notifications, timed or manual dismissal, and native/Web presentation.
---

# Toast

`MToast` · Feedback that leaves the rest of the screen available.

::: info Next alpha
Toast is available in the repository. It is not included in `0.1.0-alpha.3`.
:::

<ComponentPreview component="toast" :height="940" />

## Usage

```vue
<script setup lang="ts">
import { useToast } from '@getcortexlabs/mavis-core/vue'

const toast = useToast()
function saved() {
  toast.show({
    title: 'Profile saved',
    message: 'Your changes are ready.',
    tone: 'success',
  })
}
</script>

<template>
  <m-screen>
    <m-button @click="saved">Save</m-button>
    <m-toast :controller="toast" closeLabel="Dismiss notice" />
  </m-screen>
</template>
```

Call `useToast()` in Vue setup. Each call creates its own queue, cleaned up with that scope. Connect it to one `MToast`; NativeScript requires an `MScreen` ancestor. For notifications across routes, use the application scope described below. Both renderer entry points also export `useToast`.

## Host props

| Prop | Type | Default | Behavior |
| --- | --- | --- | --- |
| `controller` | `ToastController` | required | The queue returned by `useToast()`. One host per local controller. |
| `closeLabel` | `string` | `Dismiss notification` | Accessible name for the close button. Translate it in the app. |

The host renders at the top of its viewport. It does not accept content slots or layout props. NativeScript keeps it inside the Screen's safe area; Web clears the host document's safe-area inset. It leaves the keyboard and current focus alone. It has no scrim, focus trap or router back handler.

## Messages and controller

`ToastOptions`, `ToastTone` and `ToastController` are exported by `@getcortexlabs/mavis-core`.

| Option | Type | Default | Behavior |
| --- | --- | --- | --- |
| `message` | `string` | required | Non-empty plain text. HTML is not interpreted. |
| `title` | `string` | omitted | Optional non-empty heading. |
| `tone` | `success \| error \| warning \| info` | `info` | Semantic icon and color. The warning color comes from `theme.colors.warning`. |
| `duration` | `number` | `5000` | Milliseconds after entry completes; `0` keeps the notice until dismissed. Must be finite and between 0 and 2147483647. |

- `toast.show(options)` copies the options and queues a message. It returns a numeric ID, or `undefined` after a local host has unloaded or its owner has been disposed.
- `toast.dismiss()` closes the current message. `toast.dismiss(id)` also lets the app remove a queued message; unknown IDs do nothing.
- `toast.clear()` discards waiting messages and dismisses the current one.

Messages appear in insertion order, one at a time. The next enters after the current one finishes leaving; its own clock starts after entry. Repeated calls create separate messages, including when the text is the same. Validation, persistence and network requests belong to the app.

## Time, interaction and lifecycle

The timer preserves remaining time when paused. It waits while a Sheet is open and while the app/document is in the background. On Web, hovering or focusing the toast also pauses it; Escape closes it when focus is inside. Closing a focused Web notice returns focus to its still-mounted opener. It never takes focus just to announce a message.

Native notices keep their close control reachable and allow long copy to scroll. Native entry uses Jolt and follows its reduced-motion policy; Web uses CSS with reduced-motion support. When a native screen reader is active at entry, automatic dismissal pauses so the notice can be closed manually. This is basic behavior, not a comprehensive assistive-technology audit.

For local queues, unmounting the host clears its queue. Native page unload during navigation also clears it, including pages retained by a router; calls while that page is away are ignored and returning accepts fresh messages. NativeScript also unloads views when the app enters the background; that case keeps the paused queue until the page loads again. A destroyed Vue scope rejects later asynchronous calls. Replacing the host's controller releases the previous queue. Use the application scope for delivery across routes.

Use `duration: 0` when the message must remain available. Keep important validation or instructions in the screen as well: a toast is transient feedback, not the only record of an error. Actions such as Undo, promise helpers, swipe dismissal, custom templates and operating-system notifications are outside this version.

## Full example

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/ToastDemo.vue

</details>

[Profile](../showcase/profile) uses Toast after a valid local save; field errors remain beside their inputs.

## Notifications across routes

`useToast()` keeps the existing local queue. `useToast({ scope: 'app' })` uses one queue per `createMavis` app, disposed on app unmount. It is not a singleton shared between SSR requests.

```ts
const toast = useToast({ scope: 'app' })
toast.show({ message: 'Your space is ready.', tone: 'success' })
navigation.push('/home')
```

Each `MScreen` automatically activates a host after the app queue is requested. Do not add another `MToast` for this queue inside Screen. Web apps without Screen can declare one host at the application root. Local queues still require their own `MToast` and reject late work after unload/unmount.

Host replacement preserves order and remaining time; the clock pauses without an active host. Old page callbacks cannot affect the new owner. Background/resume also preserves remaining time. The application queue uses the active Screen's theme; local queues keep the theme of their declared host. The queues are independent: choose the scope for each flow.

Customize the automatic close label with `createMavis({ toast: { closeLabel: 'Dismiss notification' } })`.

### During a modal

The policy is to **defer presentation** until the last modal stops covering the screen, without consuming the notification's duration or stealing focus. NativeScript uses Screen's overlay ownership. Web respects actually modal dialogs (`:modal`), including Sheet/Dialog; a non-modal `dialog.show()` does not block notifications. The host does not fight the browser top layer with z-index.

[Morrow](../showcase/morrow) demonstrates login → home with the same notification, and recovery that closes its Sheet before showing feedback. Mavis does not send email or authenticate accounts.
