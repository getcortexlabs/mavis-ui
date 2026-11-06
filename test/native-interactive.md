# Interactive components on NativeScript

Build the catalog with `--env.interactiveCheck`, then run:

```sh
node scripts/check-native-interactive.mjs ios SIMULATOR_UDID
node scripts/check-native-interactive.mjs android EMULATOR_SERIAL
```

The runner installs the debug catalog on the specified device, launches it and reads its
report into `artifacts/interactive/{ios,android}/report.json`. It does not create devices.
The in-app probe mounts all six shared demos, exercises their native controls and checks
canonical state, locale formatting, zoom, collapse, editor persistence and finite geometry.
It reports Vue/runtime errors as failures, including errors during rendering.

The probe invokes the native controls' registered handlers. It verifies device runtime
integration; it is not an OS-level touch, VoiceOver or TalkBack automation. Manual checks
should cover pinch/pan and dismissal, long-press reorder with edge scrolling, swipe cancellation,
orientation changes during dragging, system reduced motion and screen-reader traversal.

Browser tests in `test/browser/interactive.browser.ts` use real pointer and keyboard input,
check canonical values and focus, audit accessible names and check 320/768/1440px layouts.
Nuxt consumer fixtures cover server rendering, hydration and prerendered pages for all six.
