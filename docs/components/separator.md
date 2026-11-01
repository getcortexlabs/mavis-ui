---
title: Separator
description: Horizontal and vertical divisions with theme spacing on NativeScript and Web.
---

# Separator

`MSeparator` draws a decorative line in the theme's `border` color. It divides content without adding controls or repeated announcements.

::: info Next alpha
Available in the repository for the next alpha; not included in `0.1.0-alpha.3`.
:::

<ComponentPreview component="separator" :height="1050" />

## Usage

```vue
<m-column>
  <m-list-item title="Design" description="Ideas taking shape." />
  <m-separator inset="md" />
  <m-list-item title="Engineering" description="Experiences that work." />
</m-column>

<m-row>
  <m-text>12 projects</m-text>
  <m-separator orientation="vertical" :length="32" spacing="md" />
  <m-text>4 people</m-text>
</m-row>
```

## Props

| Prop | Type | Default | Behavior |
| --- | --- | --- | --- |
| `orientation` | `horizontal \| vertical` | `horizontal` | Line direction. |
| `length` | `number` | automatic | Explicit line length in DIP/px, excluding margins. |
| `spacing` | space token or number | `none` | Margin on each side, perpendicular to the line. |
| `inset` | space token or number | `none` | Inset at each end of the line. |
| `id` | `string` | — | Optional identifier. |

An automatic horizontal separator stretches within a Column's content width. An automatic vertical separator stretches within a Row's height. Use these parents without `wrap` for predictable axes and bounds; outside them, set `length`. Explicit lengths are centered. Negative and non-finite values are rejected.

`spacing="sm"` adds 8 DIP/px on each side in the default theme. `inset="md"` insets each end by 16. Horizontally, spacing affects top/bottom and inset affects left/right; vertically, the axes swap. Parent padding, these margins and any explicit length must fit in the available space.

Thickness is 1 DIP on native and 1 CSS pixel on Web, not a promise of one physical pixel. There is no content, slot, event, focus, animation or resize handle. The line is hidden from assistive output; provide headings and group structure in the app. [Team](../showcase/team) uses both axes with ListItem.

## Full example

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/SeparatorDemo.vue

</details>
