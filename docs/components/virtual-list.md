---
title: VirtualList
---

# VirtualList

::: info In development
Available in this PR; not yet published to npm. The published baseline remains alpha.9.
:::

<ComponentPreview component="virtual-list" :height="800" />

```vue
<MVirtualList
  :items="items"
  itemKey="id"
  :rowHeight="72"
  :height="360"
  label="Collections"
><template #default="{ item }">…</template></MVirtualList>
```

| Property             | Type                                      | Default               | Description                                                    |
| -------------------- | ----------------------------------------- | --------------------- | -------------------------------------------------------------- |
| `items`              | `readonly T[]`                            | `required`            | Collection owned by the app.                                   |
| `itemKey`            | `keyof T / (item: T) => string or number` | `id`                  | Unique stable identity; index keys are unsuitable for reorder. |
| `rowHeight`          | `number`                                  | `required`            | Fixed positive row height in CSS px / DIP.                     |
| `height`             | `number`                                  | `required`            | Finite scroll viewport height.                                 |
| `overscan`           | `number`                                  | `3`                   | Extra Web rows; native owns recycling buffers.                 |
| `initialIndex`       | `number`                                  | `0`                   | Initial scroll destination.                                    |
| `label / emptyLabel` | `string`                                  | `required / No items` | List name and empty fallback.                                  |

A vertical, fixed-row-height collection. Web renders only the viewport plus overscan; NativeScript uses its recycled ListView. The typed default slot receives `{ item, index, itemKey }`; `empty` replaces the empty fallback. `scrollToIndex(index)` scrolls through a public handle and rejects an invalid index. Use immutable array replacement or reactive items. Duplicate/missing keys fail early, and numeric/string keys stay distinct. Reordering preserves the first visible logical item where possible (native restores its row, Web also retains the pixel offset).

Keep drafts, selection and loading state in the item or an external store keyed by identity. Cell-local state is not retained after unmount; native cells reset their keyed child when reused. Web keeps a focused row mounted while scrolling and returns focus to the list if that item is removed. Arbitrary native editor focus across offscreen recycling is not promised. Choose rowHeight to fit the actual text/accessibility font size; variable-height rows, paging, drag reorder and automatic scroll restoration across route unmounts are outside this first contract. Give the list its own bounded viewport; avoid placing it inside another vertical scroller. SSR renders the same bounded initial window and hydrates its initial scroll position.

<<< @/../examples/catalog/shared/demos/VirtualListDemo.vue
