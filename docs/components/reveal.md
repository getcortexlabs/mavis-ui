---
title: Reveal
description: "Reveal in Mavis UI. Show or hide content with a short transition."
---

# Reveal

`m-reveal` · Show or hide content with a short transition.

<ComponentPreview component="reveal" :height="300" />

## Usage

```vue
<m-button @click="visible = !visible">Details</m-button>
<m-reveal :show="visible">
  <m-card><m-text>A little more context.</m-text></m-card>
</m-reveal>
```

Values and handlers in this snippet belong to your component. The full example below includes their setup.

## API

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `show` | boolean | `false` | Inserts or removes content. |

Enter animates opacity and vertical offset; leave animates opacity. Layout space is not interpolated. Content stays mounted during leave and is removed at completion. NativeScript uses Jolt; Web uses Vue Transition and CSS while Jolt browser support is tracked separately. Both respect reduced motion.

Also accepts Column props: `gap`, `align`, `justify`, `wrap` and the [common layout props](../guide/component-contract#layout-values). They apply to the conditional column.

## Full example

This file also runs in the NativeScript catalog and the Web preview.

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/RevealDemo.vue

</details>

## In context

[See the components in a complete vehicle controls screen](../showcase/vehicle).

[Jolt Web · #236](https://github.com/rafaelaugustos/jolt/issues/236)

[Accessible names, focus and screen-reader checks](../guide/accessibility).
