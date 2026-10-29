# Screen checks

`examples/catalog/shared/pages/ScreenCheck.vue` composes a long Screen with a platform input. The input adapters are catalog fixtures, not a public Mavis input component. NativeScript fields use `flexShrink=0` in the fixture, matching Mavis's natural-height column children. The Android fixture disables the IME's full-screen extract editor so landscape checks measure the field inside the page with a docked keyboard.

## Browser

Build with `npm run docs:build`, then run `npm run test:web`. The Screen cases cover direct routes and fallback navigation, focus after navigation, viewport contraction/rotation, editing and viewport-listener cleanup. Chromium also checks that page scaling preserves the layout height. The fixture is `/playground/#/checks/screen`.

Desktop viewport resizing does not show a real mobile software keyboard. Also check the fixture in a mobile browser: focus “Editar nome”, enter text, save, navigate away/back, and repeat with the browser controls expanded and collapsed. Safari can pan the document while resizing its visual viewport; the focused field and bottom actions must remain reachable without a blank area.

## Native simulators

Use Node 22+, a configured NativeScript environment and an already running simulator. Build the packages at the root, then the test catalog:

```sh
npm run build
cd examples/catalog
ns build android --no-hmr --env.screenCheck
# or, on macOS:
ns build ios --emulator --no-hmr --env.screenCheck
```

From the repository root:

```sh
node scripts/check-native-screen.mjs android ANDROID_SERIAL
# iOS also needs idb to press Home on the selected simulator:
IDB_PATH=/path/to/idb node scripts/check-native-screen.mjs ios IOS_SIMULATOR_UDID
```

Keep the software keyboard enabled and use a portrait phone that permits rotation. The runner installs the app, captures 12 stages and backgrounds/resumes it without terminating the process. It checks safe-area bounds before and after scrolling, reaching the end, field visibility with the software keyboard, navigation away/back, preserved page state, inset cleanup, landscape and return to portrait. Native hosts may restore a focused field's keyboard on resume; the check requires that the field stays visible when they do.

Measurements and screenshots are saved under `artifacts/screen/<capture-name>`. The runner exits unsuccessfully on missing stages, a keyboard that never appears, rejected rotation or failed geometry. The probe and its notification observers are compiled out of normal builds. Run a normal build afterwards to return to the catalog.

The Android host uses `adjustResize`; Screen does not mutate the Activity's window policy. iOS reserves keyboard overlap only within its own ScrollView and removes notification/layout observers on unload. These checks do not audit floating keyboards, physical devices or arbitrary nested vertical scroll containers. Those remain distinct from the one-Screen-per-page contract.
