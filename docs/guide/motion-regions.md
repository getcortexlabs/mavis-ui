---
title: Motion regions
description: Owned interactions, viewport entrances and shared identities on explicitly declared Mavis surfaces.
---

# Motion regions

These experimental additions require **Jolt 0.1.0-rc.7 or later**. They are included in Mavis **0.1.0-alpha.5**.

`MBox :motionRegion` declares a stable region. Its descendant `MCard` and `MButton` surfaces borrow one Jolt context on Web. Each component retains its press layer; application interactions have their own cleanup. No DOM element, native View, selector or frame loop belongs in the shared recipe.

```vue
<script setup lang="ts">
import { markRaw, onBeforeUnmount } from 'vue'
import {
  createMotionRegion,
  createMotionSurface,
  whenMotionAvailable,
} from '@getcortexlabs/mavis-core/experimental'

const region = markRaw(createMotionRegion())
const card = markRaw(createMotionSurface())
const remove = whenMotionAvailable([region, card], () =>
  card.use((motion) => {
    const pointer = motion.pointerFollow(region, {
      range: { x: [-12, 12], y: [-8, 8] },
    })
    motion.bind({
      x: pointer.x,
      y: pointer.y,
      rotate: pointer.presence.to([0, 1], [0, -1.2]),
    })
  }),
)
onBeforeUnmount(remove)
</script>

<template>
  <m-box :motionRegion="region" padding="lg">
    <m-card :motionSurface="card" interactive accessibilityLabel="Open edition">
      <m-text>A new perspective.</m-text>
    </m-card>
  </m-box>
</template>
```

Declare the region when mounting its Box. Keep the input wrapper separate from the animated target and leave room for its movement. Nested declared regions establish separate contexts: a shared identity or viewport group belongs to one region.

## Interaction ownership

`surface.use(setup)` supplies a child surface. Create both initial work and later event-driven work through that child. Removing the subscription disposes its values, mappings, bindings and controllers while sibling owners and component press continue. A parent value passed to a child's binding is borrowed; removing the child does not dispose that value. Setup is synchronous and rolls back if it fails.

Mount/load creates a presentation. Ref replacement, KeepAlive deactivation and native unload destroy it; activation/load creates a fresh one. Old child handles cannot write to the new presentation. Keep durable application state outside setup and reapply it when the surface becomes available. Native Jolt scopes also recreate their subscriptions after app suspension. `onAvailable` remains supported; `use` is the explicit lifetime for interactions that create work after setup returns.

## Bounded pointer input

`pointerFollow` returns `x`, `y` and `presence`, with `available`, `active` and `execution`. Both renderers delegate hover, geometry, bounds, springs, suspension and live reduced motion to Jolt: its Web runtime in the browser and its native pointer input on NativeScript. Touch and pen contact are not hover, so scrolling, taps and focus stay with the app.

- **`x` and `y`** follow the pointer inside your `range`. With `coordinates: 'pixels'` they are measured from the region's centre: viewport CSS pixels on the Web, the region's local DIPs on NativeScript.
- **`presence`** is 1 while a hovering pointer is inside the region and 0 otherwise: outside, disabled, suspended, and wherever hover does not exist. Map it like any other value, for example `pointer.presence.to([0, 1], [0, -1.2])`.
- **`available`** says whether the mounted region has a hover API: true in browsers, on Android and on iPad, false on an iPhone. On NativeScript it is also false while the input is blocked (disabled, hidden, in the background or with reduced motion), because Jolt detaches its listener then. It does not detect a connected mouse: without one the values simply stay at rest.
- **`execution`** is `hover` while input can arrive and `static` otherwise.

A recipe needs no platform branch: with no hover it holds its resting values. `update({ disabled: true })` returns the controller to rest. The input is released when its scope or region is replaced, on KeepAlive deactivation, when the native view unloads and when the app goes to the background, and attaches once again when it comes back.

**Vue Web · Chromium · 760 × 620 CSS pixels**

<video controls playsinline preload="none" aria-label="Vue Web · Chromium · 760 by 620 CSS pixels" src="/media/pointer-presence-web.mp4" style="width:100%;max-width:760px;border-radius:16px"></video>

Afterglow's card follows the pointer inside the region and leans while `presence` is 1. The dot marks the mouse: the recording has no system cursor, and the mouse is moved by a script.

## Viewport entrances

Call `region.viewportEnter(surfaces, options)` once all surfaces and an optional `MScreen` scroll source are available. The group is an ordered list of 1–64 distinct identities. Options are `frames`, `transition`, `stagger` in milliseconds, `root`, `margin` in CSS pixels/DIPs, `threshold`, `once` and `disabled`. Positive margin expands the observed viewport. Replace the group by disposing its controller and creating another.

Web uses Jolt's IntersectionObserver integration; NativeScript observes scroll/layout events and asks Jolt to play the same recipe. Content is never hidden during SSR or while waiting for observation. No observer means readable static content. Leaving cancels a pending entrance; `once: false` rearms on reentry. Cleanup settles only the controller's remaining channels. This opt-in recipe does not change `MReveal` or its controlled `show`, focus and inert behavior.

## Shared identities

`region.sharedLayout()` owns a transition group. `attach(surface, 'edition')` registers an explicit identity, follows that surface's replacement, and returns a detach function. Call `transition(() => { expanded.value = true })` to capture before the host's synchronous state change. Jolt waits for Vue/native layout; the host still owns state, navigation, focus and dismissal. The returned handle supports cancellation and a `finished` result (`completed`, `cancelled`, or `unavailable`, with a reason).

Use this for static card/text content and decoded images. Web presentation copies are inert and hidden from accessibility. Arbitrary form/media controls, custom elements, Shadow DOM and projective transforms are outside this capture contract; unavailable geometry or content leaves the final application content in place. Native snapshots have their own platform limits. This is not a router, general-purpose rasterizer, keyed-list FLIP API or cross-document transition.

The [Afterglow example](../showcase/afterglow) preserves its actual interactive root while changing content and dimensions, so keyboard focus remains on the real control. Applications replacing focused components must explicitly place focus in the new view.

## Diagnostics

`region.diagnostics({ development: true, identity: 'edition', maxEvents: 80 })` is an opt-in, pull-only developer tool. `snapshot()` identifies the region/session and returns Jolt's numeric target/owner IDs, channels, layers, reasons and resource counts. IDs belong to that diagnostic session, not application data or DOM IDs. `kind: 'rest'` means a retained pose, not an active animation. The event ring is bounded to 1–2000 entries. No form values, elements, native views, frame polling or process-global session are exposed.

Native `execution: 'lifecycle-only'` reports the region's owned resources; it does not claim Web channel telemetry or install Jolt's global native sampling inspector. Dispose diagnostics to stop collection; a detached final snapshot remains readable. Read an active host before and after removing an interaction to compare its baseline. A disposed snapshot describes the end of diagnostic observation, not a guarantee that an application-wide runtime has stopped.

Afterglow's diagnostics are exposed only at `/checks/lifecycles`. The normal showcase contains product controls only.

## Sheets inside animated content

Jolt RC.7 understands the modal top-layer boundary. `MSelect` and `MSheet` can therefore live inside a card with application scale or scroll-linked opacity. Focus, keyboard input, Escape and scroll ownership remain with Mavis. If motion setup fails, Sheet releases its partial motion resources and keeps a usable static dialog. Arbitrary transforms on the actual panel/input space remain unsupported.
