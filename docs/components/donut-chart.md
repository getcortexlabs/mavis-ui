---
title: DonutChart
---

# DonutChart

::: info Included in RC.12
Available in Mavis 0.1.0-rc.12 for Vue + Vite, Nuxt and NativeScript. Keep the Mavis packages at the same version.
:::

<ComponentPreview component="donut-chart" :height="1000" />

```vue
<MDonutChart v-model="selected" :segments="segments" label="Hours" animateNumber />
```

| Prop | Type | Default | Contract |
| --- | --- | --- | --- |
| `segments` | readonly DonutSegment[] | required | Unique id, label, nonnegative finite value, optional six-digit HEX color. Up to 24. |
| `modelValue` | string or null | null | Selected segment ID; selecting again clears it. |
| `size / strokeWidth` | number | 220 / 12 | Diameter 100–800px/DIP, stroke 1–20 in the 100-unit view box. |
| `animated / animateNumber / disabled` | boolean | true / false / false | Jolt arcs, optional numeric presentation and selection lock. |
| `formatValue / totalLabel / emptyLabel` | function / string / string | default / Total / No data | App-controlled number formatting and localized text. |

Legend buttons expose exact values and rounded percentages immediately; the decorative ring interpolates with Jolt. Stable IDs preserve segment identity. All-zero input shows an empty track, never an invalid division. Empty arrays are valid. The center shows the selected value or total. SVG SSR remains readable before enhancement; native rendering uses Jolt shape layers. Reduced motion settles immediately.

`update:modelValue` → `string | null`.

<<< @/../examples/catalog/shared/demos/DonutChartDemo.vue
