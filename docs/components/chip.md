---
title: Chip
description: Controlled topic filters and removable tags with independent actions on NativeScript and Web.
---

# Chip

`MChip` gives a short label a place in a collection: static, selectable, removable, or both selectable and removable.

::: info Next alpha
Available in the repository for the next alpha; not included in `0.1.0-alpha.3`.
:::

<ComponentPreview component="chip" :height="850" />

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
const design = ref(true)
const tags = ref(['Vue', 'NativeScript'])
</script>

<template>
  <m-chip v-model="design" selectable label="Design" icon="palette" />
  <m-row gap="sm" wrap>
    <m-chip v-for="tag in tags" :key="tag" :label="tag" removable
      :removeLabel="`Remove ${tag}`" @remove="tags = tags.filter(value => value !== tag)" />
  </m-row>
</template>
```

## Props

| Prop | Type | Default | Behavior |
| --- | --- | --- | --- |
| `label` | string | required | Nonempty visible text and selection action name. |
| `icon` | IconName | — | Decorative icon; a check replaces it when selected. |
| `selectable` | boolean | false | Makes the label a toggle button. |
| `modelValue` | boolean | false | Controlled selection; only used when selectable. |
| `removable` | boolean | false | Adds a separate removal button. |
| `removeLabel` | string | — | Required and nonempty when removable, such as `Remove Vue`. |
| `tone` | primary / accent | primary | Selection and focus color. |
| `disabled` | boolean | false | Blocks both actions, preserving supplied selection. |
| `width / grow / shrink` | dimension / number / number | auto / 0 / context | Layout participation. |
| `id / accessibilityHidden` | string / boolean | — / false | Identifier and accessibility exclusion. |

Missing/blank labels throw `TypeError`, including a missing removal label when `removable` is true.

## State and actions

`update:modelValue` requests the opposite boolean. The parent must accept the request to change the selection. `remove` has no payload: it neither toggles selection nor removes the component. Both actions are sibling targets, with separate names, and disabled chips emit neither event. Static labels have no interactive focus stop.

Use a wrapping Row for groups. Text can wrap within a constrained width; no fixed content height is imposed. A Chip does not manage a collection, enforce exclusive selection, navigate or expose a focus handle. The app owns focus recovery when deleting a focused chip; use an appropriate remaining control. Prefer Badge for short status text and SegmentedControl for a single choice in one group.

## Keyboard and motion

Web selection uses a button with `aria-pressed`; removal is a second button. Tab visits each enabled action, Enter/Space activates it, and keyboard focus is visible. Native composes Row, Text and Icon with a button role and selected/disabled semantics, with disabled taking precedence in NativeScript's single accessibility state. Platform settings determine spoken feedback.

Press feedback uses Jolt on native and CSS on Web; both respect reduced motion. The component releases native press feedback on unload and reinstalls it on load. It does not animate collection removal.

[Library](../showcase/library) uses chips to filter topics and EmptyState to recover from an empty search.

## Full example

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/ChipDemo.vue

</details>
