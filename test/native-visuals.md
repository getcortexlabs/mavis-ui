# Native visual and collection validation

These adapters require the Jolt commit pinned by `jolt-candidate.json`. RC.9 from npm does not contain the native retained-collection work. Prepare both installations before building:

```sh
npm ci
node scripts/prepare-jolt-candidate.mjs
cd examples/catalog
npm ci
cd ../..
node scripts/prepare-jolt-candidate.mjs --native
npm run build
```

In an environment with the Android SDK, Xcode and CocoaPods configured, build the opt-in probe:

```sh
cd examples/catalog
ns build android --env.visualCheck --no-hmr
ns build ios --env.visualCheck --emulator --no-hmr
cd ../..
node scripts/check-native-visuals.mjs android emulator-5586
node scripts/check-native-visuals.mjs ios SIMULATOR_UDID
```

Use the identifiers of your own running devices. The runner installs the catalog, launches it and saves `artifacts/visuals/{android,ios}/report.json`. It waits for `done: true` and fails if the probe does not finish or reports an assertion failure. The probe checks native gradient layers, target replacement, formatted text, reduced motion, shimmer/loader layers and circular interaction/geometry where supported, retained scrolling, anchor preservation, header alignment during text reflow, programmatic reorder, remounting, empty-list recovery and refresh cancellation. Its component actions are synthetic; they do not establish OS gesture, physical keyboard or screen-reader coverage.

Manually validate pickup, long press, edge scrolling, native ReorderHandle keyboard/accessibility actions, variable-height rows, empty/short content, rotation, large text, app suspension and navigation. Record Lustre and Current in both languages. Android keeps unsupported loaders and circular visibility static; do not report the iOS backend as Android coverage.

Rebuild without `--env.visualCheck` after validation. Do not publish these local alpha.7-named tarballs or replace the published alpha.7 release. First fix a containing official Jolt RC in manifests/locks, clear the candidate configuration and repeat the affected consumer/native checks.
