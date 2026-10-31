# Screen checks

`examples/catalog/shared/pages/ScreenCheck.vue` now composes a long Screen with the public `MInput`. The former platform-specific fixture adapters were removed in #28. Its editor remains a native TextField subclass, with an id on the actual editor, so the existing keyboard, navigation and lifecycle probe exercises the consumer component. Android disables the full-screen IME extract editor locally; the host continues to use `adjustResize`.

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

## Keyboard dismissal

`--env.screenCheck=keyboard` opens the same fixture as the initial route without the stage probe, for the gestures the runner cannot drive:

```sh
cd examples/catalog
ns build android --no-hmr --env.screenCheck=keyboard
ns build ios --emulator --no-hmr --env.screenCheck=keyboard
```

With the app open, tap “Editar nome” (the state reads “Editando” and the keyboard is up), then check each of these leaves “Teclado fechado” with the keyboard gone: a tap on a card's text, a drag towards the keyboard, a tap on “Salvar nome” (which must still save the name). Tapping the field itself, or inside it while editing, must keep “Editando”, and so must a drag away from the keyboard, which scrolls the form. On Android, `adb shell dumpsys input_method | grep mInputShown` reports the keyboard; on iOS, `idb ui describe-all` lists the keyboard keys while it is up. The 31 October run of these steps on both simulators is in `artifacts/keyboard`.

Two things seen on the simulators that are not Screen behaviour: on iOS, `idb ui tap` on an element whose frame lies outside the window does nothing, so scroll until the target is visible first; on the API 36 emulator, the first synthetic press (`input tap` or a short `input swipe`) on a field that is not focused gives it focus without opening the keyboard, and the second press opens it. The same happens on the catalog build from before the dismissal, with the Google autofill service on or off, so the fixture focuses the field through “Editar nome” first.

The Android host uses `adjustResize`; Screen does not mutate the Activity's window policy. iOS reserves keyboard overlap only within its own ScrollView and removes notification/layout observers on unload. These checks do not audit floating keyboards, physical devices or arbitrary nested vertical scroll containers. Those remain distinct from the one-Screen-per-page contract.
