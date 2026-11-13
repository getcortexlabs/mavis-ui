# CI coverage

`Check library` cancels obsolete runs on the same PR or branch. Its `plan` job reads
the files the branch changed (`git diff base...head`, so newer commits on `main` that
the branch has not merged do not count) and starts only the jobs that can observe
them. The job summary lists every check and the first file that selected it.

Formatting, types, the unit/SSR suite and the docs build run for every change. The
rest depends on what changed:

| Changed                                                            | Browser                          | Packed consumers | Nuxt | Performance   | CLI installs |
| ------------------------------------------------------------------ | -------------------------------- | ---------------- | ---- | ------------- | ------------ |
| `packages/core`, `packages/web`, dependencies, CI planner/workflow | All Chromium tests, three shards | Yes              | Yes  | Yes           | Yes          |
| `packages/nativescript`                                            | —                                | Yes              | —    | —             | Yes          |
| `packages/create-mavis`                                            | —                                | —                | —    | —             | Yes          |
| `examples/catalog/shared`                                          | All Chromium tests               | Yes              | Yes  | Workload only | —            |
| `examples/catalog-web`                                             | All Chromium tests               | —                | Yes  | Yes           | —            |
| `examples/catalog` (native app)                                    | —                                | Yes              | —    | —             | —            |
| `docs`, README, deploy workflow                                    | Chromium documentation tests     | —                | —    | —             | —            |
| One `test/browser/*.browser.ts` file                               | That file, every engine          | —                | —    | —             | —            |
| Unit/type tests, device protocols, CHANGELOG                       | —                                | —                | —    | —             | —            |

A change to one job's own harness (its scripts, fixtures or Playwright config) runs
only that job. The rules are the `rules` list in `scripts/ci-plan.mjs`; the first
match wins. A path without a rule, an unavailable diff, or an empty diff keeps every
job, and a planner test fails when a tracked file has no rule, so a new folder is
never skipped silently. A changed browser spec runs alone in Chromium, WebKit and (if it is one of
its files) Firefox, because test-only changes usually fix an engine-specific failure.

The five representative CLI cases cover every preset, all three package managers and
both examples:

| Preset                    | Manager | Example   |
| ------------------------- | ------- | --------- |
| Vue + Vite                | npm     | Welcome   |
| Nuxt                      | pnpm    | Directory |
| Vue + Vite + NativeScript | Yarn    | Directory |
| Nuxt + NativeScript       | npm     | Welcome   |
| NativeScript              | Yarn    | Welcome   |

Branches named `release/*` run in full mode: all Chromium and WebKit tests (three
shards each), Firefox motion, every consumer, Nuxt, performance, macOS, and all 30
CLI installs (five presets × three managers × two examples). For any other branch,
use Actions → Check library → Run workflow → **Full browser, CLI and macOS matrix**.
Cross-engine issues can therefore be caught later than in the normal PR; use full
mode when investigating Safari or Firefox behavior. `npm run test:web` locally still
runs the complete browser suite.

`npm run check` is split in two parallel jobs: `verify` (format, types, unit/SSR)
and `build` (packages, docs and playground, plus release tarballs when a consumer
job needs them). Downstream jobs download that run's build artifact; no consumer
rebuilds the library before installing its tarballs. The early Mac source compilation
job builds its own checkout so it can start before the docs and tarballs finish.
Nuxt runs SSR and static
generation as two parallel jobs, each with its own consumer install. Browser jobs use
the official Playwright image, pinned to the version in `package.json`, instead of
installing browsers and OS libraries in every job.

The stable `check` job aggregates every selected job, including each Mac matrix.
Failure, cancellation, missing results, and a selected job being skipped all fail
the gate. Only jobs that the planner did not select may be skipped. Keep `check`
as the required branch-protection check; individual matrix names vary by run mode.

Yarn creator checks use `npmPreapprovedPackages` for only the exact Jolt version
pinned in the root manifest, so a reviewed prerelease can be tested during its
[initial package-age quarantine](https://yarnpkg.com/configuration/yarnrc#npmMinimalAgeGate).
The workflow derives this descriptor for both creation and platform-adoption checks;
it does not change Yarn's hardened mode, other dependency gates or generated projects.

`Deploy site` runs on `main` only when something in the site changed: the docs, the
Web playground and what it imports (`packages/core`, `packages/web`, the shared
screens, the embedded Nuxt fixture). It builds the site and runs only
`playwright.site.config.ts`: homepage, Mavis image, theme, gallery navigation, a live
component, search and mobile layout in English and Portuguese. The same smoke test
runs in PRs. A successful smoke test is required before publishing the Pages
artifact. Run it manually from Actions when needed.

## Releases

`Release` (`.github/workflows/release.yml`) publishes the five packages to npm when a
GitHub release is published, the same way Jolt does:

1. Open a `release/x.y.z-rc.n` PR with the version bump in the five packages, the
   exact `@getcortexlabs/mavis-core` pins, the CLI presets, docs and changelog. The
   branch name runs the full matrix. Merge it.
2. Create the release on the merge commit, for example
   `gh release create v0.1.0-rc.14 --target main --prerelease --title "Mavis UI 0.1.0-rc.14" --notes-file notes.md`.
   Mark prereleases as pre-releases; stable releases carry the Fairy Tail name in the
   title and are not pre-releases.
3. The workflow then checks that the tag is on `main` and matches every package
   version, channel and internal pin; runs `npm run check`; packs the tarballs once;
   installs them in clean Web, NativeScript Webpack and NativeScript Vite apps; and
   publishes those exact tarballs in dependency order (core, NativeScript, Web, compiler, CLI)
   with provenance. It waits until npm serves each version with the same integrity,
   sets the dist-tags, and attaches the tarballs, `manifest.json`, `SHA256SUMS` and
   `registry.json` to the GitHub release.

Prereleases go to their channel (`rc`, `alpha`, `beta`) and also move `latest` while
no stable version exists; `latest` never moves back to an older version. Stable
versions go to `latest` and leave the prerelease channels alone. A version that is
already on npm with the same bytes is only re-tagged, so a failed run can be re-run
(or started with Actions → Release → Run workflow on the tag). When the failure was in
the release tooling itself, fix it on main and run the workflow from main with the `tag`
input: the packages are still built from the tag, and only `scripts/publish-release.mjs`
comes from main. A version that exists
with different bytes stops the release before anything is published.

### npm access (one-time)

The workflow authenticates with [npm trusted publishing](https://docs.npmjs.com/trusted-publishers);
there is no token to store or rotate. For each package
(`@getcortexlabs/mavis-core`, `@getcortexlabs/mavis`, `@getcortexlabs/mavis-web`,
`@getcortexlabs/mavis-compiler`, `@getcortexlabs/create-mavis`), open npmjs.com → the package → Settings → Trusted
publishing and add GitHub Actions with organization `getcortexlabs`, repository
`mavis-ui`, workflow `release.yml` and environment `npm`. Enable **Allow npm
dist-tag** as well, so the workflow can move `latest` and the channel tags. The new `@getcortexlabs/mavis-compiler` must have its own publisher configuration;
the settings of the other four packages do not cover it. For its first release,
finish verification and download the tested `release-packages` artifact. If the
package has not yet been created on npm, publish that exact compiler tarball with
an authorized maintainer account and browser 2FA after core is available. Then add
the publisher settings above and resume `Release` on the same tag. The workflow
checks its integrity and skips the already published tarball before publishing the
creator. Do not build a replacement tarball or change the tag.

If a
token is preferred instead, store a granular npm token as the `NPM_TOKEN` secret of
the `npm` environment; the workflow uses it when it exists.

## Experimental macOS starter

During Mac parity development, validate a correction with an explicit fixture list:

```sh
node scripts/verify-parity.mjs --focus=motionAnchorLife,motionAnchorLifeVue --tests=test/create-mavis-motion.spec.ts
```

This runs formatting, package builds, types, the selected unit files, and the selected
Swift offscreen and Chromium/WebKit scenarios. Omitting `--tests` runs all unit tests.
It skips documentation, tarballs, Directory startup and adoption until the batch is
ready. Unknown fixtures or test files fail before running. Each report records the
commit, fixture list and `scope: focused`; a passing focused round never sets
`fullValidation: true`.

When only the hidden Mac harness changes and JS packages are already built, add
`--offscreen-only` to the focused command to compile Swift and replay just those
fixtures. This diagnostic skips package, type, unit and Web checks and never counts
as full validation.

Run `node scripts/verify-parity.mjs` once the batch is complete, without
`MAVIS_FIXTURES`, for full Web/Swift and delivery validation. NativeScript and visible
Mac interaction remain separate checks; offscreen success does not replace them.

Release/full runs and changes to the creator, compiler checks or shared theme/contracts
also select the Mac checks below. Unrelated documentation and Web component PRs do
not select them. Linux still checks the packed creator with npm, pnpm and Yarn, the
generated Vue screens in Chromium/WebKit, NativeScript bundles and the full portable
Web corpus.

The portable Web corpus runs in three independent `portable-web` shards, each with
a 15-minute job limit. They start after the shared build, without waiting for any
packed creator installs. Every fixture belongs to exactly one shard; each shard
keeps both Chromium and WebKit and every requested reduced-motion replay. It builds
one Vite app and starts each browser once, with no per-fixture install. All three
shards must pass the required check, and each uploads its own progressive report.
CI uses `--fail-fast`: the first failing session ends that shard after saving its
diagnostic. Passing shards still run every selected session. Omit the flag locally
to collect all failures in one diagnostic run.

For a focused hosted investigation, dispatch `Check library` with
`diagnostic_fixtures=treeSelect,treeSelectVue` and optionally `diagnostic_repeats=5`.
This builds the packages and replays only those Web fixtures, keeping input and
error diagnostics. It neither runs nor substitutes the required `check` gate;
the normal PR matrix must still pass. Input tracing is opt-in through
`MAVIS_WEB_DIAGNOSTICS=1` so routine checks do not add layout reads during input.
The npm, pnpm and Yarn creator checks remain in `macos-web`.

To replay one Web shard:

```sh
node scripts/check-portable-conformance.mjs --web --shard 1/3 --fail-fast
```

The hosted parity checks are split so a compiler failure is reported before waiting for
several consumer installs:

| Job                    | Normal PR                                                                                                         | Release branch or manual full run                             | Job limit                           |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------- |
| `portable-web` (Linux) | Complete Chromium and WebKit corpus across three shards                                                           | Same                                                          | 15 min per shard                    |
| `macos-compile`        | Generate and build every SwiftUI fixture and the XCUITest runner; no app launch                                   | Same                                                          | 15 min                              |
| `macos-delivery`       | Four independent packed checks: Welcome, Tasks, Directory startup, Directory adoption with Nuxt SSR/SSG and Swift | Also build Web+Mac, NativeScript+Mac and Web+NativeScript+Mac | 15 min per case                     |
| `macos` UI             | Representative UI smoke, including TSX and Vue                                                                    | Complete corpus split deterministically across eight shards   | 15 min smoke; 30 min per full shard |

`macos-compile` starts after planning and runs alongside the package/docs build.
Packed delivery checks start when that build artifact is available. UI checks wait
for source compilation and the build artifact, but do not wait for packed delivery.
These are per-job limits, not a promise about total time: hosted runner availability
and dependency downloads can add queue or setup time.

The PR smoke deliberately does **not** establish full runtime parity. Every fixture
still compiles, but only the smoke selection is exercised through the real Mac UI.
Use a release branch or the manual full option when full runtime evidence is needed;
all eight shards must pass. Full runs keep successful screen recordings, while PRs
keep failure diagnostics without requesting recordings for every passing session.
No job reuses a previous commit's passing result.

The native runner stops after the first failed test and gives Xcode time to flush
its result bundle before terminating an unresponsive process. A failed UI test
still terminates its application in teardown. Progressive `xcodebuild.log` files
are uploaded even if a bundle could not be finalized. The smoke selection includes
the basic inputs, calendar, motion availability and image ownership scenarios in
both TSX and Vue. Pointer actions keep their enabled/visible checks and subsequent
state assertions; they do not require a matching accessibility hit-test target.

The commands corresponding to those conformance scopes are:

```sh
node scripts/check-portable-conformance.mjs --native --build-only
node scripts/check-portable-conformance.mjs --native --smoke
node scripts/check-portable-conformance.mjs --native --shard 1/8
```

Only the first command avoids launching a Mac app. The last two drive the desktop
and belong on hosted runners or an explicitly available local Mac. Reports and
Xcode result bundles are uploaded separately for compilation and each UI shard;
delivery reports have separate artifacts for each case.

### RC.14 experimental release scope

The RC.14 release explicitly ships the current Mac subset while #338–#354 remain
open. Only `release/0.1.0-rc.14` uses the mandatory Mac UI smoke gate alongside
**all** Swift source compilation, seven packed Mac delivery checks, the complete
portable Web corpus, every browser engine and the 30 creator combinations.
It does not claim that the complete Mac UI corpus passed. Every other release
retains the full eight-shard UI gate; explicitly dispatching `full=true`, including
on the RC.14 branch, also retains all eight shards.

The first full RC.14 run (43404538074) exposed initial chart hover state inherited
from the test cursor, initial Combobox focus differences, lookup of the Command
Palette search field, and Badge size differences (24×22 vs 22×21.4 on the hosted
Mac). These remain visible acceptance evidence for #338–#354, not passing checks.
The release notes and Mac guide disclose the outstanding acceptance. Fixtures and
assertions are retained for subsequent full parity validation.
