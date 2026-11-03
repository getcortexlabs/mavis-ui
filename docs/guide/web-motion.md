---
title: Jolt Web capabilities
description: Shared choreography, Web SVG and HTML composition, and the verified Jolt capability matrix.
---

# Jolt Web capabilities

These integrations ship in **Mavis 0.1.0-alpha.10**, using **Jolt 0.1.0-rc.10** ([release](https://github.com/rafaelaugustos/jolt/releases/tag/v0.1.0-rc.10)). They remain experimental.

Alpha.8 also includes the new [visual and collection integrations](./visual-motion) and [platform motion](./platform-motion). The project creator now pins Mavis alpha.10 with Jolt RC.10.

## Shared choreography

`createMotionSurface()` and `createMotionRegion()` describe application-owned motion without exposing an HTML element or NativeScript view. Declare surfaces on Button/Card and their region on Box. Run recipes after availability; a child created with `surface.use()` owns its resources and is recreated with its presentation. A removed or replaced surface invalidates the previous generation's resources.

| Capability | Mavis integration | Example |
| --- | --- | --- |
| Transforms, opacity, springs, keyframes, interruption | `surface.animate()` | Atelier, Kinetic |
| Component press layers | Button/Card, composed in the same Jolt context | All interactive demos |
| Mutable values, followers, mappings, bindings | `motionValue`, `springValue`, `.to`, `bind` | Kinetic, Field Guide |
| Finite scalar playback and additive layers | `animateValue`, `stopValue({ layer })` | Tempo |
| Existing playback progress | `playbackProgress(handle)` | Tempo |
| Ordered/overlapping steps and factories | `region.sequence()` | Tempo |
| Imperative timeline with future callbacks | `region.timeline()` | Tempo |
| Named states and replacing targets | `region.states()` | Tempo |
| Velocity/friction release and projected snap | `surface.decay()`, optional drag release callback | Tempo |
| Bounded drag/spring snap | `surface.drag()`, Sheet handle | Kinetic, Sheet |
| Responsive geometry | `surface.refresh()` and renderer observation | Field Guide |
| Vertical scroll values/linked motion | Screen motion source and `scrollLinked` | Field Guide |
| Intrinsic height and width | Reveal; Web `scope.animateSize()` | Reveal, Afterglow |
| Paint, layout/FLIP and declarative seekable scenes | Web scope; catalog platform adapters | Afterglow |
| Pointer input, viewport entry | Regions and pointer/viewport contracts | Afterglow |
| Shared layout identities and replacement | `region.sharedLayout()` | Afterglow |
| Scoped ownership, suspension, diagnostics | `surface.use`, regions, Web scope, `region.diagnostics` | Lifecycle checks |
| SVG stroke drawing | Web `scope.drawPath()` | Connections |

The runtime owns interpolation, scheduling, velocity and drawing. Mavis supplies component references and presentation ownership. Playback progress is animation progress, not a claim about upload or network completion.

### Values and playback

```ts
const stop = surface.use(motion => {
  const value = motion.motionValue(0)
  const x = value.to([0, 1], [-30, 30], { clamp: false })
  motion.bind({ x })
  const travel = motion.animateValue(value, [0, 1, 0.35], { duration: 2400 })
  const progress = motion.playbackProgress(travel)
  motion.bind({ opacity: progress.to([0, 1], [0.55, 1]) })
  travel.pause()
  travel.progress = 0.5
  travel.resume()
  motion.animateValue(value, 0.15, { layer: 'accent', duration: 200 })
  // Remove this layer without changing the base trajectory:
  motion.stopValue(value, { layer: 'accent' })
})
```

Values must be mutable inputs from the same surface/presentation (including its child owners). Derived, foreign and disposed values reject before acquiring playback. Disposing a progress mapping leaves the borrowed animation alive. No Vue render loop or extra progress timer is created.

### Groups and states

```ts
const group = region.timeline([
  [card, { y: [20, 0] }, { duration: 800 }],
  [card, { rotate: [0, 3, 0] }, { duration: 900, at: '<' }],
  { at: 1000, run: () => {
    checkpoint() // application-owned side effect
    return card.animate({ scale: [1, 1.05, 1] }, { duration: 400 })
  } },
])
group.pause()
group.resume()
group.stop() // cancels future factories too
```

A sequence returns completion/stop. An imperative timeline adds pause/resume, including pending callbacks, and preserves independently paused children. It has no seek; use Jolt's declarative seekable timeline for scrubbing. Factories return Mavis playback, preserving the underlying Jolt clock and arrival metadata. Tuple surfaces must be mounted when the group starts; their removal stops the group.

`region.states({ card }, definitions, { transition })` follows the declared surface when its component is replaced. Missing targets can attach later. `current` means the requested state; `settled` means completed motion. Transition overrides use `{ duration: 600, targets: { card: { duration: 900 } } }`. A paused replacement joins the existing transition. The application still owns work/error/success decisions.

Decay takes explicit velocity in CSS pixels/second on Web and DIPs/second on NativeScript. `drag({ axis: 'x', onRelease(event) { ... } })` supplies Jolt's measured `velocityX`/`velocityY`. Use a spring for a known destination; use decay for velocity-driven coasting, optionally snapping to the nearest projected destination. Sheet retains its existing spring behavior.

## Web HTML and SVG

Use the experimental Web entry for application-owned markup inside a declared Mavis Box region:

```ts
import { useMavisWebMotion } from '@getcortexlabs/mavis-web/experimental'

useMavisWebMotion(region, (scope, element) => {
  const path = element.querySelector<SVGPathElement>('#connection')!
  const drawing = scope.drawPath(path, { progress: 0 })
  drawing.animate(1, { duration: 1200 })
})
```

The callback receives Jolt's complete `WebMotionScope`: drawing, paint, layout, intrinsic size, seekable timelines, values, groups, states, gestures, scroll and ownership controls. It borrows the same runtime used by the region's component press. Use the supplied child scope for later work; do not create a second runtime over those surfaces or dispose borrowed inputs. Configuration of a standalone Jolt runtime remains an application/Jolt concern.

Setup does not execute during SSR. Initial HTML/SVG remains renderable on the server. The callback is recreated with the region and document lifecycle; unmount and KeepAlive deactivation dispose its owned work. A cleanup function or resource can be returned synchronously. Promises are not setup cleanup functions.

`drawPath` animates stroke progress for one continuous contour per target, including authored `pathLength`. It supports reversal, pause/resume, playback seek, geometry refresh, reduced motion and cleanup. It does not morph path geometry, and SVG paint is not a GPU/compositor guarantee. HTML/SVG composition is Web-specific; the shared Tempo recipe works in both renderers.

## Vue and Nuxt attachment

Button/Card surfaces, Box regions and Screen scroll references become available after insertion into their runtime document. Mavis uses Jolt's Vue lifecycle adapter for deferred insertion, cancellation and KeepAlive; it does not poll frames or delay by a fixed timeout. Unmount cancels pending work. The imperative Jolt runtime still requires mounted targets.

For a plain HTML entrance in a Vue/Nuxt component, use Jolt's directive factory instead of calling `runtime.viewportEnter()` directly inside a `mounted` directive:

```vue
<script setup lang="ts">
import { createViewportEnterDirective } from '@rafaelaugusto/jolt/web/vue'

const vEnter = createViewportEnterDirective({
  viewport: {
    keyframes: { y: [22, 0] },
    transition: { duration: 500 },
    once: true,
  },
})
</script>
<template><section v-enter>Readable server content</section></template>
```

Create the directive per component or application, including each SSR request. Use it on application-owned HTML; compose motion on Mavis surfaces through their region's borrowed runtime. SSR emits readable content without an animation owner.

## Keyed stories and horizontal scroll

<a href="/playground/#/showcase/horizons?lang=en">Horizons</a> demonstrates the new Web APIs through `useMavisWebMotion`. Three Card presentations are reused for six story identities. `scope.animateItems([{ key, target }], frames, { once: true })` tracks the logical keys; call `update()` after changing the rendered items. Reusing an element for another key permits a new entrance, while returning to a seen key settles without replay. `forget(key)` clears its history. Keys must be unique, and `stagger` is not supported by this per-item entrance API.

When the content changes a Card's measured dimensions, claim its application motion channel and use `scope.observeGeometry(target)`. The example observes geometry without replacing the element, losing press or rebuilding the list controller.

`scope.scrollValue(rail, { axis: 'x' })` reads CSS pixels from inline start: left in LTR, right in RTL. `scrollLinked(..., { axis: 'x', range: [0, end] })` uses the same normalized axis. Values are offsets, not percentages; the example maps the current overflow distance to progress and refreshes that mapping when the container resizes. Jolt handles browser RTL offsets and execution; Mavis does not normalize `scrollLeft` itself.

Horizontal Web composition does not change the portable Screen contract, which remains vertical. Reversed flex and vertical writing modes are outside this horizontal adapter's supported flow. NativeScript does not acquire DOM/SVG APIs through the Web entry.

The Nuxt consumer covers async page navigation with out-in transitions, SSR/SSG, repeated visits, KeepAlive and RTL. Jolt's separately reported Nuxt 4.6.3 interrupted async-page placeholder limitation remains outside this delivery; this is not a promise to repair all framework navigation races.

Jolt #338's paused native replacement was retested with the RC.8 source candidate in Android API36 and iOS26.2: both completed the requested replacement state and all 14 orchestration checks. This fixes the previously recorded native blocker; The fix shipped in RC.8 and remains included in the RC.9 registry version used by alpha.7. Tracking: Mavis #218–#221 and #224.


## Recorded examples

Tempo uses the same recipe in both renderers. Web recordings use candidate `3b8649f`; native recordings use `9043166`, including the paused-replacement fix. Native clips show the probe dispatching component actions and measuring the actual presentation on a simulator/emulator; they are not physical-device touch tests.

<p>Tempo · Chromium</p>
<video controls playsinline preload="none" aria-label="Tempo · Chromium" src="/media/orchestration-tempo-web.mp4" style="width: 100%; max-height: 600px"></video>

<p>Tempo · iOS 26.2</p>
<video controls playsinline preload="none" aria-label="Tempo · iOS 26.2" src="/media/orchestration-tempo-ios.mp4" style="width: 100%; max-height: 600px"></video>

<p>Tempo · Android API36</p>
<video controls playsinline preload="none" aria-label="Tempo · Android API36" src="/media/orchestration-tempo-android.mp4" style="width: 100%; max-height: 600px"></video>

<p>Connections · Chromium</p>
<video controls playsinline preload="none" aria-label="Connections · Chromium" src="/media/orchestration-connections-web.mp4" style="width: 100%; max-height: 600px"></video>
