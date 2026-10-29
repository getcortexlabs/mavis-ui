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
| `grow / shrink` | number | `0 / context` | Space distribution within the parent layout. |

`click` has no payload and is not emitted while `disabled` or `loading` is active. The slot accepts plain or interpolated text. Pass `accessibilityLabel` when the accessible name differs from the visible text. NativeScript uses Jolt for press feedback; Web renders a keyboard-accessible `button` with visible focus.

## Full example

This file also runs in the NativeScript catalog and the Web preview.

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/ButtonDemo.vue

</details>

## In context

[See the components in a complete vehicle controls screen](../showcase/vehicle).
