---
title: Checkbox
description: Independent choices with checked, unchecked and indeterminate states, shared by NativeScript-Vue and Vue Web.
---

# Checkbox

`MCheckbox` · Select independent items, filters or options.

::: info Next alpha
Checkbox is available in the repository. It is not included in `0.1.0-alpha.3`.
:::

<ComponentPreview component="checkbox" :height="760" />

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
const selected = ref(false)
const mixed = ref(true)
</script>

<template>
  <MCheckbox
    v-model="selected"
    v-model:indeterminate="mixed"
    label="All topics"
    helperText="Choose what appears in your collection."
  />
</template>
```

## API

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `modelValue / v-model` | boolean | `false` | Controlled checked value. |
| `indeterminate` | boolean | `false` | Controlled partial-selection display; takes precedence over checked. |
| `label` | string | required | Visible label and accessible name. |
| `helperText` | string | `''` | Optional supporting text. |
| `indeterminateLabel` | string | `Partially selected` | Accessible description of the mixed state. Translate with the label. |
| `disabled` | boolean | `false` | Prevents activation from the whole row and keyboard. |
| `width` | number, percentage or `auto` | `auto` | Width of the full row. |
| `grow / shrink` | number | `0` / layout context | Space distribution in the parent. |

`id` identifies the control. `accessibilityHidden` follows the [shared component contract](../guide/component-contract).

Each activation emits one `update:modelValue` boolean. With `indeterminate=true`, it first emits `update:indeterminate(false)`, then `update:modelValue(true)`, even when the previous checked value was already true. Otherwise it toggles the checked value. External updates never emit.

Both values belong to the parent. Use both `v-model` bindings for stored state, or derive the parent checkbox from a selection array and update that array from `update:modelValue`, as the full example does. Ignored changes keep the old appearance; indeterminate is not cleared privately. The component does not manage arrays, validation, submission or a checkbox group.

## Interaction and appearance

The box, label and supporting text activate one control. Keep labels as plain text; links and other controls belong outside the Checkbox. Long labels wrap without shrinking the mark.

Web uses a native checkbox input beneath the themed appearance. Tab focuses it and Space activates it; Enter retains browser form behavior. The input exposes the mixed state and CSS motion respects reduced motion. NativeScript uses a native button as the full-row input surface, with checkbox semantics and a Mavis mark. Android keyboard focus has a theme-colored outline; iOS uses system focus treatment. Jolt animates the mark on press and releases motion on disable, unload and unmount. Scroll gestures must not select an item.

Use [Switch](./switch) for an immediate on/off preference.

## Full example

This file runs in both catalogs and the preview. The app derives select-all and mixed states from its selected topic IDs.

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/CheckboxDemo.vue

</details>

## In context

[Library](../showcase/library) combines independent filters, select-all, result cards and an empty state in a complete screen.
