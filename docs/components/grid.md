---
title: Grid
description: Equal-width columns with token spacing.
---

# Grid

**Included in alpha.10.** `MGrid` lays out equal-width columns on Vue Web and NativeScript. It keeps keyed children mounted when columns change.

<ComponentPreview component="grid" :height="370" />

```vue
<m-grid :columns="3" :min-column-width="180" gap="md">
  <m-card v-for="item in items" :key="item.id">{{ item.title }}</m-card>
</m-grid>
```

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `columns` | positive integer | — | Fixed column count; maximum when minColumnWidth is set. |
| `minColumnWidth` | positive number | — | Desired minimum cell width in CSS pixels on Web or DIPs on NativeScript. |
| `gap` | spacing token / number | `none` | Equal horizontal and vertical spacing. |

Without either sizing prop, the grid has one column. With minColumnWidth, the count follows the content width after padding and gaps, with at least one column. A container narrower than the requested minimum uses one cell that fits the available width. `columns` caps the adaptive count. Common Box props such as width, padding and backgroundColor also apply.

SSR and the first hydration render use columns, or one column when omitted. Width measurement updates the layout afterward without replacing keyed editors. Web uses CSS Grid; NativeScript uses a GridLayout with equal star columns and auto-height rows. Keep stable keys on collection children. This is a mounted grid, without virtualization, cell spanning or masonry placement.

<<< @/../examples/catalog/shared/demos/GridDemo.vue
