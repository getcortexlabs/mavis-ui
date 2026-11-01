---
title: SegmentedControl
description: Equal-width choices with controlled selection and an animated marker on NativeScript and Web.
---

# Segmented Control

`MSegmentedControl` selects one value from a compact set, such as a period, category or display mode. The app decides what changes when that value is selected.

::: info Next alpha
Available in the repository for the next alpha; not included in `0.1.0-alpha.3`.
:::

<ComponentPreview component="segmented-control" :height="1000" />

## Usage

```vue
<m-segmented-control v-model="period" label="Focus period" :options="[
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' }
]" />
```

Declare `period` as `ref<ChoiceValue | null>('week')` in your component. Import the type from `@getcortexlabs/mavis-core`.

## Props

| Prop | Type | Default | Behavior |
| --- | --- | --- | --- |
| `options` | `readonly SegmentedOption[]` | required | Unique `value`, nonempty `label`, optional `disabled`. |
| `modelValue` | `ChoiceValue \| null` | `null` | Selected string or finite number. |
| `label` | `string` | required | Nonempty accessible group name; no automatic visible label. |
| `disabled` | `boolean` | `false` | Disables the group. |
| `width / grow / shrink` | dimension / number / number | `auto / 0 / context` | Layout participation. |
| `id / accessibilityHidden` | string / boolean | — / false | Identifier and accessibility exclusion. |

`update:modelValue` requests an enabled value different from the current one. Selection stays controlled even if the app rejects the request. `null`, empty options or a missing value show no selection; the component does not choose a fallback or clear state automatically. Numeric and string values remain distinct. Duplicate values throw `RangeError`; invalid values and empty labels throw `TypeError`.

## Layout and motion

Prefer two to four short labels. Segments share the available width equally, and text wraps without a fixed height. Large lists belong in [Select](./select) or [Radio](./radio). This control has no panels, scrolling, icons-only options, multiselection or router integration. Use [Tabs](./tabs) for local content panels.

The marker follows the selected segment with Jolt on native and CSS on Web. Native measurement changes snap to the new geometry; pending animation is stopped on background/unload. Both renderers respect reduced motion. Only the private marker is animated, preserving application transforms on the control.

## Interaction

Web uses a radio group with one Tab stop. Arrow keys, Home and End focus and request selection while skipping disabled options. Horizontal keys follow text direction. Enter/Space activates a focused segment. Disabling a selected option keeps it selected until the app chooses another value.

Native options expose radio-button semantics, the group name as a hint and their checked/disabled states. Android supports Left/Right and Home/End; other native keyboard movement follows the platform. UIKit/Android font scaling can increase the control height. Platform typography and layout may differ in pixels.

On iOS with Core 9.1.3, disabled choices block taps but the native accessibility tree can omit the unavailable trait. Selection remains exposed; the trait follow-up is [#112](https://github.com/getcortexlabs/mavis-ui/issues/112).

[Help center](../showcase/help) uses the value to choose a question category, preserving expanded sections per category.

## Full example

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/SegmentedDemo.vue

</details>
