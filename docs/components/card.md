---
title: Card
description: "Card in Mavis UI. A themed surface for related content."
---

# Card

`m-card` · A themed surface for related content.

<ComponentPreview component="card" :height="320" />

## Usage

```vue
<m-card gap="md">
  <m-text variant="heading">Your space</m-text>
  <m-text tone="muted">Content that belongs together.</m-text>
</m-card>
```

## API

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `gap` | token / number | `none` | Space between children. |
| `padding` | token / number | `lg` | Internal spacing. |
| `radius` | token / number | `lg` | Surface corners. |
| `interactive` | boolean | `false` | Makes the entire surface an action. |
| `disabled` | boolean | `false` | Disables an interactive card. |
| `accessibilityLabel` | string | `—` | Accessible name of the action. |

Children are arranged vertically. Surface and border colors come from the theme. Enable `interactive` for a single action across the whole area, with press feedback. On the Web, the card receives focus and responds to Enter and Space. `@click` has no payload and is not emitted while `disabled` is active. Provide `accessibilityLabel` to describe the action. Do not nest buttons, links or inputs inside an interactive card. It also accepts the composition props below.

### Composition props

`padding`, `paddingX`, `paddingY`, `radius`, `grow`, `shrink`, `width`, `height` and `backgroundColor` are also accepted. `paddingX` and `paddingY` override their respective sides. Row, Column and Box start without padding; Card starts at `lg`. `grow` defaults to 0; `shrink` follows the parent context.

## Full example

This file also runs in the NativeScript catalog and the Web preview.

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/CardDemo.vue

</details>

## In context

[See the components in a complete vehicle controls screen](../showcase/vehicle).

[Accessible names, focus and screen-reader checks](../guide/accessibility).

## Customization

The theme provides component defaults and Web CSS custom properties. See [Typography and customization](../guide/typography) for tokens, supported overrides and precedence.

`elevation="none | sm | md | lg"` selects the shadow; without the prop, it uses `components.card.elevation`. The Mavis default is `none`.
