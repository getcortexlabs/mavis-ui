# Performance measurements

Issue [#26](https://github.com/getcortexlabs/mavis-ui/issues/26) establishes a repeatable workload. It does not certify a frame rate or a maximum supported screen size. Native nesting and the complete catalog need optimization in [#56](https://github.com/getcortexlabs/mavis-ui/issues/56).

## Workload and clocks

`examples/catalog/shared/checks/performance` supplies the same Vue composition to NativeScript and Web. The fixture is included only in a performance build; the ordinary catalog has no performance route or driver.

- Mount four Cards at depths 0, 2, 4 and 6. Each additional depth wraps every Card in one Column and one Row, so depth 2 adds four layout containers per Card. Every Card contains a heading, paragraph and Button. The fixture keeps the available width constant apart from 2-unit padding at each added Column.
- Mount 8, 32 and 64 Cards without additional nesting. Each mount has one initial observation and five further observations, with the previous tree removed first.
- On 32 Cards, switch themes 20 times, alternate short/long paragraphs and button labels 20 times, and toggle Button loading 20 times.
- Send 30 Slider value changes through the renderer's control/event path and assert the resulting shared model. This measures event handling and updating, not finger-to-pixel latency.
- Perform ten Reveal toggles and ten press/release cycles. Native presses call the registered touch observers that invoke Jolt. Web uses real Playwright pointer input because a dispatched event cannot activate CSS `:active`.
- Remove 32 Cards; remove a Button during a press; navigate to Input reference, Profile and Focus six times each and return. Inspect the controls captured before each removal/back operation.
- Observe three 750 ms idle windows: before removal, after removal, and after navigation.

Native clocks use `System.nanoTime` or `CACurrentMediaTime`; Web uses `performance.now`. An update sample starts immediately before the action and ends after Vue's next tick and two animation-frame callbacks. The two callbacks deliberately include scheduling time (usually about 33 ms at 60 Hz). They are **not** GPU presentation timestamps. Native navigation samples also include the router's platform transition; compare them with the corresponding back samples before attributing all elapsed time to Mavis.

`bootstrap-to-frame` starts after importing dependencies and configuring the probe. It measures the fixture shell's application startup through two callbacks, excluding process launch and module loading. Mount samples measure actual component trees. The first route observation includes the route's first import in that process; it is not an OS cold-start benchmark.

`motion-frame-interval` records consecutive callback intervals during the Reveal/press sequence. This is a scheduling observation, not a compositor dropped-frame counter. Web `press-*` samples include Playwright transport, scrolling and pointer positioning and are excluded from timing comparisons.

On Android, `allocations` records approximate deltas of ART's `art.gc.bytes-allocated` outside the timed interval. This includes framework and probe allocations as well as Mavis; it is not retained heap size or allocation-site attribution. The runtime can report allocations in batches. See [Android's runtime-stat documentation](<https://developer.android.com/reference/android/os/Debug#getRuntimeStat(java.lang.String)>). The parameter-snapshot arrays are an investigation target in #56; the probe does not pretend to isolate their individual allocation cost.

Reports inspect native loaded state, touch observers and restored scale, or detached DOM controls and their running animations. Idle checks inspect layout events or DOM mutations/animations and compare tree counts. These checks can catch active resources left by these operations. They do not prove that every JS/native object was garbage-collected, inspect every application listener, or replace a heap profiler. No forced GC is used.

## Run

Use Node 22.18 or newer. Build packages with `npm run build` first. Run one simulator/browser benchmark at a time, without concurrent builds. Keep device, OS, font size, viewport, motion preferences and build configuration unchanged for comparisons. Record temperature/power conditions when collecting release hardware baselines.

From `examples/catalog`:

```sh
ns build android --no-hmr --env.performanceCheck
ns build ios --emulator --no-hmr --env.performanceCheck
```

From the repository root, with `adb` on PATH:

```sh
node scripts/check-native-performance.mjs android ANDROID_SERIAL android-run
node scripts/check-native-performance.mjs ios IOS_SIMULATOR_UDID ios-run
```

For an already configured physical iPhone, build with `ns build ios --for-device --no-hmr --env.performanceCheck`, then use `ios-device` instead of `ios`. The runner uses the signed app in the build's `.xcarchive`; `MAVIS_DEVICE_APP` can select another signed `.app`. It installs and launches only `com.getcortexlabs.mavis.catalog` on the explicitly selected target. It does not change font, orientation, reader settings or other apps. An unlocked device may be required by iOS.

Web, in two terminals:

```sh
VITE_PERFORMANCE_CHECK=true npm run web:build
npm run preview --workspace mavis-catalog-web -- --strictPort
```

```sh
node scripts/check-web-performance.mjs web-run
```

The Web runner uses production bundles, Chromium and WebKit at 390 × 844, and saves browser versions and host CPU/architecture. Native builds in this protocol are debug builds. Results are under `artifacts/performance/RUN/`; runners validate sample counts and cleanup and fail on incomplete runs. Native results are also written incrementally to the app's `Documents/performance-check.json` (Android `files/performance-check.json`).

The complete catalog is a separate diagnostic because a slow navigation can otherwise consume the run timeout. Build native with `--env.performanceCheck=catalog`, or Web with `VITE_PERFORMANCE_CHECK=true VITE_PERFORMANCE_SUITE=catalog`. The same runner then records one catalog navigation. Set `MAVIS_PERFORMANCE_TIMEOUT=45` for a bounded native diagnostic (the default is 180 seconds); a timed-out native run stops only the selected catalog process. A timeout is a failed diagnostic, never a successful sample or a latency value. Rebuild normally and reinstall after testing to remove the probe.

## Limits and regression policy

The exploration guard skips deeper trees once the previous depth's five warm samples have a median above 250 ms. This is a conservative cutoff to avoid repeatedly blocking the UI for seconds; it is **not** an acceptable interaction budget. Skips remain visible in the report. They do not prevent the large, shallow-tree workloads from running.

```sh
node scripts/compare-performance.mjs CURRENT.json
node scripts/compare-performance.mjs CURRENT.json BASELINE.json
```

The comparison requires matching renderer, build, target type, model/OS, viewport/screen, browser version/host and relevant runtime versions. An updated browser or device needs a new baseline. For comparable measured operations, the regression limits are the larger of:

- Warm median: baseline × 1.25 or baseline + 50 ms.
- Sample p95: baseline × 1.50 or baseline + 50 ms.

For motion callback intervals, the absolute allowance is 4 ms instead of 50 ms, with the same relative factors: a shift from a 60 Hz cadence toward 30 Hz should trigger an alert. The 50 ms allowance for complete operations covers scheduler noise and a few callbacks in these short runs. A p95 over five warm mount/navigation samples is their maximum; it is not a population percentile estimate. A first-render sample has no reliable distribution and is reported without a regression gate. Web automation press timings are also informational. A newly skipped workload fails comparison.

Cleanup has no tolerance: captured controls must be detached/unloaded, press observers removed, scale restored, and observed idle work zero. The fixture tree must return to its previous count after navigation. A timing alert should be reproduced on the same target before concluding that library code regressed. These limits detect changes relative to a baseline; passing them does not make an already slow workload acceptable.

Release builds, physical Android, lower-end phones, prolonged memory profiling, GPU frame presentation and thermal/power variation remain release validation work in [#23](https://github.com/getcortexlabs/mavis-ui/issues/23) and [#45](https://github.com/getcortexlabs/mavis-ui/issues/45). Web motion in these measurements is CSS; Jolt Web remains #32.

## Recorded observations

The baseline data and measured limits are recorded alongside this protocol in `performance/baseline`. Values describe the stated workload and targets only. The library's production measurement algorithms are unchanged by #26.
