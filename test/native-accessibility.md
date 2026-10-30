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

The runner generates an isolated UI-test project under the ignored artifacts directory. It installs the catalog on the selected simulator and stores the test log and `.xcresult`. Keep the simulator dedicated to this test while it runs. The default run includes independent launches per theme and a repeated-loading sequence that retains the page. Both tests restore VoiceOver when they exit. It waits for automatic reader scrolling before double-tapping controls, and re-reads changed labels instead of treating the last spoken phrase as the current accessible name.

## Review matrix

Repeat both themes with normal and enlarged text. On Android, record and restore `settings get system font_scale`; use `font_scale=2` for the enlarged run. On iOS, record the simulator's content-size setting, use its largest accessibility category and restore it afterwards. Inspect wrapping, clipping, target bounds, focus visibility and access to the bottom controls.

Also exercise the catalog's actual component pages and a complete Showcase flow. Check route entry/back behavior using the consuming router. Physical devices, alternate reader versions, floating keyboards and expanded assistive-technology coverage remain tracked in #23 and #45. These checks are regression coverage, not a WCAG certification.

Run normal native builds and install them again when finished. Uninstall the separate Android test APK if it is no longer needed; it is not part of the Mavis package or the normal catalog.

## Repeated content and first insertion

The default iOS run includes `testRepeatedLoading`, which keeps the page alive across both themes. It verifies navigation, Reveal, loading, access to the replacement status and the controls that follow it. To run only this regression:

```sh
ACCESSIBILITY_REPEAT=1 RUBY=/path/to/ruby node scripts/check-native-accessibility.mjs ios SIMULATOR_UDID repeat-loading
```

[Issue #53](https://github.com/getcortexlabs/mavis-ui/issues/53) traced the blocked second cycle to a detached native label that remained alive. The failure also reproduced in plain UIKit when the old UILabel was deliberately retained, and with actual swipe gestures on a physical iPhone. `MavisLabel.disposeNativeView` now finishes Core's disposal and releases the runtime's reference through `Utils.releaseNativeObject`. It does not run on a retained page's ordinary unload. Native objects must not be used after disposal. There is no forced garbage collection, accessibility-tree replacement or focus notification in this fix.

A separate first-insertion case remains open in [#54](https://github.com/getcortexlabs/mavis-ui/issues/54): the reader can skip the newly inserted offscreen status while still reaching later controls. This also occurred in plain UIKit. Keep its failing reproduction separate from the passing regression:

```sh
ACCESSIBILITY_INSERT=1 RUBY=/path/to/ruby node scripts/check-native-accessibility.mjs ios SIMULATOR_UDID first-status
```

This selects `testInsertedStatus`, checks that the new native static text exists and requires the reader to reach it. It must return a failing exit status while #54 reproduces. Use unique run names so existing `.xcresult` evidence is preserved. No XCTest failure suppression is used.

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

## Removed-text regression — #53

The #53 correction was checked against the same native runtime (9.1.0) and Core (9.1.3) used by the catalog. A Core-only example passed after releasing the removed label, without focus notifications or scroll changes. Full Mavis checks then covered both themes, native route entry/back, Reveal, Slider adjustments, repeated loading and the controls below the replacement status.

On iOS 27.0, the independent and repeated suites passed with Large and Accessibility XXXL text. The enlarged repeated run used a right-swipe to read the replacement status in Midnight; both themes retained access to the bottom controls. On a physical iPhone 17 Pro running iOS 27.2 beta (24B5099f), the full repeated suite passed, followed by the reduced original reproduction using an actual right-swipe to read the replacement status. The phone's existing text setting was kept unchanged. Screenshots show focus remaining on Prepare after completion, before reader traversal advances. This does not establish support for every iOS version or text setting.

The first-insertion regression remains failing under #54. The earlier “no physical hardware” boundary belongs to the initial #20 audit; the physical checks above add only this bounded iOS coverage, not an Android hardware audit or a complete release matrix.
