---
title: Images, physics and platform motion
description: Experimental Jolt surfaces for images, particles, shapes, keyboard, sheets and navigation.
---

# Images, physics and platform motion

**Source development; not published in alpha.7 or Jolt RC.9.** This work uses Jolt main `f074714755164dc83df4cffb4c78c44c38ef33d2` ([#365](https://github.com/rafaelaugustos/jolt/pull/365), [#372](https://github.com/rafaelaugustos/jolt/pull/372)). The reproducible candidate in `jolt-candidate.json` must be replaced with a containing published RC before publishing Mavis. The project creator still uses published packages.

<a href="/playground/#/showcase/prism?lang=en">Prism</a> and <a href="/playground/#/showcase/orbit?lang=en">Orbit</a> share their Vue source across Web and NativeScript. <a href="/playground/#/showcase/passage?lang=en">Passage</a> demonstrates Web router integration.

| API                                   | Web                                          | iOS                              | Android                                |
| ------------------------------------- | -------------------------------------------- | -------------------------------- | -------------------------------------- |
| `particles`, `confetti`               | Jolt canvas                                  | Native emitter                   | Native emitter                         |
| `blur`                                | CSS filter                                   | Native material                  | Native content blur; backend dependent |
| `shape`                               | SVG                                          | Native paths                     | Native paths                           |
| `liquid` on MImage                    | Jolt image effect                            | Native image effect              | Unsupported                            |
| `imageEffect`                         | Loaded image; backend/CORS dependent         | Native effect or static fallback | Native effect or static fallback       |
| `symbolEffect` on MIcon               | Glyph artwork                                | `systemName` SF Symbol           | Unsupported; regular glyph remains     |
| Region `physicsWorld`                 | Bounded circle physics                       | Bounded circle physics           | Bounded circle physics                 |
| `followKeyboard`, region `onKeyboard` | VirtualKeyboard or estimated visual viewport | Native keyboard                  | Native keyboard                        |
| MSheet                                | Dedicated Jolt bottom sheet                  | Existing native bottom sheet     | Existing native bottom sheet           |
| MDialog `interactive`                 | Opt-in Jolt modal                            | Existing in-page modal           | Existing in-page modal                 |
| Passage shared navigation             | Application-owned async route                | No new Frame adapter             | No new Frame adapter                   |

## Owned surfaces

Use `markRaw(createMotionSurface())` and a component's `motionSurface` prop. `surface.use(motion => { ... })` owns resources created during setup and later actions using that scoped `motion`. Removing, replacing or deactivating the presentation disposes them. No Mavis solver or frame loop is added.

```ts
const stop = surface.use((motion) => {
  motion.particles({ source: 'top', rate: 24, colors: ['#4262c4', '#b83670'] })
  const paint = motion.blur({ amount: 0, radius: 18 })
  paint.animate(0.7, { type: 'spring', duration: 700 })
})
// Stop the recipe while keeping its component.
stop()
```

Decorations expose `supported` and idempotent `dispose()`. Blur exposes a backend snapshot; shape supports path morphing and stroke ranges with compatible path commands. Backend rendering is not pixel-identical. Keep meaningful text and controls outside decorative blur/particle surfaces.

## Images and their model

Declare `motionSurface` on **MImage**, then wait for the surface's availability. It binds the decoded image after loading, not the aspect-ratio wrapper. `imageEffect()` returns a promise because a dissolve destination must load first.

```vue
<MImage v-model:src="source" :motionSurface="photo" alt="Coastal study" :aspectRatio="4 / 3" />
```

```ts
const operation = await motion.imageEffect('dissolve', { to: nextSource, paused: true })
operation.progress = 0.5
operation.resume()
const committed = await operation.finished
```

Forward completion emits `update:src`; the app must accept it to commit the model. Rejected updates restore the previous image and resolve `false`. Cancellation, replacement, stale loading and reverse completion do not commit the destination. Finite effects provide pause/resume, seek, reverse and finish; pointer-driven distortion has different playback capabilities. Reduced motion or an unsupported rendering backend may settle immediately. Web destinations need appropriate CORS/CSP permission. No request-abort guarantee is made for image decoding.

`liquid()` also requires a loaded MImage. Android reports unsupported. MIcon keeps its existing portable `name`; optional `systemName="heart.fill"` selects an iOS system image for symbol effects. `supports('symbol')` reflects the actual artwork available at the time of the call.

## Keyboard and circle physics

`region.onKeyboard(callback)` reports visibility, height, backend and accuracy. Web visual-viewport information is an estimate, not proof that a keyboard is present. Native observation starts with accuracy `unavailable` until an event arrives. Use `motion.followKeyboard({ offset: 12 })` on a dedicated untranslated composer, and let the scope release it.

`await region.physicsWorld(bodies, options)` waits for native layout and rejects stale presentations. Each body names a distinct motion surface, a radius and a center. Use 1–16 square direct children sized to the circle diameter, inside an untransformed host and ancestors. Do not attach competing gestures or transform animations. The controller offers impulse, reset, pause/resume, attachments, springs, snaps and a diagnostic snapshot. Jolt owns collision solving, native input, timing and reduced-motion behavior. A body replacement disposes its world.

## Sheets, dialogs and navigation

MSheet Web now delegates content snaps, drag, nested scrolling and keyboard placement to Jolt. Its handle is keyboard accessible. Focus trapping, labels and the controlled `open` model remain Mavis responsibilities. A non-dismissible Web sheet closes immediately for an application request because this Jolt candidate rejects programmatic `dismiss()` when dismissal is disabled.

MDialog's optional `interactive` prop enables the Jolt Web presentation and a downward gesture on its title. Close requests still respect `dismissible`, loading and the app's controlled state, and add the `swipe` reason. NativeScript keeps the existing accessible in-page modal; this prop does not convert it to a UIKit/Core modal.

Passage borrows its region runtime through `useMavisWebMotion`. Its `scope.sharedNavigation()` awaits the app's route commit and destination attachment; cancelling the visual flight does not roll the route back. The region must outlive the two presentations. Native Frame transitions need a longer-lived owner and are not exposed by this page-bound adapter.
