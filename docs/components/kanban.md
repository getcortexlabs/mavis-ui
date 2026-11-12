---
title: Kanban
---

# Kanban

::: info Included in RC.12
Available in Mavis 0.1.0-rc.12 for Vue + Vite, Nuxt and NativeScript. Keep the Mavis packages at the same version.
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
| `animated / draggable / disabled` | boolean | true / true / false | Jolt settling of a released card, drag handle and all editing. |
| `moveLabel / upLabel / downLabel / emptyLabel / fullLabel` | string | English | Localizable control and status labels. |

Columns stack on narrow containers and sit side by side from 760px/DIP. Drag the handle to reorder or transfer; arrow keys on that handle, the move menu and up/down buttons offer alternatives. Full columns reject incoming cards, including while filtering. External model/filter changes cancel an active drag; rejected controlled updates keep the original model. Cards are not virtualized (maximum 500 cards / 12 columns). Dragging runs on Jolt drop zones: only the handle starts it, so the rest of the card keeps its controls and touch scrolling. A gap shows where the card will land, and a card released up to 60px/DIP below a column still drops into it. A release anywhere else, Escape, scrolling, a window that loses focus or a locked board returns the card. Dragging is limited to visible drop targets: use the menu for distant columns. On the Web a pointer drag needs a place on the page without transforms: inside an ancestor that keeps one, the arrow keys on the handle, the menu and the buttons still move cards. The `card` slot receives `{ card, column }`; the app owns persistence, editing and navigation.

`update:modelValue` → `KanbanCard[]`; `move` → `{ id, from, to, before }`.

<video controls playsinline preload="none" aria-label="Vue Web · Chromium · 1024 by 720 CSS pixels" src="/media/kanban-drop-web.mp4" style="width:100%;border-radius:16px"></video>

Chromium, real mouse input: a card reordered by its handle, moved to another column, refused by a column at capacity, released just below a short column, and a drag cancelled with Escape.

<<< @/../examples/catalog/shared/demos/KanbanDemo.vue
