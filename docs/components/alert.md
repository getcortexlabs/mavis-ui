---
title: Alert
description: Persistent inline messages with semantic tones, actions and controlled dismissal on NativeScript and Web.
---

# Alert

`MAlert` places a message in the screen's normal layout. Use it for context that should remain available while the person decides what to do next.

::: info Next alpha
Available in the repository for the next alpha; not included in `0.1.0-alpha.3`.
:::

<ComponentPreview component="alert" :height="1000" />

## Usage

```vue
<m-alert
  v-if="visible"
  title="Download failed"
  description="Check your connection and try again."
  tone="error"
  dismissible
  closeLabel="Dismiss download notice"
  @close="visible = false"
>
  <template #actions><m-button @click="retry">Try again</m-button></template>
</m-alert>
```

`visible` and `retry` belong to the app. Closing emits a request; the alert stays mounted until the app removes it.

## Props

| Prop | Type | Default | Behavior |
| --- | --- | --- | --- |
| `title` | `string` | required | Nonempty message title. |
| `description` | `string` | empty | Optional supporting text. |
| `tone` | `info \| success \| warning \| error` | `info` | Semantic icon and border color. |
| `dismissible` | `boolean` | `false` | Shows the close button. |
| `closeLabel` | `string` | `Dismiss message` | Accessible close-button name; translate in the app. Must be nonempty when dismissible. |
| `announce` | `boolean` | `false` | Opts into announcements for dynamic messages, without moving focus. |
| `width / grow / shrink` | dimension / number / number | `auto / 0 / context` | Layout participation, as in Column. |
| `id / accessibilityHidden` | string / boolean | — / false | Optional identifier and accessibility exclusion. |

Empty titles or required close labels throw `TypeError`. Text wraps naturally; actions sit below the message in a wrapping Row. There is no fixed height.

## Actions and dismissal

The named `actions` slot accepts app-owned controls. The close button emits `close` with no payload and remains separate from these controls. There is no default slot, timeout, queue, overlay, entrance animation or focus trap. [Toast](./toast) provides transient feedback; [Dialog](./dialog) requests a modal decision.

Info uses the theme accent; success, warning and error use their semantic colors. Icons are decorative. Write a title that communicates the state without relying on color alone.

## Announcements

Static notices default to `announce=false`. Enable it for newly inserted or updated results when speaking the message is useful. Web uses a `status` region, or `alert` for the error tone, around the title and description; actions stay outside this region. Initial-page announcement behavior varies by browser and screen reader.

On native, title and description form one accessible group and the action buttons remain individually accessible. When loaded, `announce=true` requests a platform announcement for new message text; repeated identical text on a retained page is not announced again. Pending work is cleared on unload/unmount. Actual speech and interruption depend on the active screen reader; changing the tone alone does not repeat the native announcement. Alert never moves focus or manages app navigation.

[Library](../showcase/library) uses alerts for cancelled, failed and completed downloads, with retry and open-saved actions.

## Full example

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/AlertDemo.vue

</details>
