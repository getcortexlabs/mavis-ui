# Layer input and motion acceptance

The `Native Jolt compatibility` workflow runs these checks on the published Jolt RC.17 dependency. Dashboard and preference probes first install the Mavis tarballs produced from the commit; `installed-native.json` records package integrity. The browser job also installs the tarballs and rejects workspace links.

## Screen overlay and Box

Build the native catalog with `--env.touchCheck`, then run `node scripts/check-native-touch.mjs ios|android DEVICE`. The shared `/checks/touch` page contains a full-screen, nested decorative overlay, a replacement layer, an interactive overlay button, and scrollable controls beneath it. iOS uses XCUITest coordinate taps/drags, including a negative control that restores the old parent hit-testing policy and expects the underlying tap to be blocked. Android uses `adb input`. The in-app observer only reports geometry/state. It does not dispatch input or scroll programmatically.

The runner verifies underlying taps before and after replacement, the overlay action, scrolling and a bottom control. It compares fixed, percentage and unsized layer geometry, plus direct Text alignment. Reports, PNG captures and `touch.mp4` are retained in `artifacts/touch/PLATFORM`.

The paired `layers`/`layersVue` portable fixtures check the same fixed/percentage/padding contract on Web and SwiftUI. `test/browser/layout-motion.browser.ts` also checks header subtitles against opaque artwork on all three browser engines, with a negative control that removes the stacking correction.

## Effective reduced motion

Build with `--env.preferenceCheck`, then run `node scripts/check-native-preference.mjs ios|android DEVICE`. This probe invokes native controls and Jolt configuration to interrupt chart/numeric layout updates, repeat mount and KeepAlive activation, restore user policy, and reject duplicate public notifications. It records native geometry and `preference.mp4` in `artifacts/preference/PLATFORM`. These are simulator/emulator lifecycle checks, not physical sensor or system touch acceptance.

`reduced-motion.browser.ts` checks independent regions, changing targets, in-flight updates and lifecycle; recordings are enabled. `preference-race.browser.ts` changes the mocked media query before its notification, then attaches/reactivates actual Jolt sensors and a pointer follower through Mavis. Device-orientation readings are synthetic. It checks resumed pointer motion, observer deduplication and absence of idle frame/timer polling. Chromium, WebKit and Firefox run both suites. Packed Nuxt SSR/static hydration is covered separately by `scripts/check-nuxt-reduced-motion.mjs`.

See [dashboard acceptance](native-dashboard-components.md) for Kanban input methods, bilingual recordings and their limits.
