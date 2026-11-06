---
title: Confetti
---

# Confetti

::: info Included in RC.12
Available in Mavis 0.1.0-rc.12 for Vue + Vite, Nuxt and NativeScript. Keep the Mavis packages at the same version.
:::

<ComponentPreview component="confetti" :height="1000" />

```vue
<MConfetti :trigger="celebration" :count="70">
  <MButton text="Publish" @click="celebration++" />
</MConfetti>
```

| Prop | Type | Default | Contract |
| --- | --- | --- | --- |
| `trigger` | string or number | 0 | Changing the token requests one burst; initial render/hydration never emits. |
| `count / colors` | number / string[] | 70 / palette | 1–180 pieces and 2–8 six-digit HEX colors. |
| `disabled` | boolean | false | Disposes an active burst and rejects new ones. |

The exposed burst() requests a celebration; stop() disposes it. A repeated request replaces the previous burst. Jolt owns the finite lifetime and cleanup; the component does not claim a completion callback. The burst event means a request started; skipped reports disabled, reduced-motion or unavailable. Keep success messages independent from decoration so every user receives confirmation. No browser-only imports are required in shared screens.

`burst` → `void`; `skipped` → `disabled | reduced-motion | unavailable`.

<<< @/../examples/catalog/shared/demos/ConfettiDemo.vue
