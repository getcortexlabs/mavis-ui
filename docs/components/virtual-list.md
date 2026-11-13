---
title: VirtualList
---

# VirtualList

::: info Alpha.10
Available in Mavis alpha.11 for Vue Web and NativeScript. Keep core and renderer versions aligned.
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
| `animated`           | `boolean`                                 | `true`                | Animate keyed data changes on Web/NativeScript.                |
| `label / emptyLabel` | `string`                                  | `required / No items` | List name and empty fallback.                                  |

A vertical, fixed-row-height collection. Web renders only the viewport plus overscan; NativeScript uses its recycled ListView. The typed default slot receives `{ item, index, itemKey }`; `empty` replaces the empty fallback. `scrollToIndex(index)` scrolls through a public handle and rejects an invalid index. Use immutable array replacement or reactive items. Duplicate/missing keys fail early, and numeric/string keys stay distinct. Insertions, removals, sorting and filtering preserve the first visible key and its offset inside the row on Web and NativeScript. If that key is removed, the nearest surviving index becomes the anchor; the result is clamped to the scrollable range.

Keep drafts, selection and loading state in the item or an external store keyed by identity. Cell-local state is not retained after unmount; native cells reset their keyed child when reused. Web keeps a focused row mounted while scrolling and returns focus to the list if that item is removed. Arbitrary native editor focus across offscreen recycling is not promised. Choose rowHeight to fit the actual text/accessibility font size; variable-height rows, paging, drag reorder and automatic scroll restoration across route unmounts are outside this first contract. Give the list its own bounded viewport; avoid placing it inside another vertical scroller. SSR renders the same bounded initial window and hydrates its initial scroll position.

### Keyed changes with Jolt

The upcoming release uses Jolt RC.15 `listChanges` for data changes. Retained visible rows move into their new positions, newly inserted visible items enter, and removed visible items can leave through bounded, noninteractive presentation copies. Rows entering the viewport through ordinary scrolling do not replay an entrance. `MVirtualList` owns this work: do not also animate its rows with `animateLayout` or another `listChanges` controller.

Use `:animated="false"` for immediate visual updates while retaining key and scroll anchoring. Reduced motion also settles immediately. Recycling clears the previous item's motion before the row is rebound; hiding/unmounting the list releases its controller and any exit copies. State that must survive remains in your keyed data or store.

In a shared screen for the experimental Mac target, the list builds the same rows as the Web, the viewport plus `overscan`, in a SwiftUI scroll view, and a list reference offers `scrollToIndex`. Mac does not yet generate this keyed data-change motion; explicitly passing `animated` (true or false) produces a compiler diagnostic instead of silently dropping it. Omitting the prop retains the existing Mac list. See [Long lists, collapsing headers and refreshing](../guide/macos-experimental#long-lists-collapsing-headers-and-refreshing) in the Mac guide.

<<< @/../examples/catalog/shared/demos/VirtualListDemo.vue
