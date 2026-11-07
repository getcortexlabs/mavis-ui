# Advanced component validation

The six advanced components share the same Vue demos across Web and NativeScript:
TreeSelect, Masonry, Heatmap, ImageCropper, Scheduler and NotificationCenter.

- `npm test` checks shared geometry, controlled updates, source-pixel cropping, timezone gaps/repeated hours and SSR output.
- `npm run typecheck` includes their strict shared Vue templates and public contracts.
- `npx playwright test test/browser/advanced-components.browser.ts test/browser/docs-navigation.browser.ts` checks both engines configured in the project: real controls, cancellation, retained drafts, responsive bounds, reduced motion, axe and docs release labels. Exported image pixels are compared after all four quarter rotations.
- The packed Nuxt consumer includes `/advanced` and prerendered `/advanced-static`; existing Nuxt checks run `checkNuxtAdvanced` for SSR, hydration, controlled updates and image export in Chromium/WebKit.

For native checks, build the catalog with `ns build android --no-hmr --env.advancedCheck` and `ns build ios --emulator --no-hmr --env.advancedCheck`. With a dedicated device already booted, run `node scripts/check-native-advanced.mjs android DEVICE_SERIAL` or `node scripts/check-native-advanced.mjs ios SIMULATOR_UDID` from the repository root. The runner installs and launches the catalog on that device. It requires Python 3 with Pillow for exported-pixel comparisons.

The native probe exercises all six components through real NativeScript views and their event handlers, native timezone gap/repeated-hour resolution, actual PNG export/decoding/disposal, and all eight EXIF orientations (including mirrored sources). Reports and images are saved to `artifacts/advanced/{android,ios}`. The four-quadrant fixtures are synthetic, generated with Pillow, and have no external image dependency.

These probes are not a VoiceOver/TalkBack audit or physical touch-gesture test. Browser pointer/keyboard tests and native explicit action alternatives are covered; physical-device gestures and assistive-technology exploration remain manual checks. No screenshot baselines or full cross-platform visual-parity claim are made.
