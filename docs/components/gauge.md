---
title: Gauge
---

# Gauge

::: info In development
Available on this branch for Vue + Vite, Nuxt and NativeScript. Not yet in the published npm release.
:::

<ComponentPreview component="gauge" :height="1100" />

```vue
<MGauge :value="balance" label="Weekly balance" suffix="%" semi animateNumber />
```

| Prop                           | Type                       | Default                 | Contract                                                       |
| ------------------------------ | -------------------------- | ----------------------- | -------------------------------------------------------------- |
| `value / min / max`            | number                     | required / 0 / 100      | Finite range; value is clamped for visual and semantic output. |
| `semi`                         | boolean                    | false                   | Use a half circle instead of a full ring.                      |
| `size / strokeWidth`           | number                     | 220 / 7                 | Size >= 80 px/DIP; stroke width in viewBox units, (0,18].      |
| `animated / animateNumber`     | boolean                    | true / false            | Jolt arc interpolation; optional NumberFlow presentation.      |
| `color / suffix / formatValue` | string / string / function | theme / empty / default | Color, suffix and canonical value formatting.                  |

The meter exposes its final value immediately while Jolt animates strokeEnd. The shared shape backend paints native arcs and Web SVG; server HTML includes a static SVG fallback. A textual value remains available independently of the decorative drawing. This component measures a value; use Progress for task completion.

<<< @/../examples/catalog/shared/demos/GaugeDemo.vue
