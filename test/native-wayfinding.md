# Native wayfinding checks

Build the catalog with `ns build android --env.wayfindingCheck --no-hmr` or `ns build ios --emulator --env.wayfindingCheck --no-hmr`, then use `node scripts/check-native-wayfinding.mjs android|ios DEVICE_ID` on a dedicated emulator/simulator.

The opt-in screen runs the same six Vue demonstrations used on Web. It exercises native control handlers and checks command filtering/selection, rail and breadcrumb navigation, help presentation, timeline state, chart geometry/selection and textual data. Reports go to `artifacts/wayfinding/{android,ios}/report.json` and include every failure.

These observations exercise real controls but use synthetic handler calls. They do not certify physical touch, keyboard hardware, VoiceOver/TalkBack or sustained chart performance. Review light/dark screenshots and increase system text size separately. Rebuild without `--env.wayfindingCheck` after validation to restore the normal catalog.
