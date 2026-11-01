---
title: Motion
description: How Mavis shares press and Reveal definitions between NativeScript and Web, including timing, composition and reduced motion.
---

# Motion

Press and Reveal now read their states and timing from the same core module. NativeScript executes them through Jolt. Web translates the supported values into CSS while the [Jolt Web integration](https://github.com/getcortexlabs/mavis-ui/issues/32) is pending. This refactor is available in the repository for the next alpha; it is not in `0.1.0-alpha.3`.

Component props, events and shared screens stay the same. A shared definition does not make CSS and Jolt equivalent animation engines.

## Press

`theme.motion.pressScale` is the pressed multiplier, a finite number greater than `0` and at most `1`. The default is `0.97`; `1` keeps the current scale. A theme update changes mounted components. Timing is fixed by Mavis and is not a new theme option.

| State | Jolt on NativeScript | Temporary CSS on Web |
| --- | --- | --- |
| Press | Spring, 200 ms, bounce 0 | 120 ms, ease-out |
| Release or cancel | Spring, 450 ms, bounce 0.35 | 120 ms, ease-out |
| Neutral contribution | Multiplier 1 | Remove the active scale rule |

Button and interactive Card/ListItem use this feedback. Native Switch labels also use the press recipe; the switch thumb itself keeps its platform behavior. The Web switch retains its existing CSS track/thumb feedback.

On native views, press owns a separate multiplicative layer. An application base of `1.1` with a `0.96` press factor displays `1.056`. Disabling, unloading or replacing feedback removes only that layer. Concurrent application scale updates must use Jolt `animate`/`set`; see [native composition](./component-contract#native-press-and-application-motion).

The CSS fallback uses the independent CSS `scale` property and `:active`. It does not provide Jolt layer ownership, spring interruption or application-motion composition. Keyboard activation remains supported, but a browser's `:active` feedback is not a shared pointer/keyboard recognizer.

## Reveal

| Phase | Shared values | Web curve |
| --- | --- | --- |
| Enter | Opacity 0 → 1; vertical offset 8 → 0; 180 ms | ease-out |
| Leave | Opacity → 0; 120 ms | ease-in |

Native uses `JoltTransition`; Web uses Vue Transition and CSS. Enter offsets are DIPs on native and CSS pixels on Web. Layout height is not interpolated. Content stays mounted during leave, then is removed. Focus and accessibility behavior stay in the platform adapters.

## Reduced motion

Both adapters respect their environment's motion preference. Native inherits Jolt's configuration, whose default is `user`; Mavis does not change global Jolt settings. In the current engine, spatial changes settle immediately while opacity can retain timing. A reduced-motion press can therefore still apply its final scale.

Web follows `prefers-reduced-motion`: press scaling and Reveal translation are removed, and these CSS transitions are disabled. These are existing execution differences, not a claim of complete parity. Changes to preferences during all native interactions remain part of the [lifecycle audit](https://github.com/getcortexlabs/mavis-ui/issues/33).

## One definition, separate adapters

The recipes are internal integration helpers in `packages/core/src/motion.ts`. They contain no view access, input handlers, framework imports, timers or spring solver. The native adapter binds gestures and owns Jolt layers; the Web adapter produces CSS variables and lets the browser handle `:active` and transition classes.

<details>
<summary>Read the shared definitions</summary>

<<< @/../packages/core/src/motion.ts

</details>

The existing CSS timing is an explicit fallback in the shared definition. Full Jolt execution on Web belongs to [#32](https://github.com/getcortexlabs/mavis-ui/issues/32). A single application-authored animation on both platforms, with an experimental component surface reference, belongs to [#102](https://github.com/getcortexlabs/mavis-ui/issues/102).

## Interaction recordings

The same check screen runs on all three targets below. Recordings show normal motion, both themes, disabled controls and unmount/remount. The test theme uses 0.90 to make its changed press factor easier to see; the product default remains 0.97. These are simulator/emulator and browser captures, not physical-device footage.

**NativeScript-Vue · iPhone 17 · iOS 26.2 simulator**

<video controls playsinline preload="none" aria-label="NativeScript-Vue · iPhone 17 · iOS 26.2 simulator" src="/media/motion-ios.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>

**NativeScript-Vue · Pixel 7 · Android API 36 emulator**

<video controls playsinline preload="none" aria-label="NativeScript-Vue · Pixel 7 · Android API 36 emulator" src="/media/motion-android.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>

**Vue Web · Chromium 156 · 390 × 844 CSS pixels**

<video controls playsinline preload="none" aria-label="Vue Web · Chromium 156 · 390 × 844 CSS pixels" src="/media/motion-web.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>
