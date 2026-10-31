---
title: Column
description: "Column in Mavis UI. Arrange content vertically while preserving its natural height."
---

# Column

`m-column` · Arrange content vertically while preserving its natural height.

<ComponentPreview component="column" :height="310" />

## Usage

```vue
<m-column gap="md" padding="lg">
  <m-text variant="title">Welcome.</m-text>
  <m-button>Get started</m-button>
</m-column>
```

## API

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `gap` | token / number | `none` | Space between children. |
| `align` | start / center / end / stretch | `stretch` | Horizontal alignment. |
| `justify` | start / center / end / between / around | `start` | Vertical distribution. |
| `wrap` | boolean | `false` | Wraps into columns when height is constrained. |

Mavis children preserve their natural height by default. Column, Row and spacing tokens cover everyday composition without requiring consumers to choose native layout classes.

NativeScript Core views placed directly in a Column follow the same rule: unless they set `flexShrink` themselves, the Column keeps their requested or content height, even when the content exceeds a Screen without scrolling. Set `flexShrink="1"` on a Core view to let it shrink.

### Composition props

`padding`, `paddingX`, `paddingY`, `radius`, `grow`, `shrink`, `width`, `height` and `backgroundColor` are also accepted. `paddingX` and `paddingY` override their respective sides. Row, Column and Box start without padding; Card starts at `lg`. `grow` defaults to 0; `shrink` follows the parent context.

## Full example

This file also runs in the NativeScript catalog and the Web preview.

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/ColumnDemo.vue

</details>

## In context

[See the components in a complete vehicle controls screen](../showcase/vehicle).

See [Layout and text](../guide/layout) for flexible sizing, large text and RTL direction.
