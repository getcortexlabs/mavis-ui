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
use Actions → Check library → Run workflow → **Full browser and CLI matrix**.
Cross-engine issues can therefore be caught later than in the normal PR; use full
mode when investigating Safari or Firefox behavior. `npm run test:web` locally still
runs the complete browser suite.

`npm run check` is split in two parallel jobs: `verify` (format, types, unit/SSR)
and `build` (packages, docs and playground, plus release tarballs when a consumer
job needs them). Downstream jobs download that run's build artifact; no consumer
rebuilds the library before installing its tarballs. Nuxt runs SSR and static
generation as two parallel jobs, each with its own consumer install. Browser jobs use
the official Playwright image, pinned to the version in `package.json`, instead of
installing browsers and OS libraries in every job.

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

`Release` (`.github/workflows/release.yml`) publishes the four packages to npm when a
GitHub release is published, the same way Jolt does:

1. Open a `release/x.y.z-rc.n` PR with the version bump in the four packages, the
   exact `@getcortexlabs/mavis-core` pins, the CLI presets, docs and changelog. The
   branch name runs the full matrix. Merge it.
2. Create the release on the merge commit, for example
   `gh release create v0.1.0-rc.13 --target main --prerelease --title "Mavis UI 0.1.0-rc.13" --notes-file notes.md`.
   Mark prereleases as pre-releases; stable releases carry the Fairy Tail name in the
   title and are not pre-releases.
3. The workflow then checks that the tag is on `main` and matches every package
   version, channel and internal pin; runs `npm run check`; packs the tarballs once;
   installs them in clean Web, NativeScript Webpack and NativeScript Vite apps; and
   publishes those exact tarballs in dependency order (core, NativeScript, Web, CLI)
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
`@getcortexlabs/create-mavis`), open npmjs.com → the package → Settings → Trusted
publishing and add GitHub Actions with organization `getcortexlabs`, repository
`mavis-ui`, workflow `release.yml` and environment `npm`. Enable **Allow npm
dist-tag** as well, so the workflow can move `latest` and the channel tags. If a
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

Release/full runs and changes to the creator, compiler checks or shared theme/contracts also validate the packed macOS creator: Linux checks the generated Vue screen in Chromium/WebKit; macos-15 compiles the generated SwiftUI app and an escaped-string fixture. The compiler is installed only in the generated consumer. The native window/counter still require a local interactive check; compilation is not reported as a GUI interaction test. Unrelated docs or component PRs do not add a macOS job.
