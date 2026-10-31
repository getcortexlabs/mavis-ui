# Baseline — 31 October 2026, after #56

Library source: the measurement memo of [#56](https://github.com/getcortexlabs/mavis-ui/issues/56) on top of `4bd54cf`. `android.json`, `ios-simulator.json` and `android-catalog.json` hold the runs after the change; `*-before-56.json` hold the runs of the previous adapters taken the same night on the same targets, and `*-2026-10-30.json` keep the original #26 files. Read the [protocol](../../performance.md) before comparing results.

## Targets

- Android 16 / API 36 arm64 emulator created for this comparison (Pixel 7 profile, 411.43 × 914.29, font scale 1.0, cold boot, no snapshot), Core 9.1.3, runtime 9.1.1, Vue integration 3.1.3, Jolt 0.1.0-rc.1; debug build. The before and after runs alternated on the same boot. A second pair of runs on the same boot drifted upward in every workload, including the unchanged ones, so only the first pair is recorded; see the limits below.
- iPhone 17 simulator, iOS 26.2, 402 × 874, Large text, same dependencies, debug build. Host: Apple M4 Max, arm64 macOS, with other development processes present.

No physical device was available for this comparison; the physical iPhone from the 30 October baseline was not connected.

## Observations

Warm median in milliseconds, excluding the first observation for mounts and navigation. Every update includes two frame callbacks, so values near 33 ms are the measurement floor.

| Workload                    | Android before | Android after | iOS simulator before | iOS simulator after |
| --------------------------- | -------------: | ------------: | -------------------: | ------------------: |
| Four Cards, depth 0         |           33.5 |          33.6 |                 33.3 |                33.3 |
| Four Cards, depth 2         |        1,548.4 |          70.5 |                966.5 |                50.2 |
| Four Cards, depth 4         |              — |         911.1 |                    — |               116.3 |
| Four Cards, depth 6         |              — |             — |                    — |               617.2 |
| 64 Cards, depth 0           |          183.2 |         150.3 |                316.6 |               167.3 |
| Theme change, 32 Cards      |           31.0 |          32.6 |                 50.1 |                33.9 |
| Text/label change, 32 Cards |           53.0 |          34.0 |                 99.8 |                33.9 |
| Loading change, 32 Buttons  |           50.6 |          33.3 |                 83.9 |                33.9 |
| Open full Input reference   |        1,213.9 |         246.4 |              1,364.7 |               613.5 |
| Open Profile                |          231.7 |         213.9 |                581.6 |               547.8 |
| Open Focus                  |          247.5 |         213.8 |                564.8 |               547.4 |
| Bootstrap to frame          |          344.0 |         257.6 |                333.8 |               281.6 |

Depth 4 and 6 were skipped before because depth 2 exceeded the 250 ms exploration cutoff. After the change, Android completes depth 4 (911 ms) and still skips depth 6; the iOS simulator completes depth 6 (617 ms).

The Android complete-catalog diagnostic (`android-catalog.json`) now records **1,811.8 ms** for its first navigation. The same diagnostic with the previous adapters did not finish within a 90-second timeout on this emulator; the 30 October baseline recorded 20,159.8 ms. The iOS simulator diagnostic (`ios-simulator-catalog.json`, with `ios-simulator-catalog-before-56.json` for the previous adapters) went from **7,614.4 ms** to **1,215.0 ms**.

Android's approximate ART allocation delta for four Cards at depth 2 fell from **19.5 MB** to **1.0 MB** per mount; 64 shallow Cards moved from 4.5 MB to 4.1 MB.

## Measurement counts

The Java adapters were instrumented for one run of each version to count real measurements of Mavis layouts (`android-measure-counts-*-56.txt`: real measurements, memo answers, children measured again from a record). Counts are deterministic and do not depend on emulator load:

| Workload (six mounts or the stage's repetitions) |  Before | After |
| ------------------------------------------------ | ------: | ----: |
| Four Cards, depth 0                              |     439 |   212 |
| Four Cards, depth 2                              | 193,980 | 7,508 |
| 64 Cards, depth 0                                |   6,726 | 2,968 |
| Theme, text and loading changes on 32 Cards      |  20,706 | 7,197 |
| Open full Input reference, one navigation        |  46,122 |   158 |
| Open Profile, one navigation                     |   1,258 |    27 |

Core's flex containers measure each child up to three times per pass and the Mavis adapters ran two passes, so every nesting level multiplied the measurements of the leaves below it. The memo answers a repeated request, or an exact request for the size a looser request produced, from the recorded result, which keeps the count proportional to the tree instead of exponential in its depth. A looser request that clamped content wanting more room (`MEASURED_STATE_TOO_SMALL`) is never reused for an exact request, because the exact size would shrink the children; the #21 shrink and #59 overflow fixtures caught the first version of the rule. Depth 2 still measures about 1,250 layouts per mount because a stretched child whose content is narrower than its container is measured once at its content width and once at the stretched width on every level.

## Limits

- Emulator timings drifted upward after about fifteen minutes of repeated runs on one boot; counts were used to confirm the direction of each change. Repeat runs on a fresh boot before reading small differences.
- The Android pair and counts were taken with the memo before its clamp detection was added; the iOS runs include it. On iOS the detection cost nothing measurable in the suite and raised the catalog diagnostic from 631 ms to the recorded 1,215 ms. The final Java adapter passed the six native layout fixtures, and a later Android pair ran on a host with a load average above 20 while another emulator was starting: every workload, including the unchanged ones, took three to ten times longer (the previous adapters skipped depth 2 and needed 14,155.7 ms to open the Input reference, the final adapters 517.5 ms and 738.9 ms). That pair keeps the direction but is not a baseline and stayed outside this folder; repeat it on a quiet host before reading Android differences against `android.json`.
- The memo trusts `requestLayout` to reach every ancestor of a changed view, which Core and Android do. A view whose size changes without a layout request would keep a stale record until the next request; no such case was found in the catalog, the layout fixtures or the Input reference.
- Nothing here measures release builds, physical Android devices, GPU presentation or long sessions.

## Baseline — 30 October 2026 (before #56)

Library source: `34685259f86d5f9cb86db8014371d7cce301ff30`, plus the #26 measurement harness. No production layout optimization is included. JSON files retain samples and cleanup observations, rounded to 0.001 ms; metadata and allocation counts are retained too. Read the [protocol](../../performance.md) before comparing results.

### Targets

- Android 16 / API 36 arm64 emulator, 411.43 × 914.29 logical screen, font scale 1.0. NativeScript Core 9.1.3, runtime 9.1.1, Vue integration 3.1.3, Jolt 0.1.0-rc.1; debug build.
- iPhone 17 simulator, iOS 26.2, 402 × 874, Large text; Core 9.1.3, runtime 9.1.0, same Vue/Jolt versions; debug build.
- Physical iPhone 17 Pro (`iPhone18,1`), iOS 27.2 beta `24B5099f`, 402 × 874 as configured by its owner; same iOS dependencies, debug build. Font category, temperature and power conditions were not instrumented; this is one hardware observation, not a release-device certification.
- Chromium 156.0.8078.4 and Playwright WebKit 27.2, production Web bundle, 390 × 844, CSS motion. Host: Apple M4 Max, arm64 macOS. Simulators share that host. Other development processes were present; results are development baselines, not an isolated lab run. The Android standard and Web standard runs overlapped; repeat serially before treating small cross-run differences as regressions.

No physical Android or low-end device was measured. Native and browser build configurations differ, so these numbers are not a platform ranking.

### Observations

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

### Motion and cleanup

Motion callback median was approximately 16.7 ms on all targets. Native p95 was 18.6 ms on the Android emulator and 16.7 ms on both iOS targets. These callback intervals are not proof of GPU presentation at 60 fps. Web uses CSS rather than Jolt and its press operation times include automation overhead.

Every standard run passed the same checks:

- The 32 captured Card buttons were removed; the pressed Button was also removed with scale restored and no native touch observers remaining.
- Controls captured on each of 18 popped pages had no remaining loaded/connected state or active press observers/DOM animations.
- Three 750 ms idle windows recorded no native layout events or browser DOM mutations/running animations.
- The fixture returned to its original view/DOM count after all navigation cycles.

There is no heap-GC or long-session leak certification in these results. The protocol's relative limits are initial regression alerts with explicit noise allowances; they do not approve the slow native workloads. Fixes must preserve #21 geometry and #22 keyboard/lifecycle behavior and show before/after evidence in #56.
