---
title: Menu
---

# Menu

::: info Alpha.10
Available in Mavis alpha.10 for Vue Web and NativeScript. Keep core and renderer versions aligned.
:::

<ComponentPreview component="menu" :height="800" />

```vue
<MMenu
  v-model:open="open"
  label="Actions"
  triggerLabel="Actions"
  :items="actions"
  @select="onAction"
/>
```

| Property               | Type            | Default              | Description                                                                                           |
| ---------------------- | --------------- | -------------------- | ----------------------------------------------------------------------------------------------------- |
| `items`                | `MenuItem[]`    | `required`           | Actions with stable value, label, icon, disabled and destructive; or group/separator with unique key. |
| `open / v-model:open`  | `boolean`       | `false`              | Controlled visibility.                                                                                |
| `label / triggerLabel` | `string`        | `required`           | Menu name and trigger text.                                                                           |
| `placement / width`    | `Popover props` | `bottom-start / 280` | Shared anchored presentation.                                                                         |

A single-level action menu built on Popover. `select(value, item)` emits only for an enabled action, then requests closure with reason `select`. String and numeric identities stay distinct. Web supports Enter/Space, Up/Down, Home/End, single-character typeahead and Escape with return focus. Disabled actions are skipped by arrow navigation. Groups are visual headings; separators are not actions. Native uses accessible Mavis buttons in an anchored layer. No submenu, checkbox/radio action state, or async transaction ownership is implied; keep long tasks and confirmations in the application.

<<< @/../examples/catalog/shared/demos/MenuDemo.vue
