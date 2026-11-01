# Changelog

## Unreleased

### Added

- Dialog with controlled confirmation, destructive tone, processing state, modal focus and Profile discard confirmation on NativeScript and Web.
- Toast with local FIFO queues, four semantic tones, timed/manual dismissal, native Jolt motion and Profile feedback on NativeScript and Web.
- Select with controlled local options, a native Sheet, a Web keyboard listbox, helper/error states and a Profile preference.
- Radio group with controlled typed choices, shared option types, native/Web renderers and an ambience preference in Focus.

- Add `MCheckbox` with controlled checked/mixed states, a shared filter demo and a Library showcase on NativeScript-Vue and Web.

- Add `MSwitch` for controlled boolean preferences on NativeScript-Vue and Web, with labels, supporting text, themed states, a shared demo and Profile settings.

### Fixed

- The native Sheet reserves the handle/header height when measuring its scroll viewport, keeping the last option reachable in long lists.

- On iOS, Text, Button and Input follow the system text size with the Dynamic Type curve of a matching text style instead of NativeScript's font scale table (#72). That table maps the smallest text size to half the size and snaps any other value back to its steps, so Mavis text was much smaller than other apps with a small text size and larger with the accessibility sizes. Headings now grow less than body text, as in the system. Explicit `iosAccessibilityMinFontScale` and `iosAccessibilityMaxFontScale` still limit the result; Android is unchanged.

## 0.1.0-alpha.3 — 2026-10-31

Third experimental release. It adds the Sheet and keyboard dismissal in Screen, makes nested native layouts measure in linear time, and fixes the style patch that reset plain attributes on re-render. Pin exact versions; the API can still change between alpha versions.

### Performance

- The native layout adapters remember the last measurement of each Mavis layout, label and button while nothing in its subtree requests layout, and answer repeated or exact-for-the-same-size requests from that record (#56). Core and the flex adapters measured nested containers again on every pass, so leaves were measured an exponential number of times; the memo keeps that linear. The Java adapter also stops forcing child layout on Mavis containers. Measurements before and after are recorded in `test/performance/baseline`.

### Fixed

- Row, Column, Box, Card and Reveal no longer write padding, radius, width, height and background keys for props that were not given (#65). The style patch of a re-render used to reset a plain attribute such as `paddingTop` or `borderRadius` set on the element, so a status badge lost its pill shape when its status changed; on the Web the host's CSS now keeps applying for the same keys.

### Added

- `MScreen` puts the software keyboard away on a tap outside the editor and, when it scrolls, on a drag towards the keyboard (#61). On NativeScript the page container observes the touches without consuming them, so buttons, cards and sheets keep receiving them; a touch that starts on an editor keeps the keyboard. On the Web the browser already blurs on a tap outside, and Screen adds the drag dismissal. `dismissKeyboard=false` keeps the keyboard, for example in a message composer.
- `MSheet` presents content and actions in a layer above the screen on both renderers, controlled by `v-model:open` and reporting every close with a reason (`button`, `backdrop`, `escape`, `back`, `swipe` or `program`) (#29). On NativeScript the panel is an in-page bottom sheet driven by Jolt inside an `MScreen`, with a drag handle, content or full-height snap, scrim, keyboard following and Android back; `createMavis` accepts `claimSystemBack` so a router such as vue-router-ns hands the back press to an open sheet first. On the Web it is a modal `<dialog>` with contained focus, Escape, scrim click and a CSS entrance that respects reduced motion. The catalog, docs and template types include the new component.

### Tested toolchains

Same as the second alpha, with the API 36 emulator available again for the layout, performance and keyboard checks (a temporary AVD created with the Google Play arm64 image) and the iOS 26.2 simulator for everything; no physical device this time. Jolt stays at 0.1.0-rc.1 as the peer dependency; the Sheet uses its bottom sheet, present since beta.17. With vue-router-ns, pass `claimSystemBack` to `createMavis` so Android back reaches an open sheet first.

## 0.1.0-alpha.2 — 2026-10-31

Second experimental release. It adds icons and system appearance and fixes the two issues reported by the first app built on the alpha. Pin exact versions; the API can still change between alpha versions.

### Added

- `MButton` takes `icon` and `trailingIcon`, rendered from the bundled Lucide font beside the text in both renderers; an icon-only button requires `accessibilityLabel`. `MInput` draws `icon` and `trailingIcon` inside the editor box, muted or `danger` with an error, with the editor padding adjusted (#60).
- `MIcon` renders the bundled Lucide icon font on NativeScript and Web, with `name`, `size` (sm/md/lg or a number), theme `tone` and an optional accessible `label`; without a label the icon is decorative (#30). The native package ships `fonts/lucide.ttf` to copy into the app's `fonts` folder, the Web stylesheet loads `fonts/lucide.woff2`, and `IconName` lists the 1998 canonical names of Lucide 1.65.0 (ISC). The catalog, docs and template types include the new component.
- `createMavis({ theme, darkTheme, appearance })` follows the device appearance by default on NativeScript and Web, with `appearance` and `setAppearance` on the theme context for explicit `light`/`dark` overrides or returning to `system` (#27). `setTheme` keeps working and pins the chosen theme. Listeners are released when the app unmounts; server rendering uses `theme` and is documented in the themes guide. The catalog apps follow the device and their switch cycles through the opposite appearance and back to the system.

### Fixed

- Platform-specific modules are imported without a file extension, so `@nativescript/vite` builds bundle the Mavis iOS and Android files instead of the shared Core fallbacks (#58). The package consumer checks now build a Vite app for both platforms.
- NativeScript Core views keep their requested or content height inside a Column on iOS and Android, even when the content exceeds a Screen without scrolling (#59). Children that set `flexShrink` themselves keep that value and shrink only on real overflow: the iOS and Android adapters now keep row gaps through Core's growth and shrink passes, which previously measured a Column shorter by the sum of its gaps.
- A Box without `height` measures its tallest layer instead of filling the available height; explicit heights and Row stretching still fill every layer (#59). Box now has its own native class on both platforms, including a Java source for Android.

### Documentation

- `@nativescript/vite` compiles hyphenated tags as native elements; write `MButton` and `MRow` there.

### Tested toolchains

Same as the first alpha, plus `@nativescript/vite` 8.0.21 with Vite 8.3.5 in the package consumer checks and a physical ASUS Z017DC on Android 8.0 for the appearance and icon checks; the API 36 emulator was unavailable for this release. The custom icon font requires copying `fonts/lucide.ttf` into the app's `fonts` folder.

## 0.1.0-alpha.1 — 2026-10-30

First experimental release for testing in real apps. API and behavior may change between alpha versions; pin exact versions and review updates before upgrading.

### Packages

- `@getcortexlabs/mavis`: NativeScript renderer, with Vue components under `/vue`.
- `@getcortexlabs/mavis-core`: shared themes, layout values and component contracts; optional Vue context under `/vue`.
- `@getcortexlabs/mavis-web`: Vue Web renderer, with required `style.css` import.

All three use `0.1.0-alpha.1`, the npm `alpha` tag and the MIT license. The earlier `@mavis-ui/*` names were local development names and were never published.

### Included

Screen, Row, Column, Box, Card, Text, Button, Input, Slider and Reveal; Mavis and Midnight themes; shared Vue props and global template types. The catalog and Showcase demonstrate shared screens between NativeScript and Web. Jolt is a required native peer; Web motion uses CSS while the Jolt Web backend is pending.

The native package includes Android Java sources and Gradle configuration, along with platform-specific JavaScript. No generated AAR, sample app, website artwork or diagnostic probe is included. Web styles include an explicit TypeScript declaration for strict side-effect imports.

### Tested toolchains

| Consumer | Versions |
| --- | --- |
| Shared tooling | Node 22.23.3, TypeScript 6.0.3, vue-tsc 3.3.13 |
| NativeScript Vue | Core 9.1.3, NativeScript-Vue 3.1.3, Jolt 0.1.0-rc.1, webpack 5.0.39 |
| Native runtimes | Android 9.1.1 / API 36 emulator; iOS 9.1.0 / iOS 26.2 simulator |
| Vue Web | Vue 3.5.42, Vite 6.4.5; Chromium and WebKit |

These are tested configurations, not a guarantee for every version allowed by peer ranges. Earlier component checks also exercised a physical iPhone 17 Pro on iOS 27.2 beta; the release packaging checks use simulators. See [consumer checks](test/package-consumers.md) and the existing native test guides for the validation boundaries.

### Known limitations

- **Native performance:** deep Row/Column trees and catalog startup have measured high costs. Keep initial compositions shallow. Optimization is tracked in [#56](https://github.com/getcortexlabs/mavis-ui/issues/56); this release does not fix it.
- **VoiceOver:** a newly inserted offscreen status can be skipped on the first cycle, although later controls remain reachable ([#54](https://github.com/getcortexlabs/mavis-ui/issues/54)). The earlier repeated-loading navigation block was fixed in #53.
- **Devices and input:** physical Android, low-end hardware, release-mode performance, CJK IMEs and floating keyboards are not fully validated ([#23](https://github.com/getcortexlabs/mavis-ui/issues/23)). Input remains experimental.
- **Screen:** one Screen per native page; Android hosts must use `adjustResize`. iOS keyboard adjustment covers docked keyboards. Arbitrary nested vertical scrolling is not supported. Web hosts using `viewport-fit=cover` own their CSS safe-area spacing.
- **Web motion:** no Jolt browser backend yet ([#32](https://github.com/getcortexlabs/mavis-ui/issues/32)). Native and Web share the component contract, not pixel-identical rendering or platform services.

Website artwork has separate attribution and unresolved permissions recorded in [ASSETS.md](ASSETS.md) and [#44](https://github.com/getcortexlabs/mavis-ui/issues/44). It is excluded from all npm packages.
