---
title: SpeedDial
---

# SpeedDial

::: info In development
Available on this branch for Vue + Vite, Nuxt and NativeScript. Not yet included in the published npm version.
:::

<ComponentPreview component="speed-dial" :height="1000" />

```vue
<MSpeedDial
  v-model:open="open"
  label="Create something"
  :actions="actions"
  @select="handleAction"
/>
```

| Prop                           | Type                        | Default                      | Contract                                                 |
| ------------------------------ | --------------------------- | ---------------------------- | -------------------------------------------------------- |
| `label / actions`              | string / SpeedDialAction[]  | required                     | Visible trigger and named actions.                       |
| `open`                         | boolean                     | false                        | Controlled via v-model:open.                             |
| `direction`                    | up or down                  | up                           | Preferred opening direction.                             |
| `disabled / icon / closeLabel` | boolean / IconName / string | false / plus / Close actions | Trigger availability, artwork and explicit close action. |

A controlled quick-action launcher using the existing Popover lifecycle. Actions have unique value, label, optional icon and disabled. Selection emits select(value, action) and requests closing. The application owns the action itself. Jolt animates the panel and sequential action entry; keyboard and focus behavior remain with Popover. Escape, outside dismissal and native back preserve the existing overlay rules. Direction chooses upward/downward preferred placement; Web fits the viewport. Native presentation uses the existing popover layer.

<<< @/../examples/catalog/shared/demos/SpeedDialDemo.vue
