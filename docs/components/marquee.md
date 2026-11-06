---
title: Marquee
---

# Marquee

::: info Included in RC.12
Available in Mavis 0.1.0-rc.12 for Vue + Vite, Nuxt and NativeScript. Keep the Mavis packages at the same version.
:::

<ComponentPreview component="marquee" :height="1100" />

```vue
<MMarquee :items="reminders" label="Small reminders" v-model:paused="paused" :speed="35" />
```

| Prop                     | Type                   | Default       | Contract                                                          |
| ------------------------ | ---------------------- | ------------- | ----------------------------------------------------------------- |
| `items`                  | readonly MarqueeItem[] | required      | Unique id, label and optional image; content is noninteractive.   |
| `autoplay / paused`      | boolean                | false / false | Autoplay is opt-in. paused can be controlled with v-model:paused. |
| `speed / direction`      | number / left \| right | 35 / left     | Pixels/DIPs per second, in (0,500].                               |
| `itemWidth / gap`        | number                 | 180 / 16      | Fixed item width >=80 and nonnegative spacing.                    |
| `playLabel / pauseLabel` | string                 | English       | Always-visible motion control labels.                             |

Jolt owns linear playback and pause/resume. Decorative repeated copies are hidden from accessibility. Motion starts only on request; reduced motion always produces a static wrapping list. Web pauses on hover/focus, page hiding and leaving the viewport; native pauses on application suspension and unload. KeepAlive/disposal releases observers and playback. No links or interactive slots are duplicated.

<<< @/../examples/catalog/shared/demos/MarqueeDemo.vue
