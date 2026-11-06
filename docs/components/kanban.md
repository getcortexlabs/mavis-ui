---
title: Kanban
---

# Kanban

::: info In development
Available on this branch for Vue + Vite, Nuxt and NativeScript. Not yet included in the published npm release.
:::

<ComponentPreview component="kanban" :height="1000" />

```vue
<MKanban v-model="cards" :columns="columns" label="Studio" :query="query" />
```

| Prop | Type | Default | Contract |
| --- | --- | --- | --- |
| `columns` | readonly KanbanColumn[] | required | Unique id, title, optional positive integer limit. |
| `modelValue` | readonly KanbanCard[] | required | Unique id, column, title, optional description/disabled. Consumer metadata is preserved. |
| `query` | string | '' | Filters title/description without removing hidden cards. |
| `animated / draggable / disabled` | boolean | true / true / false | Jolt layout/settling, drag handle and all editing. |
| `moveLabel / upLabel / downLabel / emptyLabel / fullLabel` | string | English | Localizable control and status labels. |

Columns stack on narrow containers and sit side by side from 760px/DIP. Drag the handle to reorder or transfer; arrow keys on that handle, the move menu and up/down buttons offer alternatives. Full columns reject incoming cards, including while filtering. External model/filter changes cancel an active drag; rejected controlled updates keep the original model. Cards are not virtualized (maximum 500 cards / 12 columns). Dragging is limited to visible drop targets: use the menu for distant columns. The `card` slot receives `{ card, column }`; the app owns persistence, editing and navigation.

`update:modelValue` → `KanbanCard[]`; `move` → `{ id, from, to, before }`.

<<< @/../examples/catalog/shared/demos/KanbanDemo.vue
