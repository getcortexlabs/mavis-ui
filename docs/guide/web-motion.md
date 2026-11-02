---
title: Jolt Web capabilities
description: Shared choreography, Web SVG and HTML composition, and the verified Jolt capability matrix.
---

# Jolt Web capabilities

This page describes the source branch under development. The new orchestration operations require Jolt **after RC.7**, currently verified at `3b8649fd11d2273c360250f2316ad04e62ab4aad` ([upstream PR #335](https://github.com/rafaelaugustos/jolt/pull/335)). They are **not included in the published Mavis alpha.5 or Jolt RC.7**. Before a Mavis release, replace the candidate with its containing registry version and repeat the consumer checks.

For source development, install the pinned candidate with `node scripts/prepare-jolt-candidate.mjs`; use `--native` after installing the catalog's dependencies. This builds a real Jolt tarball from the recorded commit, without changing the dependency lockfile or publishing a version. The project creator continues to generate projects using published alpha.5/RC.7 capabilities.

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

## Upcoming upstream work

These capabilities are still being implemented in Jolt and are not claimed as available by this branch:

- [Jolt #334](https://github.com/rafaelaugustos/jolt/issues/334): deferred DOM attachment during Nuxt transitions. Imperative targets must remain mounted; Mavis must adopt the lifecycle fix without weakening that validation.
- [Jolt #336](https://github.com/rafaelaugustos/jolt/issues/336): identity-aware list entry for changing/recycled rows.
- [Jolt #337](https://github.com/rafaelaugustos/jolt/issues/337): horizontal scroll and RTL normalization.

Tracking: Mavis #218–#221 and #224. NativeScript does not gain browser DOM/SVG APIs through this integration.

Native paused target replacement is currently blocked by [Jolt #338](https://github.com/rafaelaugustos/jolt/issues/338), reproduced on Android API36 and iOS26.0 simulators. The matching Web flow passes. Scalar playback, progress, timeline controls, press composition and decay passed both native probes; do not claim replacement parity or release that contract until the upstream fix is validated.
