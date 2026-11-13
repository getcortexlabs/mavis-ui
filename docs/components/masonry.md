---
title: Masonry
---

# Masonry

::: info RC.12.1
Included in RC.12.1 for Vue + Vite, Nuxt and NativeScript.
:::

<ComponentPreview component="masonry" :height="1100" />

```vue
<MMasonry
  :items="items"
  label="Inspiration"
  :columns="3"
><template #item="{ item }"><MCard><MText :text="item.id" /></MCard></template></MMasonry>
```

| Prop                       | Type                   | Default             | Contract                                                                                   |
| -------------------------- | ---------------------- | ------------------- | ------------------------------------------------------------------------------------------ |
| `items`                    | readonly MasonryItem[] | required            | Unique stable id and optional estimatedHeight. Up to 500 items; app metadata is preserved. |
| `columns / minColumnWidth` | number                 | 4 / 220             | Maximum 1–12 columns and minimum width >=40 pixels/DIP. Uses available container width.    |
| `gap / animated`           | Spacing / boolean      | md / true           | Token or numeric spacing and Jolt layout changes.                                          |
| `label / id`               | string                 | required / optional | Accessible component name and optional stable ID.                                          |

The item slot receives { item, index, width }. Each item is measured and placed in the shortest column while preserving logical DOM/native order and stable identity. Reading and keyboard order follow the original collection. Late image/font measurements update the layout. Initial SSR uses one estimated column and is enhanced after measurement. Give images a height or aspect ratio to reduce initial movement. This is a bounded, non-virtualized collection; use MVirtualList for long feeds. Height changes, filtering, reordering and container resizing use Jolt when animated=true. Observers stop on deactivation/unmount.

`item` slot → `{ item, index, width }`.

Motion uses Jolt and respects reduced motion. Use `:animated="false"` for static presentation.

In a shared screen for the experimental Mac target, Masonry places items with the same rules, measuring each item at its column width, and its item slot hands the same `{ item, index, width }`. See [Masonry and resizable panels](../guide/macos-experimental#masonry-and-resizable-panels) in the Mac guide.

<<< @/../examples/catalog/shared/demos/MasonryDemo.vue
