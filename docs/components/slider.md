---
title: Slider
description: "Slider in Mavis UI. Numeric selection with bounds and integer or fractional steps."
---

# Slider

`m-slider` · Numeric selection with bounds and integer or fractional steps.

<ComponentPreview component="slider" :height="330" />

## Usage

```vue
<m-slider v-model="temperature" :min="16" :max="28" :step="0.5" label="Temperature" />
```

Values and handlers in this snippet belong to your component. The full example below includes their setup.

## API

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `modelValue / v-model` | number | `0` | Selected value. |
| `min` | number | `0` | Lower bound. |
| `max` | number | `100` | Upper bound. |
| `step` | number | `1` | Step greater than zero. |
| `label` | string | `required` | Accessible control name. |
| `disabled` | boolean | `false` | Prevents interaction. |

`update:modelValue` emits the numeric value snapped to a step. `min` must be less than `max`; all values must be finite. External values are clamped and snapped for display without automatically rewriting application state. When the range is not divisible by the step, the final step reaches `max`. On the Web, arrow keys, Home and End operate the control.

## Full example

This file also runs in the NativeScript catalog and the Web preview.

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/SliderDemo.vue

</details>

## In context

[See the components in a complete vehicle controls screen](../showcase/vehicle).

[Snapping and controlled value rules](../guide/component-contract#controlled-values).
