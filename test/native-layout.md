# Layout regression checks

The shared fixture is `examples/catalog/shared/pages/LayoutCheck.vue`. Browser tests and the native probe use `test/layout-contract.ts` to check real view bounds. These are geometry checks, not screenshots with a pixel baseline.

## Browser

```sh
npm ci
npm run docs:build
npx playwright install chromium webkit
npm run test:web
```

The layout case covers 320/390/768/844/1024 px, resize in both directions, long content, doubled text and RTL. A card containing Slider, Button and Reveal checks that removing content releases its space. Captures are in `artifacts/browser`.

## Native simulators

Use Node 22+ and a configured NativeScript environment. From the repository root, build the packages, then build the test catalog:

```sh
npm run build
cd examples/catalog
npm ci
ns build android --no-hmr --env.layoutCheck
# or, on macOS:
ns build ios --emulator --no-hmr --env.layoutCheck
```

With a simulator already running, execute from the repository root:

```sh
node scripts/check-native-layout.mjs android ANDROID_SERIAL android-phone
node scripts/check-native-layout.mjs ios IOS_SIMULATOR_UDID ios-phone
```

The runner installs the built app, opens the fixture and collects eight samples over 16 seconds. The probe expands and contracts content, checks bounds and verifies that natural heights return to their original values. It writes measurements and a screenshot to `artifacts/layout/<capture-name>`. Missing samples and geometry failures exit unsuccessfully. The probe is compiled out of normal builds.

Build with `--env.layoutCheck=native` to open `examples/catalog/src/pages/NativeLayoutCheck.vue` instead. This native-only page places Core `GridLayout` and `StackLayout` views with explicit and content heights, an auto-height Box with a background layer and a fixed Box inside a Column of a Screen without scrolling; the toggle adds a 1200 dp filler so the content overflows. `checkNativeLayout` requires the explicit heights, content heights, the layer filling its Box, column stretching and gaps to hold in every sample, and a Core view with `flexShrink="1"` to keep its height until the bounded Screen overflows (#59). `--env.layoutCheck=native-scroll` runs the same page in a scrolling Screen. The same runner command collects the samples.

Build with `--env.layoutCheck=rotate` to request landscape after expansion and portrait after contraction. Verify that the recorded widths actually change; an OS can reject orientation requests. Run the normal check separately with larger system fonts and a tablet viewport. Restore device settings when finished. These checks exercise simulators, not physical-device performance or accessibility navigation.

## NativeScript adapter maintenance

The adapters were checked against Core 9.1.3. Android's Flexbox caches measurements across percentage LayoutParams changes and holds pre-growth heights. `platforms/android/java/com/mavis/ui/FlexLayout.java` remeasures at the allocated widths and restores the original parameters. The second pass also covers column stretching, which can change a nested row's width. NativeScript builds the Java source into an AAR; generated AARs are ignored.

On iOS, `src/native/flex-layout.ios.ts` updates heights after allocating widths, before final alignment. It uses Core's internal flex measurement hooks: run these native checks when changing the Core version. `label.ios.ts` invalidates intrinsic height after text changes even if the previous flex pass used exact dimensions. `button.ios.ts` synchronizes UIButton's measurement label with its current title before measuring wrapped text.

The Vue registration marks `MavisFlexLayout` as a layout view so removal calls `removeChild`, including its layout bookkeeping. Registering it as a generic view leaves detached children in the measurement list after a Reveal closes.

Core 9.1.3 adds row gaps to a column's main size but not to its gap total on both platforms, so a growth or shrink pass remeasured the column shorter by every gap and then squeezed shrinking children by that amount even without overflow; `flex-layout.ios.ts` restores the gap total before Core's pass, and `FlexLayout.java` measures a single-line column again with its gaps after Core's pass. `src/native/flex-children.ts` gives children that never declared `flexShrink` a value of 0 inside column layouts, when they are registered or when the layout loads; it reads Core's value source because `isSet` ignores a local value equal to the default, such as an explicit `flexShrink="1"`. It runs so Core views follow the Mavis column contract instead of absorbing all overflow. Box uses `MavisBox`: `box.ios.ts` measures an auto-height Box with an unspecified height when the parent only offers an upper bound, and `platforms/android/java/com/mavis/ui/Box.java` does the same for Android. Layout still stretches layers to the Box bounds on both platforms. The Vue components import these platform modules without a file extension; `test/platform-imports.spec.ts` guards that rule because `@nativescript/vite` resolves explicit `.js` paths literally (#58).

The extra native measurement work belongs in the performance review (#26). Unequal shrink distribution still follows each platform's flex implementation. Fixed-height content, explicitly nonshrinking overflow and unbounded percentage heights are not automatically repaired. Safe areas/keyboard (#22), physical devices (#23), general native automation (#24), visual baselines (#25) and full accessibility (#20) remain separate tasks.
