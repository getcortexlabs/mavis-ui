---
title: Chart
---

# Chart

::: info Added in alpha.11
Included in Mavis 0.1.0-alpha.11 for Vue + Vite, Nuxt and NativeScript iOS/Android. Keep core and renderers on the same version.
:::

<ComponentPreview component="chart" :height="1000" />

```vue
<MChart v-model="selection" v-model:hiddenSeries="hidden" :categories="days" :series="series" label="Activity" type="line" />
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `categories / series` | `readonly ChartCategory[] / readonly ChartSeries[]` | required | Stable keys and labels; each series has one finite number or null per category. |
| `type / height` | `line or bar / number` | line / 240 | Plot type and height (120–800 px/DIP). Up to 100 categories and 8 series. |
| `domain` | `readonly [number, number]` | automatic | Increasing finite bounds containing all values. Automatic domain includes zero. |
| `modelValue / hiddenSeries` | `ChartSelection or null / readonly ChoiceValue[]` | null / [] | Selection by { category, series } key and controlled legend visibility. |
| `formatValue / showData` | `function / boolean` | string / false | Formatting callback and initial textual data expansion. |
| `label / description / categoryLabel / seriesLabel` | `string` | see source | Heading, context and accessible selection labels. |
| `showDataLabel / hideDataLabel / emptyLabel / missingLabel / clearLabel` | `string` | English labels | Localizable actions and empty/missing states. |

Categorical line and grouped bar charts share the same normalized geometry. Null creates a gap, never an invented zero. Negative values share a zero baseline; hiding a series keeps the domain stable. Web uses SVG; native uses bounded native shapes, without a WebView. Tap/click chooses a nearby series, and labelled selectors provide an alternative on every platform. Show data exposes all values, including hidden series. Jolt animates plot entry/data replacement; no per-value morph or axis interpolation is promised. Colors are six-digit hex or theme defaults; color is supplemented by labels and textual values. This first version does not implement time axes, zoom, stacking, financial charts or streaming-scale datasets.

Events: `update:modelValue(ChartSelection or null)`, `update:hiddenSeries(ChoiceValue[])`.

<<< @/../examples/catalog/shared/demos/ChartDemo.vue
