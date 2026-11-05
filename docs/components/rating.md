---
title: Rating
---

# Rating

::: info Unreleased
Available in development source for Vue + Vite, Nuxt and NativeScript iOS/Android. Not yet published on npm.
:::

<ComponentPreview component="rating" :height="850" />

```vue
<MRating v-model="score" :step="0.5" label="How was your stay?" />
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue / v-model` | `number` | `0` | Rating from zero through max. |
| `max / step` | `number / 1 or 0.5` | `5 / 1` | One to ten stars, whole or half increments. |
| `readonly / disabled` | `boolean` | `false` | Summary without controls or disabled controls. |
| `clearable / clearLabel` | `boolean / string` | `true / Clear rating` | Explicit action to clear. |
| `formatValue` | `(value, max) => string` | `—` | Score text and accessible names. |

Actionable stars choose whole values and use MButton’s Jolt feedback. With step 0.5, a slider selects half stars by touch, keyboard or assistive input. Readonly displays icons and a textual score without actions. Values clamp and snap; use the numeric model rather than extracting icon text.

<<< @/../examples/catalog/shared/demos/RatingDemo.vue
