---
title: Layout and text
description: Compose Mavis rows, columns and layers with flexible sizing, wrapping, large text and explicit reading direction.
---

# Layout and text

Use Row for horizontal groups, Column for vertical flow and Box for layers. Their children remain native views on NativeScript and HTML elements on Web. The shared props describe layout intent; font metrics and pixel rounding can differ.

## Share the available width

`grow` distributes extra space after measuring the content. Two children with `grow=1` can therefore have different widths. To give equally padded cards the same width, start both at zero:

```vue
<m-row gap="md" align="stretch">
  <m-card :width="0" :grow="1" padding="md">
    <m-text>Quiet</m-text>
    <m-text>Time to concentrate.</m-text>
  </m-card>
  <m-card :width="0" :grow="1" padding="md">
    <m-text>Rain</m-text>
    <m-text>A longer description can wrap naturally.</m-text>
  </m-card>
</m-row>
```

Percentages are initial sizes, not a grid with automatic gutters. In a Row without wrapping, two `width="50%"` children need to shrink to leave room for `gap`. Mavis children default to `shrink=1` in a Row. Setting `shrink=0` preserves their requested width and can cause overflow. Native Flexbox and CSS use different shrink distribution algorithms for unequal items; do not rely on identical proportional reduction.

Use `wrap` when complete items should move to another line. Wrapping is decided before growth; two 50% items plus a gap need two lines. Percent heights and vertical growth need a bounded parent height. In a scrolling Column, prefer natural height.

## Let text determine height

Text wraps by default. Native Button labels also wrap and keep a minimum touch height. On iOS, both follow Dynamic Type; Android follows the system font scale. A user can need substantially more space than the default theme suggests.

Avoid fixed heights around descriptions, translated headings and actions. Use padding and gaps for breathing room, and a scrolling Screen when the content can exceed the viewport. `wrap=false` deliberately keeps text on one line; it does not guarantee that every label will fit.

Box places children in the same cell, drawing later children above earlier ones. Put a Column inside it when content should flow vertically instead of overlap.

## Direction and alignment

The current renderers accept explicit `style.direction` as a platform style. This is not a separate Mavis direction prop and does not select a locale:

```vue
<m-row :style="{ direction: 'rtl' }" gap="sm" justify="start">
  <m-text align="right">إعدادات الجلسة</m-text>
  <m-button>حفظ</m-button>
</m-row>
```

In an RTL Row, the first child is on the right and `justify="start"` starts there. In a Column, `justify` stays vertical; `align="start"` follows the horizontal direction. `center` stays centered. Text's `left` and `right` are physical alignments; choose them explicitly for the content. Visual mirroring alone does not establish a complete accessible reading order.

## Verification

The [shared layout fixture](https://mavis-ui.getcortexlabs.com/playground/#/checks/layout) exercises percentages with gaps, zero-width growth, nested Row/Column/Box, wrapping, fixed siblings, long strings and RTL. The checks compare actual bounds before expansion, with long content and after contraction. Browser coverage includes 320 px, phone, landscape and tablet widths, plus doubled text. Native checks run against installed simulator builds and include large system text.

See [the reproducible checks in the repository](https://github.com/getcortexlabs/mavis-ui/blob/main/test/native-layout.md). See [Screen](../components/screen#safe-areas-and-keyboards) for safe-area and keyboard ownership. These checks do not establish physical-device or screen-reader coverage.
