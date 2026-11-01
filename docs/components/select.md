---
title: Select
description: A compact controlled choice field with a native Sheet and a keyboard-operated Web listbox.
---

# Select

`MSelect` · A compact field that opens a local list of choices.

::: info Next alpha
Select is available in the repository. It is not included in `0.1.0-alpha.3`.
:::

<ComponentPreview component="select" :height="920" />

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { ChoiceOption, ChoiceValue } from '@getcortexlabs/mavis-core'

const interest = ref<ChoiceValue | null>(null)
const options: ChoiceOption[] = [
  { value: 'design', label: 'Design', helperText: 'Ideas taking shape.' },
  { value: 'photo', label: 'Photography' },
  { value: 'film', label: 'Film', disabled: true },
]
</script>

<template>
  <MScreen scroll>
    <MColumn padding="lg" gap="md">
      <MSelect v-model="interest" :options="options" label="Your world"
        placeholder="Choose an interest" />
      <MButton variant="ghost" @click="interest = null">Clear selection</MButton>
    </MColumn>
  </MScreen>
</template>
```

## API

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `modelValue / v-model` | `ChoiceValue \| null` | `null` | Controlled value. Null means no choice. |
| `options` | `readonly ChoiceOption[]` | required | The [Radio choice contract](./radio#shared-choice-contract): stable string/finite-number values, labels and optional helperText/disabled. |
| `label` | string | required | Visible field label and list title. |
| `placeholder` | string | `Select an option` | Field text when no option matches the value. |
| `helperText` | string | `''` | Explanation below the field. |
| `error` | string | `''` | Replaces helper text and gives the field an error border. |
| `disabled` | boolean | `false` | Blocks opening; closes an open list without changing the value. |
| `closeLabel` | string | `Close` | Accessible name of the list's close button. |
| `emptyText` | string | `No options available` | Message inside an empty list. |
| `width / grow / shrink` | dimension / number | `auto` / `0` / layout context | Field size and space distribution. |

`id` identifies the opener. `accessibilityHidden` follows the [shared contract](../guide/component-contract). Translate placeholder, closeLabel and emptyText along with labels and help.

`update:modelValue` emits one string or number when an enabled option different from the current value is activated. Selection closes the list immediately; there is no Apply step. Choosing the current option only closes it. Opening, cancelling, closing and external writes never emit. The parent can reject a proposal: the field continues to show the parent's value when the list closes.

Clear externally by writing `null`; Select does not emit null or add a synthetic empty option. An empty string and zero remain valid option values. Required-field validation, persistence and submission belong to the app. `error` displays a message; it does not validate the value.

## Changes while open

Options and their labels, help and disabled states update live. Reordering preserves identity. Removing the selected option displays the placeholder without changing the model; adding the value back restores its label. A selected disabled option keeps its label and selection mark. Removed or disabled options cannot be chosen by an earlier event. No implicit fallback is written to the model.

The Web keyboard cursor stays on an enabled option, or moves to the selected enabled option/first enabled option when its target disappears. An external model update moves that cursor to the new selection. An empty list shows emptyText; a list with only disabled options remains cancellable.

## Platform presentation

**NativeScript:** declare Select inside `MScreen`, which owns the Sheet layer. It uses the existing Jolt Sheet, scrollable choices with wrapping labels/help and native button/radio states. The close action stays in the header. Opening ends text editing before presenting the list, so dismissing it does not reopen the previous editor’s keyboard. The owning page remains mounted. With vue-router-ns, supply `claimSystemBack` to `createMavis`, as described in [Sheet](./sheet); Android back dismisses the list before navigating. Navigation/unload closes the list; unmount removes the layer and press listeners. Native keyboard movement follows the platform's focus navigation.

**Web:** a button opens a modal dialog containing a single-select listbox. Tab reaches the field; Enter, Space or Arrow Up/Down opens it. Focus starts at the selected enabled option, otherwise the first enabled one. Up/Down wrap and skip disabled options; Home/End reach the first/last; typing letters moves to a matching label. These movements do not change the value. Enter/Space or a click confirms. Escape, the close button and the backdrop cancel. Tab stays in the dialog while open; closing returns focus to the opener. Selection and keyboard cursor have separate visual indicators.

Both themes use the same tokens as Input. Long field labels wrap, and the chevron keeps its place. Native motion comes from Jolt; Web feedback uses CSS and respects reduced motion. This component does not depend on Jolt Web.

The first scope is a local, unvirtualized list. Validation covers empty, four-option and 50-option lists; 50 is a tested size, not a guaranteed performance limit. Search, remote loading, multiple selection and custom option templates are deferred. Prefer [Radio](./radio) for a short list that should remain visible.

## Full example

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/SelectDemo.vue

</details>

[Profile](../showcase/profile) combines Select, Input and Switch. Save and Discard include the selected interest along with the text and boolean fields.
