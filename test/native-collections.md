# Shared navigation and collections verification

From `examples/catalog`, build Android with `ns build android --env.collectionCheck --no-hmr` or iOS with `ns build ios --emulator --env.collectionCheck --no-hmr`. Use a dedicated emulator or simulator. From the repository root, run `node scripts/check-native-collections.mjs android|ios DEVICE`.

The opt-in probe opens the same `CollectionCheck.vue` used by the Nuxt consumer. It checks intrinsic app-bar height, menu selection and disabled actions, popover geometry and retained drafts, localized time input, provisional system time selection and confirmation, bounded recycled cells, logical item state after scrolling and reordering, and app-owned tab navigation. Reports are saved under ignored `artifacts/collection/{android,ios}`. A missing report or any recorded failure makes the runner fail.

The probe invokes handlers on real native controls; it does not establish physical touch, hardware keyboard, screen-reader or device performance behavior. Inspect the screen geometry and exercise the software keyboard and system back action manually as well. The virtual list has fixed row height and its own bounded viewport; arbitrary offscreen editor focus is outside this contract.

Restore a normal catalog build without `--env.collectionCheck` after verification. Normal builds do not include the probe or its report filename.
