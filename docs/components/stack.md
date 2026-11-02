---
title: Stack
description: "Responsive composition with stable children."
---

# Stack

`MStack` changes direction, spacing and alignment at container-width breakpoints. It keeps the same children mounted, including input state and focus.

<ComponentPreview component="stack" :height="330" />

```vue
<m-stack gap="sm" :responsive="[
  { at: 640, direction: 'row', gap: 'lg' },
  { at: 1000, gap: 'xl', align: 'center' },
]">
  <m-input v-model="name" label="Name" :grow="1" />
  <m-button>Continue</m-button>
</m-stack>
```

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `direction` | row / column | `column` | Base direction. |
| `responsive` | StackBreakpoint / readonly StackBreakpoint[] | — | Minimum content-width overrides. |
| `gap` | spacing token / number | `none` | Base gap. |
| `align` | start / center / end / stretch | `stretch` | Cross-axis alignment. |
| `justify` | start / center / end / between / around | `start` | Main-axis distribution. |
| `wrap` | boolean | `false` | Wrap children. |

Each breakpoint has a positive, unique `at` and optional `direction`, `gap`, `align`, `justify` and `wrap`. Overrides accumulate in ascending order. Width means the Stack's content width after padding: CSS pixels on Web, DIPs on NativeScript. It is not the device width. Common layout props also apply.

SSR and the first hydration render use the base layout. Measurement then applies matching breakpoints without replacing children. Define a usable base, usually a column. NativeScript remeasures on layout/orientation changes. This is responsive flex composition, not a CSS grid engine; use nested Stacks for rows of related content.

<<< @/../examples/catalog/shared/demos/StackDemo.vue
