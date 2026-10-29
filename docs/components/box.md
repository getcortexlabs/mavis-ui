---
title: Box
description: "Box in Mavis UI. Layer content in a single area."
---

# Box

`m-box` · Layer content in a single area.

<ComponentPreview component="box" :height="240" />

## Usage

```vue
<m-box :height="160" radius="lg" backgroundColor="#202C25">
  <m-column padding="lg"><m-text>Background layer</m-text></m-column>
  <m-column justify="end" align="end" padding="md">
    <m-button size="sm">Open</m-button>
  </m-column>
</m-box>
```

## API

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `radius` | token / number | `none` | Area corners. |
| `backgroundColor` | string | `—` | Optional background color. |
| `width / height` | number / string | `auto` | Area dimensions. |

All children share the same area; the last child is drawn on top. Use Row and Column inside each layer to position content. Box does not expose a table grid with rows and columns.

### Composition props

`padding`, `paddingX`, `paddingY`, `radius`, `grow`, `shrink`, `width`, `height` and `backgroundColor` are also accepted. `paddingX` and `paddingY` override their respective sides. Row, Column and Box start without padding; Card starts at `lg`. `grow` defaults to 0; `shrink` follows the parent context.

## Full example

This file also runs in the NativeScript catalog and the Web preview.

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/BoxDemo.vue

</details>

## In context

[See the components in a complete vehicle controls screen](../showcase/vehicle).
