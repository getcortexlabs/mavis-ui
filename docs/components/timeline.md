---
title: Timeline
---

# Timeline

::: info Added in alpha.11
Included in Mavis 0.1.0-alpha.11 for Vue + Vite, Nuxt and NativeScript iOS/Android. Keep core and renderers on the same version.
:::

<ComponentPreview component="timeline" :height="1000" />

```vue
<MTimeline :items="activity" label="Project activity"><template #default="{ item }"><MText :text="item.description" /></template></MTimeline>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `readonly TimelineItem[]` | required | Stable key, title, optional description, formatted time, icon and status. |
| `statusLabels` | `Record<TimelineStatus, string>` | English labels | complete, current, upcoming and error; status is readable without color. |
| `label / emptyLabel` | `string` | required / No activity yet | Accessible list name and empty-state copy. |
| `default` | `slot` | — | Receives { item, index }; content remains mounted as status changes. |

A chronological list in application order, with themed connectors, state icons and Jolt entry/indicator motion. No autonomous progress or timer is inferred. Time is already formatted by the application; use formatDateTime for locale/timezone-aware timestamps. Keep stable keys when replacing or reordering data. Reduced motion follows the Mavis motion context.

<<< @/../examples/catalog/shared/demos/TimelineDemo.vue
