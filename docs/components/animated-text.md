---
title: AnimatedText
---

# AnimatedText

::: info Included in RC.12
Available in Mavis 0.1.0-rc.12 for Vue + Vite, Nuxt and NativeScript. Keep the Mavis packages at the same version.
:::

<ComponentPreview component="animated-text" :height="1000" />

```vue
<MAnimatedText :text="headline" by="word" :replayKey="take" variant="display" />
```

| Prop                            | Type                                 | Default                    | Contract                                                                  |
| ------------------------------- | ------------------------------------ | -------------------------- | ------------------------------------------------------------------------- |
| `text / variant / tone`         | string / typography / palette        | required / title / default | Canonical text and shared typography.                                     |
| `by`                            | word or letter                       | word                       | Animation segmentation.                                                   |
| `duration / stagger / distance` | number                               | 650 / 35 / 16              | Milliseconds and vertical px/DIP; positive duration, nonnegative stagger. |
| `animated / appear / replayKey` | boolean / boolean / string or number | true / true / 0            | Enable playback, entrance on attach and explicit replay.                  |

Jolt owns word/letter entrance and replacement playback. Text is explicit, not rich slotted markup. The server renders readable canonical text; animation starts only after the renderer is ready. Updating text or replayKey replays the effect; replay() does the same. animated=false stops playback. Reduced motion follows the runtime policy. There is no automatic phrase timer or endless animation.

<<< @/../examples/catalog/shared/demos/AnimatedTextDemo.vue
