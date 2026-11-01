---
title: Radio
description: One controlled choice among visible options, with a shared option contract for NativeScript-Vue and Vue Web.
---

# Radio

`MRadioGroup` · Choose one option from a visible list.

::: info Next alpha
Radio is available in the repository. It is not included in `0.1.0-alpha.3`.
:::

<ComponentPreview component="radio" :height="860" />

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { ChoiceOption, ChoiceValue } from '@getcortexlabs/mavis-core'

const rhythm = ref<ChoiceValue | null>(null)
const options: ChoiceOption[] = [
  { value: 'weekly', label: 'Take it slow', helperText: 'A weekly digest.' },
  { value: 'daily', label: 'A little every day' },
  { value: 'live', label: 'As it happens', disabled: true },
]
</script>

<template>
  <MRadioGroup v-model="rhythm" :options="options" label="Reading rhythm" />
</template>
```

The group renders its options; no separate `MRadio` item or platform layout is required. Use plain text labels and keep links or other controls outside the group options.

## API

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `modelValue / v-model` | `ChoiceValue \| null` | `null` | Controlled selection; null means no choice. |
| `options` | `readonly ChoiceOption[]` | required | Ordered list of uniquely identified options. |
| `label` | string | required | Visible group label. |
| `helperText` | string | `''` | Optional explanation below the group label. |
| `disabled` | boolean | `false` | Disables every option without changing the value. |
| `width / grow / shrink` | dimension / number | `auto` / `0` / layout context | Group size and space distribution. |

`id` identifies the group. `accessibilityHidden` follows the [shared contract](../guide/component-contract).

`update:modelValue` emits one string or number when the user requests a different enabled option. Repeated activation of the selected option emits nothing. External changes never emit; the control does not emit null or clear itself.

## Shared choice contract

`ChoiceValue` is a string or finite number. `ChoiceOption` has `value`, a non-empty `label`, optional `helperText` and optional `disabled`. Labels can change with the language without changing values. The number `1` and string `'1'` are different choices; `0` and `''` are valid values. Duplicate values, empty labels and invalid values throw. The same core types are used by [Select](./select).

| Change | Result |
| --- | --- |
| Initial null or empty list | Nothing is selected. No implicit first choice. |
| Parent accepts an activation | The requested option becomes selected. |
| Parent rejects an activation | The previous selection remains, including the browser input state. |
| Selected option is disabled | It stays selected and cannot be activated. Other enabled options remain available. |
| Selected option is removed, or the value is absent | No option is marked; the model is left untouched. Reintroducing that value restores its mark. |
| Labels or order change | Selection follows the value. |
| Parent writes null | The selection clears without an event. |

The app owns required-field validation, persistence and submission. The group does not mutate the options array or choose a fallback.

## Interaction and appearance

The indicator, label and help share one touch target. Labels wrap and the circle keeps its size. Mavis and Midnight colors follow the active theme.

Web uses native radio inputs inside a labelled radiogroup. Tab enters at the selected enabled option, or the first enabled option when needed. Arrow keys wrap through enabled choices and select them; Home/End go to the first/last enabled choice. Space selects the focused option. Tab leaves the group in one step. If every option is disabled, the group has no tab stop. CSS press feedback respects reduced motion.

NativeScript draws the themed circle above a native button input surface. Android exposes RadioButton and checked state, with a visible keyboard-focus outline. iOS exposes button/selected traits. Jolt handles press feedback; it is stopped and the mark restored on disable, unload and unmount. Native keyboard movement follows platform focus navigation; the Web arrow-key group behavior is implemented in the Web renderer. Dragging to scroll must not select an option.

## Full example

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/RadioDemo.vue

</details>

[Focus session](../showcase/focus) uses Radio for the ambience preference alongside a Slider, loading action and session summary. Use [Checkbox](./checkbox) for independent selections and [Switch](./switch) for a boolean setting.
