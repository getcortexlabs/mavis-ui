---
title: Paths, depth and shadows
description: Move a declared Mavis surface along a curve, rotate it around the X and Y axes under a perspective its parent owns, and animate the theme's shadow where one shadow can move.
---

# Paths, depth and shadows

These experimental additions require **Jolt 0.1.0-rc.15 or later**. They are included in Mavis **0.1.0-rc.14**.

`surface.animate()` takes three more kinds of motion: a path that owns `x` and `y`, `rotateX` and `rotateY`, and the four channels of one shadow. Every request is checked before a renderer replaces the motion that is already running, so a rejected request leaves the surface as it was.

<video controls playsinline preload="none" aria-label="Vue Web · Chromium · 390 by 844 CSS pixels" src="/media/motion-depth-web.mp4" style="width:100%;max-width:390px;border-radius:16px"></video>

Vue Web in Chromium, 390 by 844 CSS pixels, recorded at real speed from the shared check screen.

<div style="display:flex;gap:16px;flex-wrap:wrap">
<video controls playsinline preload="none" aria-label="NativeScript · iPhone simulator · iOS 26.2" src="/media/motion-depth-ios.mp4" style="width:100%;max-width:300px;border-radius:16px"></video>
<video controls playsinline preload="none" aria-label="NativeScript · Android emulator · API 35" src="/media/motion-depth-android.mp4" style="width:100%;max-width:300px;border-radius:16px"></video>
</div>

The same screen on an iPhone simulator (iOS 26.2) and an Android emulator (API 35), in Portuguese. The buttons are activated by the check that reads the native views, not by a finger, and the Android card keeps its static shadow.

## Along a path

`motionPath()` describes one continuous path from lines, quadratic curves and cubic curves. Coordinates are translations from where the surface rests, in CSS pixels on the Web and device-independent pixels on NativeScript.

```ts
import { motionPath } from '@getcortexlabs/mavis-core/experimental'

const route = motionPath(
  { x: 0, y: 0 },
  { to: { x: 88, y: -12 }, control: { x: 36, y: -76 } },
  {
    to: { x: 196, y: 0 },
    control: [
      { x: 128, y: 36 },
      { x: 172, y: -64 },
    ],
  },
)

route.bounds // { left: 0, top: -41.257, right: 196, bottom: 1.55 }
route.end // { x: 196, y: 0, rotate: 69.444 }

surface.animate(
  { path: route, orient: true, opacity: [0.6, 1] },
  { duration: 1400, ease: 'easeInOut' },
)
```

`bounds` is known before anything moves, which is what a layout needs to leave room for the trip. `end` is where the surface rests afterwards and the direction it faces with `orient`.

- A path owns `x` and `y`. A request with a path and either of them is rejected.
- `orient: true` faces the forward tangent, for artwork drawn pointing right, and then owns `rotate` too. Without it, `rotate` stays yours.
- Other channels in the same request keep their own keyframes.
- A path takes between 1 and 64 segments, each with some length, and coordinates within 100000.
- Only descriptors from `motionPath()` are accepted. `surface.set()`, bindings, scroll links and region sequences keep taking numeric channels.
- Under reduced motion the surface goes to `end` at once.

## Around an axis

`rotateX` and `rotateY` join `rotate` in `animate()`, `set()` and `bind()`. The projection belongs to the parent: `MBox :perspective` sets the distance for its direct children.

```vue
<m-box :perspective="640">
  <m-card :motionSurface="panel">…</m-card>
</m-box>
```

```ts
panel.animate({ rotateX: 14, rotateY: -22 }, { type: 'spring', duration: 700, bounce: 0.2 })
panel.animate({ rotateY: 22 }) // rotateX keeps its angle
```

- On the Web the box gets CSS `perspective`, which reaches its direct children. Without a box that declares it, the rotation is drawn flat.
- On NativeScript each view projects around its own centre, so a surface far from the middle of the box does not lean towards a shared vanishing point as it does on the Web. A surface with no box above it uses the platform's default distance.
- Android's camera distance is not the CSS distance. Mavis converts it, so the same number draws the same projection as iOS and the Web. Android also clips a child to its parent's bounds: leave padding around a surface that leans out.
- Keep the perspective box inside a pointer region, not around it. Jolt reads pointer coordinates in an axis-aligned space and rejects a region that is projected.
- On the Web a rotated surface has no 2D layout inverse. Jolt's shared layout and keyed layout reject a surface while it is rotated around X or Y, and they and drag reject descendants of a perspective box.
- `perspective` takes 1 to 100000.

## With a shadow

`shadowOpacity`, `shadowRadius`, `shadowOffsetX` and `shadowOffsetY` animate the one shadow a surface already has. Ask first:

```ts
import { elevationMotion } from '@getcortexlabs/mavis-core/experimental'

function lift(surface: MotionSurface, theme: MavisTheme, raised: boolean) {
  const shadow = surface.supports('shadow')
    ? elevationMotion(theme.elevation[raised ? 'lg' : 'sm'])
    : {}
  return surface.animate({ y: raised ? -8 : 0, ...shadow }, { type: 'spring', duration: 500 })
}
```

`elevationMotion()` reads a theme elevation as those four channels, so the recipe moves between shadows the theme defines. The component keeps owning its shadow: nothing is added, and the hit area does not change.

| Platform | `supports('shadow')`                                | What moves                                     |
| -------- | --------------------------------------------------- | ---------------------------------------------- |
| Web      | no shadow, or one outer `box-shadow` without spread | offset, blur and the colour's alpha            |
| iOS      | one outer `boxShadow` on the view                   | offset, radius and opacity                     |
| Android  | `false`                                             | nothing: the shadow stays as the theme drew it |

Android draws CSS shadows from a cached shape, and `elevation` and `translationZ` are a different model with a light source the system owns. They are not treated as the same thing. Where `supports('shadow')` is false, a request with a shadow channel throws before the running motion is replaced, so a recipe either checks first, as above, or fails where the mistake is.

A card that renders again keeps the shadow your motion left on it. When the card's declared elevation changes, by a prop or a theme, the theme's shadow takes over again.

`shadowColor` exists only on the Web in Jolt and is not part of this contract.

## What stays the same

Paths, axis rotation and shadows compose with the component's press layer and with the rest of a surface's motion. A keyed layout move owns `x` and `y` of the child it moves and ends at 0, so give the surface a keyed parent instead of making the surface itself the keyed child; its translation, rotation and shadow then stay through the move. A new request replaces only the channels it names. Playback pauses, seeks through `progress` and stops as before, and everything is released when the component unmounts or the page unloads.

## Jolt presets

Jolt's `createPreset()` builds the same two-endpoint recipes for Jolt's three adapters. For the default easing, `createPreset('fadeInUp', { distance, duration })` and `motionRecipe(theme, 'enter')` are equal, and a test keeps it that way. Mavis keeps its own recipe because the preset fixes the easing, while a theme chooses `ease`, and because the core package does not depend on Jolt.

## Checked

The shared screen at `/checks/depth` runs the same three recipes in both renderers. Chromium, WebKit and Firefox check the path against its bounds and end pose, the rotation matrix under the parent's perspective, the shadow between the theme's values, a seeked path, replacing one axis, a keyed layout change and a press on top of a lifted card, reduced motion and unmounting mid-flight. A Nuxt consumer checks server rendering, hydration and `KeepAlive`. On an iPhone simulator and an Android emulator a probe reads the same results from the native views; `test/native-depth.md` has the steps and the limits.
