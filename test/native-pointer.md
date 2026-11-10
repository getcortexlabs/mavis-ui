# Native pointer input

`examples/catalog/src/pointer-check.ts` checks the pointer input of the shared Afterglow recipe on a simulator or an emulator. It opens Afterglow with its diagnostics and reads what `pointerFollow` reports.

```sh
npm run build
cd examples/catalog
ns build android --env.pointerCheck --no-hmr
node ../../scripts/check-native-pointer.mjs android emulator-5586
ns build ios --emulator --env.pointerCheck --no-hmr
node ../../scripts/check-native-pointer.mjs ios <simulator udid>
```

Run the scripts from the repository root if you prefer; they read the app from `examples/catalog/platforms`. Reports go to `artifacts/pointer/<platform>/report.json`. Both targets can run without a window (`emulator -no-window`, `xcrun simctl boot`).

## What it checks

- **Android:** the region has hover input (`available`, `execution: 'hover'`) and rests with `presence` 0. A mouse entering and moving inside the region sets `presence` to 1 and moves `x` inside its range; leaving returns both to rest. A touch on the region is not hover. Removing the card releases the input, restoring it creates one again, and removing the pointer's owner leaves nothing listening.
- **iPhone:** there is no hover, so `available` is false, `execution` is `static` and the values rest; the same removals and restores run without errors.

## Limits

The mouse events are synthetic: the probe builds `MotionEvent`s with the mouse tool type and sends them through the window, the way Jolt's listener receives real ones. That shows the path from platform input to the shared recipe, not a physical mouse, trackpad or pen. An iPad with a pointer is not covered here.
