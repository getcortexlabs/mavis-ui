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
| `type` | text \| email \| password \| tel \| url \| search | `text` | Editing purpose and keyboard hint. Web email/URL fields also participate in browser constraint validation. |
| `name / autocomplete / form` | string | unset | Web only: submitted field name, autofill hint and owning form ID. |
| `required` | boolean | `false` | Web only: participates in the browser's required-field validation. |
| `inputmode` | none \| text \| decimal \| numeric \| tel \| search \| email \| url | unset | Web only: virtual keyboard hint, without changing the value's type. |
| `disabled` | boolean | `false` | Prevents editing, focus and interaction. |
| `readonly` | boolean | `false` | Prevents editing while retaining the displayed value. |
| `multiline` | boolean | `false` | Allows newlines; requires `type="text"`. |
| `rows` | number | `3` | Positive integer; approximate minimum height for multiline fields. |
| `maxLength` | number | unlimited | Integer from 0 to 2147483647; limits user edits in UTF-16 code units. |
| `autocapitalize` | none \| sentences \| words \| characters | `sentences` for text/search; `none` otherwise | Keyboard capitalization hint. |
| `autocorrect` | boolean | `true` for text/search; `false` otherwise | Correction and Web spelling hint. |
| `returnKey` | done \| next \| go \| search \| send | `done` | Keyboard action hint for a single-line editor. |
| `icon / trailingIcon` | `IconName` | `—` | Decorative Lucide icons inside the editor box, muted or `danger` while `error` is set; the editor padding makes room for them. |
| `trailingAction` | `InputAction` (`{ icon, label, disabled? }`) | unset | Named icon button inside the field; emits `action`. Cannot be combined with `trailingIcon`. |
| `width / grow / shrink` | dimension / number | auto / 0 / context | Size the whole field, including label and message. |
| `id` | string | generated on Web | Identifies the editor. |
| `accessibilityHidden` | boolean | unset | Hides the whole field; do not hide usable controls. |

`class`, `style` and other undeclared attributes apply to the outer container. On the Web, `aria-*` attributes and editing listeners (`input`, `beforeinput`, `change`, `invalid`, keyboard and composition events) go to the editor. Caller listeners run before Mavis's listeners; `@keydown.prevent` can cancel its Enter action. `@focus` and `@blur` remain component events without a DOM payload. Use `v-model` for the value and the declared props for editor configuration.

Additional `aria-describedby` IDs are combined with the helper/error ID and deduplicated. An `error` always sets `aria-invalid="true"`; otherwise the supplied ARIA value is preserved. The visible label and generated editor ID stay connected. No default slot is consumed. Invalid numeric limits and `multiline` combined with a non-text type throw `RangeError` in both renderers.

## Events and focus

| Event | Payload | When |
| --- | --- | --- |
| `update:modelValue` | string | User edits, including intermediate IME composition text. |
| `focus / blur` | none | Editing focus changes. |
| `action` | none | The enabled trailing action is activated. |
| `submit` | string | A single-line keyboard action, outside active composition. |

A component ref exposes `focus()` and `blur()`. Use the portable `InputHandle`, `ref<InstanceType<typeof MInput>>()` with a renderer import, or Vue's inferred `useTemplateRef('field')` for a matching template ref. All three expose the same two methods on NativeScript and Web, without editor access or casts. `submit` leaves focus in place: the consumer decides whether to focus another field, blur or save. In multiline mode Enter inserts a newline and never submits. Keyboard labels are hints; the keyboard and OS decide their appearance and availability, particularly on phone keypads.

Readonly fields remain focusable/selectable on the Web. Native readonly fields do not open an editing keyboard; selection and copying vary by native editor. Disabled fields cannot be focused through the public method.

## Actions inside the field

`trailingIcon` remains decorative. Use `trailingAction` for a button such as show/hide password or clear text. Its `label` must contain non-whitespace text. The action has a 48-point touch target and the editor reserves its space; consumers do not need to calculate padding. It also works with multiline text, aligning to the top of the editor.

```vue
<script setup lang="ts">
import { ref } from 'vue'
const password = ref('')
const visible = ref(false)
</script>

<template>
  <m-input
    v-model="password"
    label="Password"
    :type="visible ? 'text' : 'password'"
    autocapitalize="none"
    :autocorrect="false"
    :trailingAction="{ icon: visible ? 'eye-off' : 'eye', label: visible ? 'Hide password' : 'Show password' }"
    @action="visible = !visible"
  />
</template>
```

The application owns the action and resulting value/type. Disabled or readonly fields disable their action; `trailingAction.disabled` can disable it independently. Tapping an action while editing preserves that editor's focus and selection, including with Screen's keyboard dismissal enabled. A password/text type change preserves the caret. An action on an unfocused field does not focus it; Web keyboard users can Tab to the button and activate it without focus moving back to the editor. The button never submits its HTML form. Keep capitalization and correction explicitly off when revealing passwords so switching to text does not enable ordinary text suggestions.

## HTML forms (Web)

With an owning HTML form and no Input `@submit` listener, Enter follows the browser's implicit submission rules, including validation and the default submit button. An Input `@submit` listener owns that keyboard action and suppresses HTML submission, preserving existing next-field/save handlers. This also applies to `@submit.once` after its first call. Use the form's `@submit.prevent` as the single save handler when adopting HTML forms; remove the Input save handler to avoid mixing the two flows. IME confirmation and multiline Enter do not trigger the component event.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MButton, MInput } from '@getcortexlabs/mavis-web'

const email = ref('')
const submittedEmail = ref('')
</script>

<template>
  <form @submit.prevent="submittedEmail = email" @reset.prevent="email = ''">
    <MInput v-model="email" label="Email" name="email" type="email" autocomplete="email" required />
    <MButton type="submit">Save locally</MButton>
    <MButton type="reset">Clear</MButton>
  </form>
  <p>{{ submittedEmail }}</p>
</template>
```

`name` includes the editor in `FormData`; `form` can associate it with a form outside its ancestor tree. Both input and textarea receive the declared HTML attributes. Replace DOM directives that used to set these attributes with props on `MInput`. Autofill hints reach the correct element; individual password managers still decide how to use them.

Models own reset values. Handle `@reset.prevent` on the form and assign the desired models, as above. An unhandled HTML reset keeps each Mavis Input's current model value and emits no model update; it does not restore its initial prop. `error` is presentation, not `setCustomValidity()`: application validation still belongs in the submit handler. NativeScript ignores these HTML-only props and retains its existing keyboard `submit` event.

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
