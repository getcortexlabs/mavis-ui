# Native paths, depth and shadows

`examples/catalog/src/depth-check.ts` runs the shared depth recipes on a simulator or an emulator. It opens `/checks/depth`, activates the screen's buttons and reads the result from the native views.

```sh
npm run build
cd examples/catalog
ns build android --env.depthCheck --no-hmr
node ../../scripts/check-native-depth.mjs android emulator-5586
ns build ios --emulator --env.depthCheck --no-hmr
node ../../scripts/check-native-depth.mjs ios <simulator udid>
```

Run the scripts from the repository root if you prefer; they read the app from `examples/catalog/platforms`. Reports go to `artifacts/depth/<platform>/report.json`. Both targets can run without a window (`emulator -no-window`, `xcrun simctl boot`).

## What it checks

- **Path:** the surface is inside the path's bounds in flight, ends at the declared point facing the end tangent, keeps its place when a conflicting request is rejected, stays put when seeked to the middle and paused, and returns to rest.
- **Axes:** `rotateX` and `rotateY` reach their angles with the parent box's perspective on the view, replacing one axis keeps the other, and both return to 0.
- **Shadow:** on iOS the card's shadow reaches the theme's larger elevation while the card rises, and returns. On Android `supports('shadow')` is false: the card rises and its shadow stays as the theme drew it.
- **Lifetime:** unmounting with a path in flight leaves no error, and the remounted surface starts at rest.

## Limits

Buttons are activated through their tap events, not through touches the system delivers. Transforms come from the presentation layer on iOS and from the view on Android; the shadow is read from the view's `boxShadow`, the value Jolt writes, not from pixels. Reduced motion, physical devices and screen readers are not covered here.
