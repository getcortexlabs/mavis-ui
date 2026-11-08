# CI coverage

`Check library` cancels obsolete runs on the same PR or branch. Its planner prints
the selected mode in the job summary. Unknown paths or an unavailable Git diff
keep the runtime checks enabled.

| Check                                         | Normal PR / main push                         | Documentation only           | Release PR / manual full                                   |
| --------------------------------------------- | --------------------------------------------- | ---------------------------- | ---------------------------------------------------------- |
| Formatting, types, unit/SSR tests, docs build | All                                           | All                          | All                                                        |
| Browser behavior                              | All Chromium tests, two shards                | Chromium documentation tests | All Chromium/WebKit tests, two shards each; Firefox motion |
| Packed Web / NativeScript / Nuxt consumers    | Yes                                           | No                           | Yes                                                        |
| CLI installs                                  | Five representative cases                     | No                           | All 30 cases                                               |
| Performance                                   | Core/Web, catalog, dependencies or CI changes | No                           | Yes                                                        |

The five CLI cases cover every preset, all three package managers and both examples:

| Preset                    | Manager | Example   |
| ------------------------- | ------- | --------- |
| Vue + Vite                | npm     | Welcome   |
| Nuxt                      | pnpm    | Directory |
| Vue + Vite + NativeScript | Yarn    | Directory |
| Nuxt + NativeScript       | npm     | Welcome   |
| NativeScript              | Yarn    | Welcome   |

Generator contract tests still run on every PR. Full real installation coverage
(five presets × three managers × two examples), plus all browser engines, runs
automatically for branches named `release/*`. For any other branch, use Actions →
Check library → Run workflow → **Full browser and CLI matrix**. Cross-engine issues
can therefore be caught later than in the normal PR; use full mode before release
and when investigating Safari/Firefox behavior. `npm run test:web` locally still
runs the complete browser suite.

Yarn creator checks use `npmPreapprovedPackages` for only the exact Jolt version
pinned in the root manifest, so a reviewed prerelease can be tested during its
[initial package-age quarantine](https://yarnpkg.com/configuration/yarnrc#npmMinimalAgeGate).
The workflow derives this descriptor for both creation and platform-adoption checks;
it does not change Yarn's hardened mode, other dependency gates or generated projects.

Packages, docs, playground and release tarballs are built once. Downstream jobs
download that run's artifact; no consumer rebuilds the library before installing
its tarballs. Browser jobs use the official Playwright image, pinned to the version
in `package.json`, instead of installing browsers and OS libraries in every job.

`Deploy site` builds the site and runs only `playwright.site.config.ts`: homepage,
Mavis image, theme, gallery navigation, a live component, search and mobile layout
in English and Portuguese. The same smoke test runs in PRs. Library regressions
belong to `Check library`; deploy does not repeat that whole suite. Traces and
screenshots are retained on failure. A successful smoke test is required before
uploading or publishing the Pages artifact.

## Experimental macOS starter

Release/full runs and changes to the creator, compiler checks or shared theme/contracts also validate the packed macOS creator: Linux checks the generated Vue screen in Chromium/WebKit; macos-15 compiles the generated SwiftUI app and an escaped-string fixture. The compiler is installed only in the generated consumer. The native window/counter still require a local interactive check; compilation is not reported as a GUI interaction test. Unrelated docs or component PRs do not add a macOS job.
