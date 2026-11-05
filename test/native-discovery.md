# Data and discovery verification

Build the catalog in `examples/catalog` with `ns build android --env.discoveryCheck --no-hmr` or `ns build ios --emulator --env.discoveryCheck --no-hmr`. Both use the published Jolt RC.11. Run on a dedicated emulator/simulator, then execute `node scripts/check-native-discovery.mjs android|ios DEVICE` from the repository root.

The opt-in probe mounts the same six demos used by Vue Web: DataTable, Carousel, RangeSlider, Calendar, Rating and TreeView. Thirteen observations check app-owned selection/sorting, logical slide keys and geometry, pan bounds and touch targets, unavailable date intervals, rating selection/clearing, lazy tree expansion and selection. Reports and captures are saved under ignored `artifacts/discovery/{android,ios}`. Missing reports and recorded failures fail the runner.

Handlers execute against actual native controls. These results do not establish physical touch, hardware keyboard or screen-reader behavior. RangeSlider also exposes two labelled number editors for precise and assistive input. Table columns scroll horizontally; the application owns paging and sorting. Inspect the six screens at ordinary and enlarged text sizes before release.

Build the catalog again without `--env.discoveryCheck` to restore normal startup. Normal bundles exclude the probe and its report filename.
