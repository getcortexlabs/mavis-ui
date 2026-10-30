---
title: Input
description: Themed Mavis text fields with string models, labels, validation messages, keyboard actions and multiline editing on NativeScript and Vue Web.
---

# Input

`m-input` · A text field with its label, help and validation state. Uses native text editors on iOS/Android and semantic inputs on the Web.

<ComponentPreview component="input" :height="850" />

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { InputHandle } from '@getcortexlabs/mavis-core'

const name = ref('')
const bio = ref('')
const bioInput = ref<InputHandle>()
</script>

<template>
  <m-column gap="lg">
    <m-input v-model="name" label="Name" returnKey="next" @submit="bioInput?.focus()" />
    <m-input ref="bioInput" v-model="bio" label="Bio" multiline :maxLength="160" />
  </m-column>
</template>
```

Register the components through the [alpha installation guide](../guide/foundation). The API remains experimental.

## API

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `modelValue / v-model` | string | `''` | Full text, without trimming or numeric conversion. |
| `label` | string | required | Visible label and editor name. |
| `placeholder` | string | `''` | Hint inside an empty editor. |
| `helperText` | string | `''` | Help below the editor. |
| `error` | string | `''` | Nonempty messages replace help and mark the field invalid. |
| `type` | text \| email \| password \| tel \| url \| search | `text` | Editing purpose and keyboard hint; does not validate content. |
| `disabled` | boolean | `false` | Prevents editing, focus and interaction. |
| `readonly` | boolean | `false` | Prevents editing while retaining the displayed value. |
| `multiline` | boolean | `false` | Allows newlines; requires `type="text"`. |
| `rows` | number | `3` | Positive integer; approximate minimum height for multiline fields. |
| `maxLength` | number | unlimited | Integer from 0 to 2147483647; limits user edits in UTF-16 code units. |
| `autocapitalize` | none \| sentences \| words \| characters | `sentences` for text/search; `none` otherwise | Keyboard capitalization hint. |
| `autocorrect` | boolean | `true` for text/search; `false` otherwise | Correction and Web spelling hint. |
| `returnKey` | done \| next \| go \| search \| send | `done` | Keyboard action hint for a single-line editor. |
| `width / grow / shrink` | dimension / number | auto / 0 / context | Size the whole field, including label and message. |
| `id` | string | generated on Web | Identifies the editor. |
| `accessibilityHidden` | boolean | unset | Hides the whole field; do not hide usable controls. |

`class`, `style` and undeclared attributes apply to the outer container. Use the declared props to configure the editor. No default slot is consumed. Invalid numeric limits and `multiline` combined with a non-text type throw `RangeError` in both renderers.

## Events and focus

| Event | Payload | When |
| --- | --- | --- |
| `update:modelValue` | string | User edits, including intermediate IME composition text. |
| `focus / blur` | none | Editing focus changes. |
| `submit` | string | A single-line keyboard action, outside active composition. |

A component ref exposes `focus()` and `blur()`, typed by `InputHandle` from `@getcortexlabs/mavis-core`. `submit` leaves focus in place: the consumer decides whether to focus another field, blur or save. In multiline mode Enter inserts a newline and never submits. Keyboard labels are hints; the keyboard and OS decide their appearance and availability, particularly on phone keypads.

Readonly fields remain focusable/selectable on the Web. Native readonly fields do not open an editing keyboard; selection and copying vary by native editor. Disabled fields cannot be focused through the public method.

## Editing and layout

The model remains a string, including spaces, incomplete values and leading zeros. Mavis does not supply validation rules or persistence. Pass an `error` from your application when appropriate. Avoid formatting the model on every keystroke: rewriting an active edit can interrupt IME composition or move the caret. Prefer formatting on blur or submit. Vue's `.trim`, `.number` and `.lazy` model modifiers are not part of this component's contract.

`maxLength` constrains user edits without truncating an externally supplied value. It counts UTF-16 code units, so an emoji may use more than one unit. Browser single-line input types can sanitize newlines or whitespace according to HTML rules; cross-platform text normalization belongs to the application.

Multiline fields grow with their content above the approximate `rows` minimum. They are intended for short messages and bios, not a virtualized document editor. Put forms inside a [Screen with `scroll`](./screen) so the focused editor can stay above the keyboard. Android keeps the editor inside the app in landscape instead of requesting a full-screen IME editor; the host still needs `adjustResize`. Floating keyboards and very long fields taller than the viewport require separate device checks.

## Full example

The same source runs in the NativeScript catalog and Web preview, with both themes.

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/InputDemo.vue

</details>

## In context

[Edit a profile with live preview, validation and local save state](../showcase/profile).
