---
title: ImageCompare
---

# ImageCompare

::: info In development
New component for the next release. Not included in the published alpha.11 packages.
:::

<ComponentPreview component="image-compare" :height="850" />

```vue
<MImageCompare
  v-model="position"
  :before="original"
  :after="edited"
  label="Photo comparison"
  beforeLabel="Original"
  afterLabel="Edited"
/>
```

| Prop                                   | Type                                            | Contract                                                        |
| -------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------- |
| `before / after`                       | `string`                                        | Required image sources.                                         |
| `label / beforeLabel / afterLabel`     | `string`                                        | Required comparison name; default side labels `Before / After`. |
| `modelValue / step`                    | `number`                                        | `50 / 1`, clamped to 0–100.                                     |
| `aspectRatio / orientation / disabled` | `number / 'horizontal' or 'vertical' / boolean` | `1.5 / horizontal / false`.                                     |

Both images keep their full geometry: the divider reveals a clipped image instead of squeezing it. Direct dragging follows input; buttons or external model changes animate the reveal through a Jolt numeric value. The Web slider supports arrows, Shift+arrows, Home/End and PageUp/PageDown. Native provides an accessible slider in addition to the on-image handle. Cancellation restores the starting value. Use images with matching composition for before/after comparisons; different images work for comparing alternatives. Image loading/error placeholders come from MImage.

<<< @/../examples/catalog/shared/demos/ImageCompareDemo.vue
