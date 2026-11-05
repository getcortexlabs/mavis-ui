---
title: RangeSlider
---

# RangeSlider

::: info Unreleased
Available in development source for Vue + Vite, Nuxt and NativeScript iOS/Android. Not yet published on npm.
:::

<ComponentPreview component="range-slider" :height="850" />

```vue
<MRangeSlider v-model="budget" :min="0" :max="1000" :step="25" label="Budget" />
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue / v-model` | `readonly [number, number]` | `[0, 100]` | Ordered pair; handles cannot cross. |
| `min / max / step` | `number` | `0 / 100 / 1` | Finite bounds and a positive step; decimals are supported. |
| `lowerLabel / upperLabel` | `string` | `Minimum / Maximum` | Endpoint names. |
| `formatValue` | `(number) => string` | `—` | Display formatting; the model stays numeric. |
| `disabled / readonly` | `boolean` | `false` | Prevents changes. |

On Web, two range inputs share the track while keeping independent focus and identity, even when they overlap. Native 48-DIP touch handles respond to pan; labelled MNumberInput fields provide precise editing, keyboard and assistive access. Jolt animates native handle feedback. The numeric track runs left to right. Values snap and clamp; nonfinite values, invalid bounds and reversed pairs are rejected.

<<< @/../examples/catalog/shared/demos/RangeSliderDemo.vue
