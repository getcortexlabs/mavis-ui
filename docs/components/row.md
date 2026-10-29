---
title: Row
description: "Row in Mavis UI. Arrange elements side by side with spacing and alignment."
---

# Row

`m-row` · Arrange elements side by side with spacing and alignment.

<ComponentPreview component="row" :height="220" />

## Usage

```vue
<m-row gap="sm" align="center">
  <m-button :grow="1">Continue</m-button>
  <m-button variant="ghost">Cancel</m-button>
</m-row>
```

## API

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `gap` | token / number | `none` | Space between children. |
| `align` | start / center / end / stretch | `center` | Cross-axis alignment. |
| `justify` | start / center / end / between / around | `start` | Horizontal distribution. |
| `wrap` | boolean | `false` | Allows multiple lines. |

`grow` belongs to the child that should fill available space. Mavis children in a Row can shrink in width to fit; use `shrink` to adjust that behavior. Enable `wrap` when items should move onto another line.

### Composition props

`padding`, `paddingX`, `paddingY`, `radius`, `grow`, `shrink`, `width`, `height` and `backgroundColor` are also accepted. `paddingX` and `paddingY` override their respective sides. Row, Column and Box start without padding; Card starts at `lg`. `grow` defaults to 0; `shrink` follows the parent context.

## Full example

This file also runs in the NativeScript catalog and the Web preview.

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/RowDemo.vue

</details>

## In context

[See the components in a complete vehicle controls screen](../showcase/vehicle).

See [Layout and text](../guide/layout) for flexible sizing, large text and RTL direction.
