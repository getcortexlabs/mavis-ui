---
title: Box
description: 'Box in Mavis UI. Layer content in a single area.'
---

# Box

Alpha.8 adds the experimental `motionSurface` prop for visual effects and retained collection targets. It can coexist with `motionRegion`; both retain their own lifetime. See [visual motion](../guide/visual-motion) for the Jolt RC.11 requirement; this is included in alpha.8.

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

| Prop              | Type              | Default | Purpose                                                                                                                    |
| ----------------- | ----------------- | ------- | -------------------------------------------------------------------------------------------------------------------------- |
| `radius`          | token / number    | `none`  | Area corners.                                                                                                              |
| `backgroundColor` | string            | `—`     | Optional background color.                                                                                                 |
| `perspective`     | number            | `—`     | Projection distance for the `rotateX`/`rotateY` of direct children. See [paths, depth and shadows](../guide/motion-depth). |
| `width / height`  | number / auto / % | `auto`  | Area dimensions.                                                                                                           |

All children share the same area; the last child is drawn on top. Use Row and Column inside each layer to position content. Box does not expose a table grid with rows and columns.

Without `height`, Box takes the height of its tallest layer, so a background layer can sit behind content-sized controls. With an explicit `height`, or when a Row stretches it, every layer fills the Box. A raw NativeScript `GridLayout` without `rows` fills the available height instead; give it `rows="auto"` or use Box.

In a shared screen for the experimental Mac target, Box is a SwiftUI layout with the same rule: each layer fills the area and the last is on top. There a layer with its own `width` or `height` fails generation, because the Web places it at the top left and NativeScript in the middle; `motionSurface`, `motionRegion` and `perspective` are not available on the Mac yet. See [Layers, runs and separators](../guide/macos-experimental#layers-runs-and-separators) in the Mac guide.

### Composition props

`padding`, `paddingX`, `paddingY`, `radius`, `grow`, `shrink`, `width`, `height` and `backgroundColor` are also accepted. `paddingX` and `paddingY` override their respective sides. Row, Column and Box start without padding; Card starts at `lg`. `grow` defaults to 0; `shrink` follows the parent context. A prop that is not given leaves its style untouched, so a plain attribute such as `paddingTop` or `borderRadius`, or CSS on the Web, keeps applying across renders; once a prop is given it owns that style.

## Full example

This file also runs in the NativeScript catalog and the Web preview.

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/BoxDemo.vue

</details>

## In context

[See the components in a complete vehicle controls screen](../showcase/vehicle).
