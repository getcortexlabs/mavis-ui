---
title: Switch
description: A themed on/off preference with a visible label, supporting text and a controlled boolean value on NativeScript-Vue and Web.
---

# Switch

`MSwitch` · A preference that takes effect when you turn it on or off.

::: info Next alpha
Switch is available in the repository. It is not included in `0.1.0-alpha.3`.
:::

<ComponentPreview component="switch" :height="650" />

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
const notifications = ref(true)
</script>

<template>
  <MSwitch
    v-model="notifications"
    label="Notifications"
    helperText="Updates from the people you follow."
  />
</template>
```

## API

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `modelValue / v-model` | boolean | `false` | Controlled on/off value. |
| `label` | string | required | Visible label and accessible name. |
| `helperText` | string | `''` | Optional explanation below the label. |
| `disabled` | boolean | `false` | Prevents activation from the label and control. |
| `width` | number, percentage or `auto` | `auto` | Width of the complete row. |
| `grow / shrink` | number | `0` / layout context | Space distribution in the parent layout. |

`id` identifies the control. `accessibilityHidden` follows the [shared component contract](../guide/component-contract).

`update:modelValue` emits one boolean per user activation. External changes do not emit. Accept the requested value in your event handler, or use `v-model`; if the parent keeps its old value, the control returns to it. There is no extra `change` event, internal persistence or optimistic network state.

## Interaction and appearance

Activate the visible label or the control. The label and helper text wrap as available width or text size changes. Keep them as plain text; links and other controls belong outside the Switch. On the Web, Tab focuses the row and Space or Enter changes the value. Disabled switches cannot be activated or reached with Tab.

NativeScript uses the platform switch for its checked state, keyboard support, thumb gestures and system animation, with Mavis theme colors. The label has Jolt press feedback, released when disabled, unloaded or unmounted. Web uses a themed track/thumb with CSS motion and a visible keyboard focus ring. Reduced-motion settings apply to Mavis feedback; native switch transitions follow the operating system. The controls share behavior and theme tokens, not identical platform geometry. Vertical drags do not toggle a preference. The native thumb retains the system's horizontal drag behavior; on iOS, start scrolling from the label or surrounding space, as the thumb can retain the gesture.

Use a Switch for a boolean setting. Checkbox will cover independent selections and indeterminate states in [the next batch](../guide/roadmap).

## Full example

The same file runs in the NativeScript catalog and Web preview.

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/SwitchDemo.vue

</details>

## In context

[Profile](../showcase/profile) combines text fields and notification preferences. Save and Discard belong to that screen; leaving it resets the local demonstration.
