---
title: Button
description: "Button in Mavis UI. Actions with variants, sizes and interaction states."
---

# Button

`m-button` · Actions with variants, sizes and interaction states.

<ComponentPreview component="button" :height="420" />

## Usage

```vue
<m-button variant="primary" @click="save">Save</m-button>
```

Values and handlers in this snippet belong to your component. The full example below includes their setup.

## API

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `variant` | primary / secondary / ghost | `primary` | Button appearance. |
| `size` | sm / md / lg | `md` | Minimum height, font and padding. |
| `disabled` | boolean | `false` | Prevents activation. |
| `loading` | boolean | `false` | Prevents activation and shows loadingText. |
| `loadingText` | string | `Loading…` | Text shown while loading. |
| `text` | string | `—` | Alternative to slot text. |
| `type` | button / submit / reset | `button` | Web only: HTML button action. |
| `name / value / form` | string | unset | Web only: submitter name/value and owning form ID. |
| `icon / trailingIcon` | `IconName` | `—` | Lucide icon before or after the text, sized with the button. An icon-only button requires `accessibilityLabel`; otherwise rendering throws `RangeError`. |
| `grow / shrink` | number | `0 / context` | Space distribution within the parent layout. |

Icons render from the bundled Lucide font at 16, 20 or 24 points for `sm`, `md` and `lg`, inherit the label color and never join the accessible name. `click` has no payload and is not emitted while `disabled` or `loading` is active. The slot accepts plain or interpolated text. Pass `accessibilityLabel` when the accessible name differs from the visible text. NativeScript uses Jolt for press feedback; Web renders a keyboard-accessible `button` with visible focus.

## HTML forms (Web)

Use `type="submit"` and handle the form's `@submit.prevent` to receive validated click and Enter submissions. `name` and `value` identify the submitter; `form` can target a form elsewhere in the document. Keep a single save handler on the form instead of also saving in the button's `@click`.

Disabled buttons cannot activate. Loading buttons retain keyboard focus, announce their busy state and cancel both submit and reset defaults. The default `type="button"` never submits a form. With `type="reset"`, handle the form's `@reset.prevent` to reset controlled models; see the [Input form example](./input#html-forms-web). NativeScript keeps its ordinary action behavior and ignores the HTML-only props.

## Full example

This file also runs in the NativeScript catalog and the Web preview.

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/ButtonDemo.vue

</details>

## In context

[See the components in a complete vehicle controls screen](../showcase/vehicle).

See [Layout and text](../guide/layout) for flexible sizing, large text and RTL direction.

[Accessible names, focus and screen-reader checks](../guide/accessibility).
