---
title: SortableList
---

# SortableList

::: info In development
New component for the next release. Not included in the published alpha.11 packages.
:::

<ComponentPreview component="sortable-list" :height="850" />

```vue
<MSortableList v-model="tracks" itemKey="id" :itemLabel="(track) => track.title" label="Playlist">
  <template #default="{ item }"><MText :text="item.title" /></template>
</MSortableList>
```

| Prop                                                     | Type                                 | Contract                                            |
| -------------------------------------------------------- | ------------------------------------ | --------------------------------------------------- |
| `modelValue / itemKey`                                   | `readonly T[] / keyof T or function` | Controlled array; unique stable keys, default `id`. |
| `itemLabel`                                              | `(item: T) => string`                | Accessible row name; defaults to its key.           |
| `height / disabled`                                      | `number / boolean`                   | `360 / false`. Bounded scrolling viewport.          |
| `handleLabel / moveUpLabel / moveDownLabel / emptyLabel` | `string`                             | Localizable controls.                               |

Drag the dedicated handle. Jolt owns lifting, neighboring item placement, edge scrolling and cancellation; the app accepts the new order through `v-model`. Move buttons provide the same operation without dragging. `reorder` emits `{ key, beforeKey, fromIndex, toIndex }` after a valid move. Unknown identities and unchanged moves do not commit. The input array is never mutated.

The default slot receives `{ item, index, itemKey }`; stateful children stay keyed while moving. An `empty` slot replaces the empty message. Changing data or disabling cancels the current gesture. All rows are mounted: this is intended for editable playlists, priorities and steps, not a virtualized large dataset or cross-column Kanban.

<<< @/../examples/catalog/shared/demos/SortableListDemo.vue
