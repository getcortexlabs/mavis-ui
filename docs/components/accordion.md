---
title: Accordion
description: Controlled expandable sections with shared items, body slots and motion on NativeScript and Web.
---

# Accordion

`MAccordion` groups related sections under individual headers. The app owns which sections are open and supplies each body through a scoped slot.

::: info Next alpha
Available in the repository for the next alpha; not included in `0.1.0-alpha.3`.
:::

<ComponentPreview component="accordion" :height="1000" />

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { ChoiceValue } from '@getcortexlabs/mavis-core'
const expanded = ref<ChoiceValue[]>([])
const items = [{ value: 'delivery', title: 'When will it arrive?', icon: 'package' }] as const
</script>

<template>
  <m-accordion v-model="expanded" :items="items" label="Delivery questions">
    <template #default="{ item }">
      <m-text v-if="item.value === 'delivery'">Check the date in your order.</m-text>
    </template>
  </m-accordion>
</template>
```

## Props

| Prop | Type | Default | Behavior |
| --- | --- | --- | --- |
| `items` | `readonly AccordionItem[]` | required | Unique `value`, nonempty `title`, optional `description`, `icon` and `disabled`. |
| `modelValue` | `readonly ChoiceValue[]` | `[]` | Expanded values; always an array. |
| `multiple` | `boolean` | `false` | Allows more than one open section. |
| `label` | `string` | required | Nonempty accessible group name. |
| `expandedLabel / collapsedLabel` | `string` | `Expanded / Collapsed` | Nonempty native state descriptions; translate in the app. |
| `disabled` | `boolean` | `false` | Disables all headers. Body controls remain app-owned. |
| `width / grow / shrink` | dimension / number / number | `auto / 0 / context` | Layout participation. |
| `id / accessibilityHidden` | string / boolean | — / false | Identifier and accessibility exclusion. |

Values are strings or finite numbers; `0` and `'0'` are distinct. Duplicate item or expanded values throw `RangeError`. Invalid values or missing labels throw `TypeError`. More than one expanded value in single mode throws `RangeError`; trim the array before switching off `multiple`. Unknown values remain in the model but render no matching body. Removing an item never silently rewrites the app's state.

## State and composition

`update:modelValue` requests a new array without mutating the original. Closing the only open section produces `[]`. Disabled headers emit nothing, including when their body is already open. The app may accept or reject every request.

The default slot receives `{ item }`. A body mounts when opened and unmounts after the Reveal exit. Keep form values or data that must survive closing in the parent. Body controls are separate actions; headers cannot contain custom buttons. Titles and descriptions wrap naturally.

Reveal animates opacity/translation, not height. Native uses Jolt; Web uses CSS. Reduced motion is respected. Avoid putting a vertical scroll container inside an already scrolling Screen.

## Keyboard and focus

Web headers are buttons inside headings, with `aria-expanded` and a labelled body region when open. Enter/Space toggles a section. Up/Down, Home and End move between enabled headers without expanding them. Closing or removing a body containing focus returns focus to an available header; disabling the whole group leaves the browser's normal focus behavior.

Native headers expose their title, description, group hint and translated expanded/collapsed value through the existing ListItem interaction. Actual VoiceOver/TalkBack speech follows platform settings. Native keyboard navigation uses the platform's focus system. Hardware keyboard and physical-device audits remain separate from simulator checks.

[Help center](../showcase/help) keeps expanded values per topic and feedback in the parent.

## Full example

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/AccordionDemo.vue

</details>
