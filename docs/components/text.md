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
| `tone` | palette key | `text` | Semantic color. |
| `as` | p / span / h1 … h6 | `p` | Semantics independent of appearance. |
| `align` | left / center / right | `left` | Text alignment. |
| `wrap` | boolean | `true` | Allows line wrapping. |
| `text` | string | `—` | Alternative to slot text. |
| `grow / shrink` | number | `0 / context` | Space distribution. |

`variant` controls appearance; `as` controls semantics. `as="h1"` through `h6` produces HTML headings on the Web and the heading accessibility role on NativeScript. The slot accepts plain or interpolated text without child components. Use layouts to compose text with other elements.

## Full example

This file also runs in the NativeScript catalog and the Web preview.

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/TextDemo.vue

</details>

## In context

[See the components in a complete vehicle controls screen](../showcase/vehicle).

See [Layout and text](../guide/layout) for flexible sizing, large text and RTL direction.
