---
title: Motion
description: Shared Jolt motion, lifecycle ownership and an experimental application animation on NativeScript and Web.
---

# Motion

Button, interactive Card/ListItem and Reveal execute the same recipes through **Jolt 0.1.0-rc.5** on NativeScript and Web. Existing shared screens keep their props and events. This integration is in the repository for the next Mavis alpha; it is **not in 0.1.0-alpha.3**. Jolt's Web entries and the surface reference below remain experimental.

The Web package now requires Jolt as a peer. A browser-only consumer installs Vue and Jolt, without NativeScript or native SDKs. Mavis imports only `@rafaelaugusto/jolt/web` and `/web/vue`. Native applications must rebuild after upgrading Jolt.

## Component motion

| Phase | Shared definition |
| --- | --- |
| Press | Spring, 200 ms, bounce 0, theme scale multiplier |
| Release/cancel | Spring, 450 ms, bounce 0.35, multiplier 1 |
| Reveal entry | Opacity 0 → 1, y 8 → 0, 180 ms |
| Reveal leave | Opacity → 0, 120 ms |

`theme.motion.pressScale` defaults to `0.97`, accepts a finite number greater than 0 and at most 1, and updates mounted feedback, including a held press. Timing stays fixed in Mavis. Jolt executes both springs; Mavis owns platform input and lifecycle. The Web adapter handles primary pointer, Enter/Space, cancellation, blur, scrolling and hidden documents without synthesizing clicks. Native uses NativeScript touch events. Native Switch labels also consume the press recipe. Other components, including Web Chip and switch/selection indicators, keep their existing motion implementations.

Press owns a multiplicative layer. Application scale **1.1 × press 0.96 = 1.056**; changing the base to **1.2 while held gives 1.152**, then release returns to **1.2**. Disable/loading, unload and unmount remove feedback without restoring a captured application scale. Theme refresh retargets a held press without replacing the application animation.

Reveal keeps content mounted during leave. Leaving controls leave the accessibility/focus order; Web restores the opening element if focus is inside. Native restores a remembered Mavis trigger when it is still loaded and notifies accessibility after entry. Raw native controls are not registered as Mavis triggers; without a remembered trigger Mavis does not invent a focus target. A cancelled leave cannot complete a newer entry, and component disposal cancels work and detaches observers. Layout height is not interpolated; offsets use DIPs on native and CSS pixels on Web.

## Reduced motion

Native follows Jolt configuration (`user` by default); Web follows `prefers-reduced-motion`. Mavis does not change global native settings. Both settle spatial motion at its destination, including a preference change during playback; opacity may continue fading. A held press therefore retains its final multiplier, immediately. This replaces the previous Web CSS behavior that removed the multiplier entirely. Returning to normal motion does not replay completed motion; the next interaction uses its normal timing.

## One application animation

`createMotionSurface()` from `@getcortexlabs/mavis-core/experimental` declares one surface. Pass it to `MButton` through `motionSurface`. The button explicitly binds its visual root after mount/load. The application never reads `$el`, children, DOM elements or native views.

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

The experimental subset supports numeric 2D transforms and opacity, numeric keyframes, finite tween/spring timing, `set`, `stop` and `finished`. It does not expose platform objects, arbitrary CSS, layouts, portal surfaces, drag/snap or a stable public animation API. Use this reference for concurrent application motion. Direct transform/opacity writes or CSS animations on a Jolt-owned Web surface violate its ownership contract. A static 2D transform before playback is a baseline; independent CSS `scale`/`translate`/`rotate`, active CSS transitions and `!important` motion properties are unsupported. Leave visual room for scale beyond the layout box.

<a href="/playground/#/checks/motion">Open the shared check screen</a>. “Animate and hold” sets base 1.1, waits one second and starts the same application function; hold the main button during it. The screen also demonstrates theme changes, disable, repeated Reveal and removal during playback.

The experimental Web surface resolves its transform pivot when the component binds and keeps it fixed for that binding. Use stable surface geometry; remount to choose a new pivot after a layout redesign. Ordinary buttons release their surface after feedback settles and resolve the pivot again on the next interaction.

Geometry rebasing is tracked in [#137](https://github.com/getcortexlabs/mavis-ui/issues/137).

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
