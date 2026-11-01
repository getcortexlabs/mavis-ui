---
title: Tabs
description: Content tabs with controlled selection, an animated indicator and one API for NativeScript and Web.
---

# Tabs

`MTabs` · One space, different perspectives.

::: info Next alpha
Tabs is available in the repository; it is not included in `0.1.0-alpha.3`.
:::

<ComponentPreview component="tabs" :height="920" />

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { ChoiceValue, TabOption } from '@getcortexlabs/mavis-core'

const active = ref<ChoiceValue | null>('profile')
const tabs: TabOption[] = [
  { value: 'profile', label: 'Profile' },
  { value: 'activity', label: 'Activity' },
  { value: 'upcoming', label: 'Coming soon', disabled: true },
]
</script>

<template>
  <m-tabs v-model="active" :tabs="tabs" label="Your space">
    <template #default="{ value }">
      <m-column v-if="value === 'profile'" gap="md">
        <m-text variant="heading">About you</m-text>
        <m-text>Your profile content.</m-text>
      </m-column>
      <m-text v-else>Recent activity.</m-text>
    </template>
  </m-tabs>
</template>
```

## Props

| Prop | Type | Default | Behavior |
| --- | --- | --- | --- |
| `modelValue` | `string \| number \| null` | `null` | Controlled selection. Use `v-model` and choose the initial value in the app. |
| `tabs` | `readonly TabOption[]` | required | Ordered list of tabs. |
| `label` | `string` | required | Nonempty group name used by assistive technology. |
| `disabled` | `boolean` | `false` | Prevents user activation; the parent can still change selection. |
| `id` | `string` | — | Container identifier. |
| `width` | `number \| % \| auto` | `auto` | Container width, not individual tab width. |
| `grow / shrink` | `number` | `0 / context` | Participation in the parent layout. |
| `accessibilityHidden` | `boolean` | `false` | Hides the group from assistive technology. |

`TabOption`: `{ value: string | number; label: string; disabled?: boolean }`.

Values must be unique and numbers finite. `0` and `'0'` are distinct values; nonempty labels can change with the language. Core exports this type and `TabPanelProps`.

## Selection and panels

`update:modelValue(value)` requests a change to a different enabled tab. Repeated activation, scrolling the strip or focusing another tab does not emit a change. The parent can reject the request. There is no automatic selection: initialize the model in the app.

The `default` slot receives `{ value }` and runs only when that value matches a tab. Only that panel is mounted; switching tabs unmounts its predecessor and releases its components/effects. Keep forms, filters and shared data in the parent, as in [Library](../showcase/library). There is no internal panel cache.

`null`, an empty list or an absent value removes the panel and indicator without changing the model or emitting events. Reinserting the tab restores its panel. Disabling the selected tab retains its current content: `disabled` limits interaction rather than rewriting the app's decision.

## Interaction and motion

The strip uses intrinsic widths and horizontal scrolling. Labels stay on one line; external selection reveals the tab without scrolling the page vertically. Resizing and text-size changes reposition the indicator. Dragging the strip only scrolls; it does not switch panels.

Web uses a `tablist`, `tab` buttons and a `tabpanel` named by its active tab. Tab enters one tab stop; arrows, Home and End move focus between enabled tabs. Enter/Space activate. Left/right follow document RTL direction. The panel is keyboard-focusable too.

Native tabs are labelled buttons with selected state and follow system text size. Android supports arrows/Home/End focus navigation and normal button activation. The initial native strip lays out left to right; audited RTL mirroring and iOS hardware-keyboard navigation are not promised.

The indicator uses Jolt on native and CSS on Web, following reduced motion. Unload/unmount releases animations, listeners, pending measurements and observers; retained native pages measure again on return. This is basic behavior, not a comprehensive screen-reader audit.

Tabs organizes local content. Routes, deep links, bottom navigation bars, vertical orientation, arbitrary header slots and swiping between panels are outside this contract.

## Full example

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/TabsDemo.vue

</details>
