# Native Grid regression

After building the library and installing `examples/catalog` dependencies, run the catalog with `ns run ios --env.gridCheck` or `ns run android --env.gridCheck`. This opt-in route is omitted from normal builds.

`NativeGridCheck.vue` records `grid-check.json` in the application's documents directory (`files` on Android). Require `done: true`, fifteen samples and an empty failures array. It measures real native cell positions for fixed/adaptive columns and token gaps, resizes the container, reorders keyed fragments and checks that the same TextField keeps its draft. It also checks localized date drafts, calendar alignment, native timezone formatting, proleptic Gregorian conversion, DST and invalid zones. It uses programmatic editing, not physical keyboard gestures.

Restore the normal catalog without `gridCheck` after validation. When reusing an unchanged NativeScript SDK binary with newly bundled JavaScript, record that distinction; it is runtime validation, not a fresh SDK build.
