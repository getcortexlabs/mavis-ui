---
title: NotificationCenter
---

# NotificationCenter

::: info In development
Available in this PR for Vue + Vite, Nuxt and NativeScript. Not included in the published RC.12.
:::

<ComponentPreview component="notification-center" :height="1100" />

```vue
<MNotificationCenter
  v-model="notifications"
  v-model:filter="filter"
  label="Inbox"
  @action="openNotification"
/>
```

| Prop                  | Type                         | Default             | Contract                                                                                            |
| --------------------- | ---------------------------- | ------------------- | --------------------------------------------------------------------------------------------------- |
| `modelValue`          | readonly MavisNotification[] | required            | Unique id/title, optional description/group/time/read/disabled/dismissible/actionLabel. Up to 1000. |
| `filter`              | all \| unread                | all                 | Controlled filter; hidden notifications remain in the model.                                        |
| `animated / disabled` | boolean                      | true / false        | Jolt collection layout and editing lock.                                                            |
| `label / id`          | string                       | required / optional | Accessible component name and optional stable ID.                                                   |

Grouped messages, unread count, read/unread, mark-all-read, dismissal and an application action share one controlled model. Unknown metadata is preserved. Disabled entries are untouched; dismissible=false prevents removal. When an action removes the focused message, focus returns to the filter. Titles, descriptions and optional time strings are text, never HTML. All toolbar/action labels are localizable. The app owns transport, authorization, persistence and action handling; this component does not request OS push permissions, subscribe to a service or fetch notifications.

`update:modelValue` → `MavisNotification[]`; `update:filter` → `all | unread`; `action` → notification ID.

Motion uses Jolt and respects reduced motion. Use `:animated="false"` for static presentation.

<<< @/../examples/catalog/shared/demos/NotificationCenterDemo.vue
