---
title: Sparkline
---

# Sparkline

::: info Included in RC.12
Available in Mavis 0.1.0-rc.12 for Vue + Vite, Nuxt and NativeScript. Keep the Mavis packages at the same version.
:::

<ComponentPreview component="sparkline" :height="1000" />

```vue
<MSparkline :points="points" label="Conversations" :height="64" />
```

| Prop | Type | Default | Contract |
| --- | --- | --- | --- |
| `points` | readonly SparklinePoint[] | required | Unique id, label and finite value or null; at most 100. |
| `domain` | readonly [number, number] | automatic | Shared chart domain, including zero by default; explicit bounds must contain every value. |
| `height / color` | number / string | 64 / theme | 24–240px/DIP and line color. |
| `animated / showData` | boolean | true / false | Jolt line presentation and permanently expanded data. |
| `formatValue / dataLabel / emptyLabel` | function / string / string | default / View data / No data | Custom numbers and localized disclosure/empty labels. |

Compact presentation reuses the chart domain and null conventions. Null creates a gap; it never becomes zero. Compatible paths interpolate, while changed point/gap topology settles to the new path. A summary and expandable data list remain canonical and accessible; neither requires a hover gesture. All-null and empty input show the empty summary. One point remains visible. No axes or heavy chart controls are added.

<<< @/../examples/catalog/shared/demos/SparklineDemo.vue
