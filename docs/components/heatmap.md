---
title: Heatmap
---

# Heatmap

::: info In development
Available in this PR for Vue + Vite, Nuxt and NativeScript. Not included in the published RC.12.
:::

<ComponentPreview component="heatmap" :height="1100" />

```vue
<MHeatmap v-model="selected" :start="start" :end="end" :values="values" label="Practice" />
```

| Prop                                | Type                         | Default               | Contract                                                                                               |
| ----------------------------------- | ---------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------ |
| `start / end`                       | CivilDate                    | required              | Inclusive ISO civil dates; range 1–366 days. No time zone conversion.                                  |
| `values`                            | readonly HeatmapValue[]      | required              | Unique date, nonnegative finite value or null; optional label and disabled. Missing differs from zero. |
| `modelValue`                        | CivilDate \| null            | null                  | Controlled selected day.                                                                               |
| `colors / cellSize / weekStartsOn`  | string[] / number / 0\|1     | 5 colors / 40 / 1     | 2–8 six-digit HEX colors, 28–80px/DIP cells, Sunday or Monday first.                                   |
| `animated / disabled / formatValue` | boolean / boolean / function | true / false / String | Jolt color interpolation, selection lock and value formatting.                                         |
| `label / id`                        | string                       | required / optional   | Accessible component name and optional stable ID.                                                      |

Dates are laid out in week columns. Each day is a named control with its exact value; View data exposes a linear text alternative. Arrow keys move by day/week, Home/End to the first/last day. The palette includes zero at its lowest stop; absent or null values remain unpainted. Jolt interpolates the cell paint while accessible values update immediately. Reduced motion settles immediately. Long periods scroll horizontally inside the component.

`update:modelValue` → `CivilDate`.

Motion uses Jolt and respects reduced motion. Use `:animated="false"` for static presentation.

<<< @/../examples/catalog/shared/demos/HeatmapDemo.vue
