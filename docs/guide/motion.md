---
title: Motion
description: Shared Jolt motion, lifecycle ownership and an experimental application animation on NativeScript and Web.
---

# Motion

Button, interactive Card/ListItem and Reveal execute the same recipes through **Jolt 0.1.0-rc.11** on NativeScript and Web. Existing shared screens keep their props and events. This guide describes **Mavis 0.1.0-rc.11.1**. Jolt's Web entries and the surface reference below remain experimental.

The Web package now requires Jolt as a peer. A browser-only consumer installs Vue and Jolt, without NativeScript or native SDKs. Mavis imports only `@rafaelaugusto/jolt/web` and `/web/vue`. Native applications must rebuild after upgrading Jolt.

## Component motion

| Phase          | Shared definition                                |
| -------------- | ------------------------------------------------ |
| Press          | Spring, 200 ms, bounce 0, theme scale multiplier |
| Release/cancel | Spring, 450 ms, bounce 0.35, multiplier 1        |
| Reveal entry   | Opacity 0 → 1, y 8 → 0, 180 ms                   |
| Reveal leave   | Opacity → 0, 120 ms                              |

`theme.motion.pressScale` defaults to `0.97`, accepts a finite number greater than 0 and at most 1, and updates mounted feedback, including a held press. Timing stays fixed in Mavis. Jolt executes both springs; Mavis owns platform input and lifecycle. The Web adapter handles primary pointer, Enter/Space, cancellation, blur, scrolling and hidden documents without synthesizing clicks. Native uses NativeScript touch events. Native Switch labels also consume the press recipe. Selectable Web Chip feedback also uses this contract.

Press owns a multiplicative layer. Application scale **1.1 × press 0.96 = 1.056**; changing the base to **1.2 while held gives 1.152**, then release returns to **1.2**. Disable/loading, unload and unmount remove feedback without restoring a captured application scale. Theme refresh retargets a held press without replacing the application animation.

Reveal keeps content mounted during leave. Leaving controls leave the accessibility/focus order; Web restores the opening element if focus is inside. Native restores a remembered Mavis trigger when it is still loaded and notifies accessibility after entry. Raw native controls are not registered as Mavis triggers; without a remembered trigger Mavis does not invent a focus target. A cancelled leave cannot complete a newer entry, and component disposal cancels work and detaches observers. Reveal uses Jolt `animateSize` for intrinsic height; offsets use DIPs on native and CSS pixels on Web.

## Published component motion

The Atlas example demonstrates component motion **included in RC.11.1**. These changes use Jolt RC.11 and derive timing from `theme.motion`; screens keep their controlled values and events. The six screen interaction components marked In development in the catalog belong to the next release.

| Family                                            | Presentation in RC.11.1                                                                                         |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Carousel                                          | Finger-following horizontal drag, velocity-aware release and a spring back to the accepted slide                |
| Tabs, SegmentedControl, TabBar, NavigationRail    | Moving selection markers; rail width changes use intrinsic size animation                                       |
| Calendar, DatePicker, DateRangePicker             | Directional month changes and animated selection/range backgrounds                                              |
| DataTable, Breadcrumb, Timeline, TreeView         | Keyed layout, branch chevrons, status connectors and async child insertion                                      |
| CommandPalette, Combobox, MultiSelect, FilePicker | Result/chip/file layout changes without delaying edits or animating each typed character                        |
| Chart                                             | Bars, lines and points interpolate by series/category identity; data and accessible selections remain canonical |
| Popover, Menu, Tooltip, Dialog, Toast             | Jolt entry/exit with cancellation and immediate focus/accessibility state changes                               |
| RangeSlider, Rating, Progress                     | Active-handle halos, star feedback and a continuous determinate fill                                            |
| Input, NumberInput, forms                         | Feedback on helper/error copy and error-list layout; editors and caret are never animated                       |
| Image, Avatar, Badge, Alert, EmptyState           | Image reveal and restrained feedback on noninteractive content or illustration                                  |
| Grid, Stack                                       | Responsive layout motion and the same explicit `motionRegion` hook as other layout primitives                   |

VirtualList keeps work bounded to realized rows. Web animates data reordering in the current window, without playing entry effects while scrolling. NativeScript owns cell reuse; loaded logical items receive short data-change feedback, and a recycled item starts at rest. This does **not** emulate a complete native list diff or animate offscreen rows.

Existing Button/Card/ListItem press, choice paint, Sheet and Reveal already use Jolt. They retain those mechanisms. Link, Separator, Span, ThemeProvider and Platform need no ambient animation. The Web pulse skeleton and indeterminate progress remain CSS; their reduced-motion and hidden-document rules still apply. No second animation scheduler was introduced.

[Explore the Atlas composition](../showcase/atlas).

## Reduced motion

Native follows Jolt configuration (`user` by default); Web follows `prefers-reduced-motion`. Mavis does not change global native settings. Both settle spatial motion at its destination, including a preference change during playback; opacity may continue fading. A held press therefore retains its final multiplier, immediately. This replaces the previous Web CSS behavior that removed the multiplier entirely. Returning to normal motion does not replay completed motion; the next interaction uses its normal timing.

## One application animation

`createMotionSurface()` from `@getcortexlabs/mavis-core/experimental` declares one surface. Pass it to `MButton` or `MCard` through `motionSurface`. The button explicitly binds its visual root after mount/load. The application never reads `$el`, children, DOM elements or native views.

```vue
<script setup lang="ts">
import { markRaw } from 'vue'
import { createMotionSurface } from '@getcortexlabs/mavis-core/experimental'
import { animateStudioSurface } from './studio-motion'

const surface = markRaw(createMotionSurface())
const run = () => animateStudioSurface(surface)
</script>

<template>
  <m-button :motionSurface="surface" @click="run">Move me</m-button>
</template>
```

The same definition and trigger function run on both platforms:

<<< @/../examples/catalog/shared/studio-motion.ts

`available` is false before mount/load and after unload/unmount. Calling `animate` or `set` then throws a setup error. Each binding is a generation: replacement cancels old playback with `finished: false`; old handles cannot mutate the replacement. Later calls use the new binding. A completed animation resolves `true`; stop, supersession or removal resolves `false`, once, without rejecting for ordinary cancellation. Keep the reference out of deep reactive conversion (`markRaw` in this example). Declare one reference per component.

The experimental subset supports numeric 2D transforms and opacity, numeric keyframes, finite tween/spring timing, `set`, `stop` and `finished`. It does not expose platform objects, arbitrary CSS, layouts, portal surfaces or a stable public animation API. Use this reference for concurrent application motion. Direct transform/opacity writes or CSS animations on a Jolt-owned Web surface violate its ownership contract. A static 2D transform before playback is a baseline; independent CSS `scale`/`translate`/`rotate`, active CSS transitions and `!important` motion properties are unsupported. Leave visual room for scale beyond the layout box.

<a href="/playground/#/checks/motion">Open the shared check screen</a>. “Animate and hold” sets base 1.1, waits one second and starts the same application function; hold the main button during it. The screen also demonstrates theme changes, disable, repeated Reveal and removal during playback.

Declared Button/Card surfaces observe their border-box geometry through Jolt. Responsive size, label/loading text and delayed font metrics keep the pivot centered without remounting, resetting application channels or restarting their clocks. `surface.refresh()` explicitly accepts a supported geometry change; native views retain their fractional pivot through layout. Disposal removes the observer with the presentation. External class/transform ownership changes still require releasing the surface.

## Continuous values and drag

Alpha.4 introduced `motionValue`, `springValue`, `bind` and one-axis `drag` to the same surface, on **Button and Card**. The current Mavis RC.11.1 requires **Jolt 0.1.0-rc.11 or newer**. Reinstall dependencies and rebuild native applications after upgrading from alpha.3.

```ts
const surface = markRaw(createMotionSurface())
let target: MotionValue | undefined
const unsubscribe = surface.onAvailable(() => {
  target = surface.motionValue(1)
  const scale = surface.springValue(target, { stiffness: 160, damping: 18 })
  surface.bind({ scale })
  return () => {
    target = undefined
  }
})
// An application event, not a frame loop:
const enlarge = () => target?.set(1.08)
onBeforeUnmount(unsubscribe)
```

Import `MotionValue` from `@getcortexlabs/mavis-core/experimental`, and `markRaw`/`onBeforeUnmount` from your Vue integration. Bind this reference with `<m-card :motionSurface="surface">`. The recipe runs after mount/load and again after a retained native page loads. Its synchronous resources are disposed when the subscription ends or the presentation unloads. Handles created later also belong to the current presentation. Before availability, resource creation throws.

| Handle   | Supported operations                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------------- |
| Input    | `to(...)`, `get()`, `set(number)`, `disposed`, `dispose()`                                              |
| Follower | `to(...)`, `get()`, `getVelocity()`, `moving`, `paused`, `pause()`, `resume()`, `disposed`, `dispose()` |
| Binding  | `disposed`, `dispose()`                                                                                 |
| Drag     | `dragging`, `pause()`, `resume()`, `cancel()`, `disposed`, `dispose()`                                  |

Spring options are `stiffness`, `damping`, `mass`, `initial`, `restDelta` and `restSpeed`. Translation uses CSS pixels or native DIPs; rotation uses degrees, scale is a multiplier and opacity is unitless. Velocity is in source units per second. Pause retains the follower's position/velocity; resume follows the newest input. Disposing an input disposes its followers and bindings. Disposal is idempotent; other operations on a disposed handle throw, including a saved setter. An old generation cannot affect a new mount.

Each surface owns its Jolt context on Web. Its values, bindings and press use that **same context**; no module-global document or application runtime is shared. Values cannot be bound to another component or used across generations. A follower accepts a live input from its own surface, not another follower. Inputs, followers and mapped values support numeric `.to(input, output, { clamp })`: 2–1024 matching finite stops, strictly increasing or decreasing inputs, clamped by default. Mappings are readonly, can be chained up to 32 derived/follower levels, and dispose with their source. Color/function mappings, springs following a mapping/follower, cross-surface sharing and per-frame subscriptions remain outside this portable subset. Mavis provides no solver or animation scheduler. Jolt sleeps at rest and owns foreground/background and reduced-motion behavior.

`bind` owns base channels; press remains a separate multiplier. A later `animate`, `set` or binding on the same channel takes that channel over. A drag owns translation while input is active. Prefer separate channels for concurrent effects, as in Kinetic: drag owns `x`, one follower owns `scale` plus mapped `y`/`opacity`, and entry owns `rotate`. `drag.cancel()` freezes input/release; `pause()` also disables recognition until `resume()`. Follower pause/resume and terminal disposal are the common native/Web contract; the Web-only `jump`/`stop` controls are not exposed here. Finite playback still has `stop()`.

### Kinetic: one shared recipe

<a href="/playground/#/showcase/kinetic">Open Kinetic</a>. Drag, snap, catch a release, retarget while pressing, then remove the card during motion. Left/Center/Right provide the same destinations without dragging. Genuine taps and keyboard activation remain available; a drag suppresses its follow-on click.

<<< @/../examples/catalog/shared/kinetic-motion.ts

The shared screen imports this function without platform objects or branches. Its Vue state changes on application events, never once per animation frame. Jolt owns each platform's input and release physics; matching destinations does not imply identical trajectories. The Web driver supports one primary pointer and an identity static transform baseline, with no transformed/zoomed ancestors, pinch or nested-scroll handoff. Size and text changes rebase the pivot without discarding these channels. Drag bounds remain application-owned and fixed for each declared drag handle.

## Continuous motion recordings

The Kinetic recordings use actual input on the same shared screen. Native probes separately validate 32 presentation/lifecycle samples per platform; those probe inputs are synthetic.

**NativeScript-Vue · iPhone 17 Pro · iOS 26.2 simulator**

<video controls playsinline preload="none" aria-label="NativeScript-Vue · iPhone 17 Pro · iOS 26.2 simulator" src="/media/kinetic-ios.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>

**NativeScript-Vue · Pixel 7 · Android 16 / API 36 emulator**

<video controls playsinline preload="none" aria-label="NativeScript-Vue · Pixel 7 · Android 16 / API 36 emulator" src="/media/kinetic-android.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>

**Vue Web · Chromium · 390 × 844 CSS pixels**

<video controls playsinline preload="none" aria-label="Vue Web · Chromium · 390 by 844 CSS pixels" src="/media/kinetic-web.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>

## Validation and recordings

Browser tests cover composition, retarget/release continuity, keyboard/pointer input, cancellation, live reduced motion, focus, repeated Reveal and removal. Native checks read model and actual presentation scales on Android/iOS and use the same application function. They include stale handles, replacement/unload, live reduced motion and boundary continuity. These checks do not establish physical-device performance or frame-by-frame velocity equivalence.

The recordings below use actual interactions, original speed and English controls; platform labels distinguish simulator/emulator footage from a browser viewport.

**NativeScript-Vue · iPhone 17 · iOS 26.2 simulator**

<video controls playsinline preload="none" aria-label="NativeScript-Vue · iPhone 17 · iOS 26.2 simulator" src="/media/jolt-shared-ios.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>

**NativeScript-Vue · Pixel 7 · Android 16 / API 36 emulator**

<video controls playsinline preload="none" aria-label="NativeScript-Vue · Pixel 7 · Android 16 / API 36 emulator" src="/media/jolt-shared-android.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>

**Vue Web · Chromium 156 · 390 × 844 CSS pixels**

<video controls playsinline preload="none" aria-label="Vue Web · Chromium 156 · 390 × 844 CSS pixels" src="/media/jolt-shared-web.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>

## Previous recordings

Historical captures from the previous stage, with the Web CSS fallback.

**NativeScript-Vue · iPhone 17 · iOS 26.2 simulator**

<video controls playsinline preload="none" aria-label="NativeScript-Vue · iPhone 17 · iOS 26.2 simulator" src="/media/motion-ios.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>

**NativeScript-Vue · Pixel 7 · Android API 36 emulator**

<video controls playsinline preload="none" aria-label="NativeScript-Vue · Pixel 7 · Android API 36 emulator" src="/media/motion-android.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>

**Vue Web · Chromium 156 · 390 × 844 CSS pixels**

<video controls playsinline preload="none" aria-label="Vue Web · Chromium 156 · 390 × 844 CSS pixels" src="/media/motion-web.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>

## Screen-driven motion

`createMotionScrollSource()` declares a vertical source. Pass it to `<m-screen scroll :motionScroll="source">`, then connect a target after both references become available. `scrollLinked` creates its numeric nodes inside the target's existing Jolt context, so press and scroll share ownership without sharing values across runtimes.

```ts
const source = markRaw(createMotionScrollSource())
const surface = markRaw(createMotionSurface())
const release = source.onAvailable(() =>
  surface.onAvailable(() => {
    const link = surface.scrollLinked(
      source,
      {
        y: [0, 80],
        scale: [1, 0.9],
        opacity: [1, 0.35],
      },
      { range: [0, 240], execution: 'auto' },
    )
    return () => link.dispose()
  }),
)
onBeforeUnmount(release)
```

Offsets are bounded vertical CSS pixels on Web and DIPs on native, excluding elastic overscroll. Ranges increase from a nonnegative start; numeric frames interpolate linearly at evenly spaced stops. The link belongs to **both** the current Screen and target generations. Removing/replacing either disposes it; `scroll=false` makes the source unavailable. Retained native pages reconnect on load; Web KeepAlive deactivation releases its sources and surfaces. No DOM/native node enters shared code.

`link.refresh()` re-reads that connection; `source.refresh()` refreshes every active connection. Screen viewport, immediate content layout, text and font changes refresh automatically. Call refresh explicitly for deep overflow changes that do not resize the observed content, such as absolutely positioned descendants. A later application animation/set/binding takes over only its channels. Reduced motion holds active spatial channels at their final frame while opacity continues following scroll.

On Web, `execution: 'auto'` selects ScrollTimeline when Jolt and the browser can compose the effect there. An active press or another running channel can temporarily select the shared scheduler; `execution: 'scheduler'` forces that fallback. `link.execution` reports `scroll-timeline`, `scheduler`, `native` or `released`; reading it on demand does not subscribe to values or downgrade the effect. Native uses Jolt scroll values and bindings from native scroll events. Neither path adds a Mavis frame scheduler. This is not a promise of compositor execution in every browser or composition.

[Field Guide](../showcase/field-guide) uses the same recipe on Web, iOS and Android. It includes responsive geometry, delayed text/type changes, partial interruption, source/target removal and a short-content case. Horizontal/reversed/RTL normalization, ViewTimeline, pinning, nested-scroll handoff and general-purpose scroll APIs are outside this experiment.

<<< @/../examples/catalog/shared/field-motion.ts

[Motion regions](./motion-regions) describes child scopes, pointer input, entrances and shared identities in Mavis alpha.5, using Jolt RC.7.

## Motion belongs to the theme

`theme.motion` defines `pressScale` (0.97), `pressDuration` (200 ms), `releaseDuration` (450 ms), `releaseBounce` (0.35), `enterDuration` (180 ms), `exitDuration` (120 ms), `enterOffset` (8 layout units), and `ease` (`easeOut`). Durations/offset must be finite and nonnegative; bounce is between 0 and 1; easing accepts `linear`, `easeIn`, `easeOut`, `easeInOut`.

```ts
import { defineTheme, motionRecipe, pressMotion } from '@getcortexlabs/mavis-core'
const calm = defineTheme({ name: 'calm', motion: { enterDuration: 260, enterOffset: 12 } })
const enter = motionRecipe(calm, 'enter') // keyframes + transition
const press = pressMotion(calm.motion)
```

Pass the entrance recipe to your motion surface's animation. Button/Card press and Reveal height use the same theme settings in both renderers. Reduced-motion policy remains with Jolt. The theme describes timing and movement; it does not add a second animation engine.

## Colour and decoration

In alpha.7, Checkbox/Radio paint through a Jolt surface; Web Switch animates its track/thumb. Native Switch retains the system control and state tints while Jolt follows its themed background. `Switch.color` is a thumb tint, not Jolt’s text channel. The recipe follows theme durations, reduced motion and cleanup. Forced colours remain system-owned on Web.

The experimental contract accepts `value.to([0, 1], ["#EFB8CF", "#ADC1FF"])` for `backgroundColor`, `borderColor` and `color` (supported text surfaces only). Portable colours use six- or eight-digit hex; named CSS colours/variables are outside this contract. `borderRadius` and `borderWidth` accept numeric mappings. Disposing a value also releases dependent bindings. See the [Forma recipe](../showcase/forma).

Jolt RC.9 extends native live spring paint to border colour and width, and text colour on supported plain-text surfaces, alongside background and radius. Target and ownership restrictions still apply; see [Jolt native paint support](https://jolt.rafaelaugusto.dev/guide/live-springs#extended-live-paint). Rebuild native apps after upgrading. Mavis delegates these channels to Jolt without a JavaScript spring loop.

## Adding platforms and shared platform differences

See [Add a platform](./adopt-platforms) for the RC.11.1 APIs: `--add-native`/`--add-web`, `MPlatform`, list layout motion, section-relative scroll and navigation transitions.
