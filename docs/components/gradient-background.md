---
title: GradientBackground
---

# GradientBackground

::: info In development
Available on this branch for Vue + Vite, Nuxt and NativeScript. Not yet included in the published npm release.
:::

<ComponentPreview component="gradient-background" :height="1000" />

```vue
<MGradientBackground :colors="colors" :active="playing">
  <MText text="Make room for something good." />
</MGradientBackground>
```

| Prop | Type | Default | Contract |
| --- | --- | --- | --- |
| `colors` | readonly string[] | #9C5270, #51847B, #D5AD6C | 2–8 six-digit HEX colors. |
| `angle` | number | 130 | Linear gradient angle in degrees. |
| `active / animated` | boolean | false / true | Opt-in continuous rotation and palette transitions. |
| `duration` | number | 12000 | 1000–120000ms per half turn. |
| `height / radius` | number / token | 280 / lg | 40–1600px/DIP and shared corner token. |

Static by default, including SSR. Setting active starts Jolt angle motion. Palette changes animate without remounting slot content. Offer a visible play/pause control when enabling continuous motion. Reduced motion, hidden Web documents and unloaded/deactivated native views stop decoration. Web also pauses outside the viewport. Content remains interactive; choose foreground colors with adequate contrast across every palette.

<<< @/../examples/catalog/shared/demos/GradientBackgroundDemo.vue
