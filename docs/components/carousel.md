---
title: Carousel
---

# Carousel

::: info Added in alpha.11
Included in Mavis 0.1.0-alpha.11 for Vue + Vite, Nuxt and NativeScript iOS/Android. Keep core and renderers on the same version.
:::

<ComponentPreview component="carousel" :height="850" />

```vue
<MCarousel v-model="current" :items="slides" itemKey="id" label="Stories"><template #default="{ item }">…</template></MCarousel>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items / itemKey` | `readonly T[] / string or function` | `required / id` | Slides with unique stable keys. |
| `modelValue / v-model` | `ChoiceValue or null` | `null` | Active slide key; absent or removed selection displays the first. |
| `loop / disabled` | `boolean` | `false` | Wrap around the ends; disable interaction. |
| `previousLabel / nextLabel / slideLabel / emptyLabel` | `string` | `Previous slide / Next slide / Slide / No slides` | Localizable labels. |

Buttons, indicators, Web arrow keys and horizontal swipe change slides. Jolt animates entry and respects reduced motion. There is no autoplay. Only the active slide is mounted; keep drafts in the application by key. The slot receives item, index and itemKey. Web controls inside a slide do not start swipes, and vertical scrolling remains available. Give slides stable geometry to avoid layout jumps. Indicators are intended for small collections such as onboarding and featured stories.

<<< @/../examples/catalog/shared/demos/CarouselDemo.vue
