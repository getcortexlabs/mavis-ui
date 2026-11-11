---
title: Images, physics and platform motion
description: Experimental Jolt surfaces for images, particles, shapes, keyboard, sheets and navigation.
---

# Images, physics and platform motion

**Experimental in Mavis 0.1.0-rc.12.** The adapters in Mavis RC.13 require [Jolt 0.1.0-rc.13](https://github.com/rafaelaugustos/jolt/releases/tag/v0.1.0-rc.13). Keep all Mavis packages at the same version and rebuild native applications after upgrading. The project creator pins Mavis RC.13 and Jolt RC.13. The optional `@rafaelaugusto/jolt-native` plugin is not required by these integrations.

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

MSheet Web now delegates content snaps, drag, nested scrolling and keyboard placement to Jolt. Its handle is keyboard accessible. Focus trapping, labels and the controlled `open` model remain Mavis responsibilities. A non-dismissible Web sheet closes immediately for an application request because Jolt ignores programmatic `dismiss()` when dismissal is disabled.

MDialog's optional `interactive` prop enables the Jolt Web presentation and a downward gesture on its title. Close requests still respect `dismissible`, loading and the app's controlled state, and add the `swipe` reason. NativeScript keeps the existing accessible in-page modal; this prop does not convert it to a UIKit/Core modal.

Passage borrows its region runtime through `useMavisWebMotion`. Its `scope.sharedNavigation()` awaits the app's route commit and destination attachment; cancelling the visual flight does not roll the route back. The region must outlive the two presentations. Native Frame transitions need a longer-lived owner and are not exposed by this page-bound adapter.

## Gravity, sensors and Web gallery

Jolt [#379](https://github.com/rafaelaugustos/jolt/pull/379) adds the Web APIs used by <a href="/playground/#/showcase/field?lang=en">Field</a> and <a href="/playground/#/showcase/gallery?lang=en">Gallery</a>. These are experimental in alpha.8.

`motion.animate({ y: 160 }, { type: 'gravity', acceleration: 1800, restitution: 0.55 })` uses Jolt's finite compiler on Web and native. Gravity accepts x/y or numeric values with one landing point. Duration comes from physics; duration/ease/bounce and opacity/scale are rejected. Signed `velocity` supports a toss; omitting it inherits current velocity. Pause/resume/progress/stop and presentation cleanup apply. Shared-layout transitions remain spring/tween.

Animation `haptic: 'light'` (or `{ style: 'medium', times: [0.5, 1] }`) is opt-in and follows Jolt playback. Defaults remain silent. Web applications can call `requestMavisWebHaptic(region, 'light')` from an explicit action. Its result distinguishes requested, unavailable, blocked and disabled; accepted requests do not prove tactile output. Browser duration hints are not native impact intensities. Reduced motion and user/system policy remain respected.

```ts
const rotation = motion.sensor('rotation')
const gravity = motion.sensor('gravity', { coordinates: 'interface' })
motion.bind({
  rotate: rotation.z.to([-Math.PI, Math.PI], [-180, 180]),
  x: gravity.x.to([-10, 10], [-48, 48]),
})
// In a user click/tap, before awaiting anything:
void rotation.requestPermission()
void gravity.requestPermission()
```

Rotation uses relative radians and an optional Hamilton quaternion (`xyzw`); gravity uses downward m/s². Native permission returns `not-required`, which is not a hardware availability claim. Web requires a secure context and may prompt only from the explicit action. Status and snapshots report unavailable/no-data honestly. Native timestamps come from the native backend; Web timestamps are browser events. Sensors own their axes and mapped bindings; disposal, replacement and KeepAlive release them. Acquisition and coordinate remapping belong to Jolt, without a Mavis polling loop.

Gallery uses `scope.glass()` through `useMavisWebMotion`, with a solid fallback under forced colors, reduced transparency or missing support. Child controls remain interactive. This is CSS backdrop filtering, not native Liquid Glass. `sharedNavigationEntry()` and `resolveListTarget()` restore the current keyed thumbnail after paging/reordering; deletion focuses a collection heading. Zoom/dismiss uses Jolt's `zoomable()`. Route callbacks check abort signals before committing; the app owns history. Passage also exposes `interactiveNavigation()` for edge drag and button return. These Web recipes do not add a native Frame or glass component adapter.
