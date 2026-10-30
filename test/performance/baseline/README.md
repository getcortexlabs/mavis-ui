# Baseline — 30 October 2026

Library source: `34685259f86d5f9cb86db8014371d7cce301ff30`, plus the #26 measurement harness. No production layout optimization is included. JSON files retain samples and cleanup observations, rounded to 0.001 ms; metadata and allocation counts are retained too. Read the [protocol](../../performance.md) before comparing results.

## Targets

- Android 16 / API 36 arm64 emulator, 411.43 × 914.29 logical screen, font scale 1.0. NativeScript Core 9.1.3, runtime 9.1.1, Vue integration 3.1.3, Jolt 0.1.0-rc.1; debug build.
- iPhone 17 simulator, iOS 26.2, 402 × 874, Large text; Core 9.1.3, runtime 9.1.0, same Vue/Jolt versions; debug build.
- Physical iPhone 17 Pro (`iPhone18,1`), iOS 27.2 beta `24B5099f`, 402 × 874 as configured by its owner; same iOS dependencies, debug build. Font category, temperature and power conditions were not instrumented; this is one hardware observation, not a release-device certification.
- Chromium 156.0.8078.4 and Playwright WebKit 27.2, production Web bundle, 390 × 844, CSS motion. Host: Apple M4 Max, arm64 macOS. Simulators share that host. Other development processes were present; results are development baselines, not an isolated lab run. The Android standard and Web standard runs overlapped; repeat serially before treating small cross-run differences as regressions.

No physical Android or low-end device was measured. Native and browser build configurations differ, so these numbers are not a platform ranking.

## Observations

Warm median in milliseconds, excluding the first observation for mounts and navigation. Theme/text/loading/Slider use all repeated samples. Every update includes two frame callbacks.

| Workload                    | Android emulator | iOS simulator | Physical iPhone | Chromium | WebKit |
| --------------------------- | ---------------: | ------------: | --------------: | -------: | -----: |
| Four Cards, depth 0         |             33.1 |          33.4 |            33.3 |     33.3 |     34 |
| Four Cards, depth 2         |          1,533.4 |         800.2 |           633.4 |     33.5 |     33 |
| 64 Cards, depth 0           |            200.0 |         266.1 |           183.5 |     33.3 |     34 |
| Theme change, 32 Cards      |             29.0 |          50.0 |            33.3 |     33.3 |     33 |
| Text/label change, 32 Cards |             54.6 |          83.4 |            66.7 |     33.4 |     33 |
| Loading change, 32 Buttons  |             51.5 |          83.3 |            66.7 |     33.3 |     33 |
| Slider update               |             33.2 |          33.3 |            33.3 |     33.3 |     33 |
| Open full Input reference   |          1,064.1 |       1,113.4 |         1,010.4 |     33.2 |     33 |
| Open Profile                |            230.4 |         580.9 |           593.1 |     32.8 |     33 |

Native transitions contribute roughly 214 ms on Android and 515–531 ms on iOS, based on the corresponding back samples. The full Input reference still costs substantially more than Profile. Web observations near 33 ms mostly reflect the measurement's two-frame floor; they do not mean layout itself took 33 ms.

Depth 2 adds four containers around each Card. All native targets exceeded the 250 ms exploration cutoff, so the final standard runs skipped depths 4 and 6. Web completed both. A preliminary native run with the guard disabled did not finish the depth-4 batch within 180 seconds; that timeout is not a per-mount latency sample.

Android's approximate ART allocation delta rose from a warm median of **0.262 MB** for four shallow Cards to **19.497 MB** at depth 2. The 64-card shallow workload allocated **4.424 MB** per mount. These process-wide allocation deltas identify a costly workload, not the exact share caused by Mavis snapshot arrays.

The isolated Android catalog diagnostic completed in **20,159.8 ms** for its first navigation (`android-catalog.json`). An earlier physical iPhone batch completed six catalog navigations, with a first observation of **4,568.6 ms** and warm median **4,674.3 ms** (`iphone-catalog-batch.json`). The original Android batch that included six catalog visits exhausted its 180-second total timeout; it was split out so the standard sequence could finish. Neither result should be described as an acceptable startup time. Both are covered by [#56](https://github.com/getcortexlabs/mavis-ui/issues/56).

The physical catalog batch predates the suite metadata field and additionally visits `/`; it is supplementary evidence, not the standard comparison baseline. Use `iphone.json` for future standard comparisons.

## Motion and cleanup

Motion callback median was approximately 16.7 ms on all targets. Native p95 was 18.6 ms on the Android emulator and 16.7 ms on both iOS targets. These callback intervals are not proof of GPU presentation at 60 fps. Web uses CSS rather than Jolt and its press operation times include automation overhead.

Every standard run passed the same checks:

- The 32 captured Card buttons were removed; the pressed Button was also removed with scale restored and no native touch observers remaining.
- Controls captured on each of 18 popped pages had no remaining loaded/connected state or active press observers/DOM animations.
- Three 750 ms idle windows recorded no native layout events or browser DOM mutations/running animations.
- The fixture returned to its original view/DOM count after all navigation cycles.

There is no heap-GC or long-session leak certification in these results. The protocol's relative limits are initial regression alerts with explicit noise allowances; they do not approve the slow native workloads. Fixes must preserve #21 geometry and #22 keyboard/lifecycle behavior and show before/after evidence in #56.
