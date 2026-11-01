---
title: Skeleton
description: Composable loading placeholders with shared dimensions, themes and motion on NativeScript and Web.
---

# Skeleton

`MSkeleton` represents the shape of content while the app loads its data. Combine blocks with Row and Column to compose cards, profiles or lists.

::: info Next alpha
Available in the repository for the next alpha; not included in `0.1.0-alpha.3`.
:::

<ComponentPreview component="skeleton" :height="1020" />

## Usage

```vue
<template>
  <m-column v-if="loading" gap="md">
    <m-text>Loading profile…</m-text>
    <m-row gap="md">
      <m-skeleton :width="48" :height="48" radius="full" :shrink="0" />
      <m-column :width="0" :grow="1" gap="sm">
        <m-skeleton width="70%" />
        <m-skeleton width="45%" :height="12" />
      </m-column>
    </m-row>
  </m-column>
  <m-text v-else>{{ profile.name }}</m-text>
</template>
```

`loading` and `profile` belong to the app. The component does not fetch data, run a loading timer or choose between empty, error and success states.

## Props

| Prop | Type | Default | Behavior |
| --- | --- | --- | --- |
| `width` | `number \| % \| auto` | `auto` | Fills the available width in Column. |
| `height` | `number \| % \| auto` | `16` | Block height. |
| `radius` | radius token or number | `sm` | Corner radius; `full` with equal dimensions produces a circle. |
| `animated` | `boolean` | `true` | Enables the pulse when system motion preferences allow it. |
| `grow / shrink` | `number` | `0 / context` | Layout participation, as in Box. |
| `id` | `string` | — | Optional identifier. |

Numbers use DIP on native and px on Web. Percentages require a parent with a defined size on the corresponding axis. `auto` does not measure future content: this block is empty. Set explicit dimensions to reserve space. In Row, use `shrink=0` to preserve a circle's size. Automatic widths stretch within Column; explicit widths use `flex-start` to preserve narrower shapes. In Row, provide a width or use `width=0` with `grow=1` to share the available space.

## State and composition

Skeleton has no slots, events or real content. Blocks are decorative: they cannot receive focus and are not announced individually. Provide one loading message for the region outside the blocks; announcing state changes and handling failures belong to the app. Do not nest a real form inside Skeleton to hide it.

The color uses `theme.colors.border` in Mavis and Midnight. Choose dimensions close to the expected result to reduce layout shifts. There is no automatic measurement, line-count group or sizing based on system text size.

[In Library](../showcase/library), **Atualizar coleção** simulates a 1.5-second wait. Placeholders replace the cards while filters, the active tab and saved readings are preserved. The example makes no network requests.

## Motion and lifecycle

The pulse changes only opacity over a 1.6-second cycle: Jolt on NativeScript and CSS on Web. `animated=false` or reduced motion keeps opacity at 1 with no loop. NativeScript stops motion in the background and releases animations and listeners on unload/unmount; retained pages can restart when loaded again. Web pauses in a hidden tab and removes its listener on unmount.

Use a limited number of placeholders; scrolling out of the viewport does not unmount the component or stop its animation. Large lists need the app's virtualization strategy. There is no shimmer, moving gradient or global scheduler.

## Full example

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/SkeletonDemo.vue

</details>
