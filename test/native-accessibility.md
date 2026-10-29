# Accessibility checks

The shared `/checks/accessibility` fixture composes all nine components. It includes a named interactive Card, a passive Card with independent controls, hidden decoration, fractional and partial-final-step Sliders, loading/disabled states, Reveal and a second route. The native build flag opens this fixture directly; normal builds open the catalog.

## Web

Run `npm run check`, then `npm run test:web`. The accessibility suite runs axe against the nine component demos and the fixture in both themes, in Chromium and WebKit. It separately checks keyboard focus during loading, restoration after closing Reveal and scrolling a text-only Screen. Existing catalog tests cover Card activation with Enter/Space, Slider keys, routing and responsive layouts.

Axe does not evaluate every contrast pair, touch target, announcement or focus decision. Inspect the final interface with a reader and enlarged text as well.

## Android with TalkBack

Use a dedicated running emulator with Android API 30 or later, TalkBack and a working TTS engine. Enable TalkBack, then set its developer logging to **VERBOSE** to capture actual speech fragments. Do not substitute a UI hierarchy dump for this reader output. Save and restore the emulator's reader settings after the audit.

Build at the root, then in `examples/catalog`:

```sh
npm run build
cd examples/catalog
ns build android --no-hmr --env.accessibilityCheck
```

If a previously built app cannot resolve a new Java class, clean the generated Android project and rebuild. The Mavis Java sources are compiled into the local plugin AAR; do not delete or exclude those sources when copying the project.

From the root, with Node 22+, `adb`, JDK 17 and Android SDK/build-tools 36 installed:

```sh
node scripts/check-native-accessibility.mjs android EMULATOR_SERIAL
```

`ANDROID_HOME`/`ANDROID_SDK_ROOT`, `ANDROID_API` and `ANDROID_BUILD_TOOLS` can select the local SDK. The test APK uses the usual local Android debug keystore and must share the app's debug signing identity. This runner is for debug catalogs, not release-signed apps.

The instrumentation keeps TalkBack enabled, requests accessibility focus and performs native accessibility actions. It checks semantic ranges, increments/decrements, setting progress, names after updates, re-enabling after loading, named Card grouping, disabled adjustments, navigation and Reveal focus. Its service excludes nodes that are not important for accessibility. Speech, measurements and the instrumentation result are saved under `artifacts/accessibility/<run-name>`.

This verifies accessibility actions and actual TalkBack output; it does not reproduce every finger gesture, Braille interaction or hardware keyboard configuration.

## iOS with VoiceOver

The automated reader test requires Xcode 27, the iOS 27 simulator runtime and the `xcodeproj` Ruby gem. Use an English simulator: the fixture has Portuguese names, while the assertions for system traits expect “adjustable” and “dimmed”. It uses `XCUIVoiceOverService` to traverse the real VoiceOver focus order and collect speech. Earlier simulator runtimes do not provide this test API; they can still run the catalog and layout checks.

Build the native catalog with `ns build ios --emulator --no-hmr --env.accessibilityCheck`. From the root:

```sh
RUBY=/path/to/ruby node scripts/check-native-accessibility.mjs ios SIMULATOR_UDID
```

The runner generates an isolated UI-test project under the ignored artifacts directory. It installs the catalog on the selected simulator and stores the test log and `.xcresult`. Keep the simulator dedicated to this test while it runs. The test starts a fresh app for each theme and restores VoiceOver when it exits. It waits for automatic reader scrolling before double-tapping controls, and re-reads changed labels instead of treating the last spoken phrase as the current accessible name.

## Review matrix

Repeat both themes with normal and enlarged text. On Android, record and restore `settings get system font_scale`; use `font_scale=2` for the enlarged run. On iOS, record the simulator's content-size setting, use its largest accessibility category and restore it afterwards. Inspect wrapping, clipping, target bounds, focus visibility and access to the bottom controls.

Also exercise the catalog's actual component pages and a complete Showcase flow. Check route entry/back behavior using the consuming router. Physical devices, alternate reader versions, floating keyboards and expanded assistive-technology coverage remain tracked in #23 and #45. These checks are regression coverage, not a WCAG certification.

Run normal native builds and install them again when finished. Uninstall the separate Android test APK if it is no longer needed; it is not part of the Mavis package or the normal catalog.

## Known repeated-content finding

[Issue #53](https://github.com/getcortexlabs/mavis-ui/issues/53) tracks an iOS 27 VoiceOver case in which forward navigation stops at Prepare after repeating loading and reinserting an offscreen status Text. The cause has not been attributed to Mavis, NativeScript, UIKit or the simulator test API. Independent per-theme checks do not establish that this repeated sequence works.

Keep this reproduction separate and run it with the same accessibility build:

```sh
ACCESSIBILITY_REPEAT=1 RUBY=/path/to/ruby node scripts/check-native-accessibility.mjs ios SIMULATOR_UDID repeat-loading
```

This selects `testRepeatedLoading`, which retains the page across both passes. It reports a failing exit status when the reader cannot advance; the failure is not suppressed or counted as a pass. Use a unique run name so existing `.xcresult` evidence is preserved. Repeat with actual reader gestures on hardware as part of #23.

## Recorded audit — 2026-10-29

| Environment                                                        | Reader and text size                          | Result                                                                                                                                |
| ------------------------------------------------------------------ | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Android API 36 emulator, 411 DIP portrait width                    | TalkBack 16.0.0.738667889; font scale 1 and 2 | 57 semantic/action samples in each run, both themes; actual speech captured.                                                          |
| iPhone simulator, iOS 27.0, 402 × 874 points; Xcode 27.0 (27A266a) | VoiceOver; Large and Accessibility XXXL       | Independent per-theme sequences pass: named Cards, adjustments, navigation, loading, Reveal restoration and disabled controls.        |
| iPhone simulator, iOS 27.0                                         | VoiceOver; repeated loading on the same page  | Forward-navigation failure tracked in #53; excluded from the passing per-theme result.                                                |
| iPhone simulator, iOS 26.2                                         | Ordinary touch, Large                         | Quick button taps and scrolling initiated on Button/Card checked; all 12 Screen keyboard/safe-area/navigation regression stages pass. |
| Chromium and WebKit, Playwright 1.64.1                             | Keyboard, axe 4.14.0, reduced motion          | Component/fixture audits in both themes, loading focus, Reveal restoration, text-only Screen scrolling and press feedback.            |

The initial audit found and fixed stale Android Button descriptions and disabled states, Slider announcements of internal integer indices/percentages, oversized accessibility increments, a skipped partial final step on iOS, duplicate named-Card descendants, Reveal focus restoration and insufficient native track contrast. It also corrected Web loading focus and reduced-motion selector precedence. The enlarged-text visual review moved the fixture's readable text outside its fixed-height decorative Box so the sample itself does not clip essential text.

Evidence is retained under the ignored `artifacts/accessibility/` directory, including reader logs, native bounds, screenshots and XCTest result bundles. Android's final track color was also inspected in the normal Focus showcase in both themes. The iOS Screen regression is under `artifacts/screen/accessibility-regression`. This matrix does not cover physical hardware, every OEM theme, Braille, Switch Control or every browser/screen-reader combination.
