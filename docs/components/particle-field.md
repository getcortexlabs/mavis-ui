---
title: ParticleField
---

# ParticleField

::: info In development
Available on this branch for Vue + Vite, Nuxt and NativeScript. Not yet included in the published npm release.
:::

<ComponentPreview component="particle-field" :height="1000" />

```vue
<MParticleField :active="playing" :density="12" :speed="28">
  <MText text="Room for wonder." />
</MParticleField>
```

| Prop | Type | Default | Contract |
| --- | --- | --- | --- |
| `active` | boolean | false | Explicit request to emit decorative particles. |
| `colors / shape` | string[] / circle, rectangle, ring | palette / circle | 2–8 six-digit HEX colors and particle shape. |
| `density / lifetime` | number | 12 / 3000 | 1–60 particles/second, 100–5000ms lifetime: at most 300 live particles. |
| `speed / size / duration` | number | 28 / 3 / continuous | Speed 0–300px or DIP/s, size 1–24, optional finite emission 100–60000ms. |
| `height / radius / backgroundColor` | number / token / string | 280 / lg / #202A32 | Surface size, corners and static backdrop. |

Uses the Jolt emitter, with no component animation loop or particle solver. Pausing disposes existing particles; resuming starts a new field. Duration limits emission; existing particles may live until their lifetime ends. Reduced motion suppresses emission. Web pauses outside the viewport/background; native stops on unload, deactivation or application suspension. The slot remains mounted and usable. Provide a visible pause control for continuous emission.

<<< @/../examples/catalog/shared/demos/ParticleFieldDemo.vue
