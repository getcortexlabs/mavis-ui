---
title: Text
description: "Text in Mavis UI. Typography, semantic colors and accessible text."
---

# Text

`m-text` · Typography, semantic colors and accessible text.

<ComponentPreview component="text" :height="410" />

## Usage

```vue
<m-text as="h1" variant="title">The day is yours.</m-text>
<m-text tone="muted">Ready when you are.</m-text>
```

## API

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `variant` | display / title / heading / body / caption / overline | `body` | Theme typography scale. |
| `weight` | normal / bold / 100 … 900 (strings) | theme | Weight independent of size. |
| `tone` | palette key | `text` | Semantic color. |
| `as` | p / span / h1 … h6 | `p` | Semantics independent of appearance. |
| `align` | left / center / right | `left` | Text alignment. |
| `wrap` | boolean | `true` | Allows line wrapping. |
| `text` | string | `—` | Alternative to slot text. |
| `grow / shrink` | number | `0 / context` | Space distribution. |

`variant` controls appearance; `as` controls semantics. `as="h1"` through `h6` produces HTML headings on the Web and the heading accessibility role on NativeScript. The slot accepts text and MSpan; use layouts for other views.

## Full example

This file also runs in the NativeScript catalog and the Web preview.

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/TextDemo.vue

</details>

## In context

[See the components in a complete vehicle controls screen](../showcase/vehicle).

See [Layout and text](../guide/layout) for flexible sizing, large text and RTL direction.

## MSpan

```vue
<m-text as="h1" variant="title">
  Cada xícara <m-span emphasis="em" tone="primary">conta uma história.</m-span>
</m-text>
<m-text variant="caption" weight="bold">Um pequeno destaque.</m-text>
```

`MSpan` describes runs inside MText (or another MSpan). It accepts `text` or a text slot, `weight`, `tone` and `emphasis="strong" | "em"`. Strong adds semantic importance and bold weight; em adds stress emphasis and italics. An explicit weight takes precedence over the emphasis weight. Nested runs inherit family, size, color and emphasis, and can override weight and tone.

Web uses escaped text inside strong/em/span. NativeScript uses one Label with FormattedString/Span, preserving a continuous reading order and system text scaling. Spaces between runs are preserved; Vue's compiler still applies its whitespace policy. Use explicit interpolation spaces when needed. Wrapping and alignment belong to the parent MText.

Arbitrary HTML, layouts, events and controls are rejected inside MSpan. Rendering it outside MText throws an actionable error. Links remain a separate navigation contract; color/emphasis does not make a run interactive. MText's `text` prop takes precedence over the entire slot.

See [Typography and customization](../guide/typography) and [Atelier](../showcase/studio).
