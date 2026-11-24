---
title: Create a project
description: 'Create a Mavis project for Web, iOS, Android, Mac and Windows with one command.'
---

# Create a project

The creator scaffolds Vue projects for Web (Vite/Nuxt), iOS/Android and NativeScript desktop: AppKit on Mac and XAML on Windows. React, Angular, Svelte, Solid and JS/TS have direct iOS/Android starters. See the [desktop guide](./native-desktop) for the experimental component subset and requirements.

::: info CLI RC.15
NativeScript Mac/Windows and direct mobile framework starters are available in RC.15. Desktop supports twelve components; direct React, Angular, Svelte, Solid and JS/TS starters support six foundation components. `--capabilities --json` reports each preset and its coverage.
:::

Start the interactive wizard with either command:

```sh
npm create @getcortexlabs/mavis@latest
# Or:
npx @getcortexlabs/create-mavis@latest
```

::: info CLI RC.12
The keyboard-driven wizard, npm/pnpm/Yarn selection, basic and directory examples, and portability commands are included in RC.12.
:::

The new wizard uses arrow keys and Enter, option descriptions, name validation and a summary before creation. It asks where the app runs (Web, Native for iOS and Android, Mac and Windows, in any supported combination), the Web host, rendering, example, theme, **npm/pnpm/Yarn** and installation. The invoking package manager is preselected when detected, but you can change it. Instructions, scripts and the README follow your choice. Before the final summary, the wizard checks the selected manager. If it is missing or cannot run, you can choose another, check again, or create without installing while keeping your answers. After changing your shell PATH, restart the creator from that terminal.

Explicit flags are preserved. **Back** revisits an answer; **Change choices** revises the summary; Escape or Ctrl-C cancels. `--dry-run` lists files without writing; `--yes` accepts defaults without installing unless paired with `--install`. Existing directories are never overwritten.

| Option                          | Values                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------ |
| `--targets`                     | web, native, macos, windows; desktop uses Vue                                  |
| `--target`                      | Earlier names: web, mobile (native), both (web,native), macos (web,macos)      |
| `--web`                         | vite, nuxt                                                                     |
| `--rendering`                   | client (Vite), ssr or ssg (Nuxt)                                               |
| `--example`                     | welcome (basic), directory (search, details and editing) |
| `--theme`                       | mavis, midnight                                                                |
| `--package-manager`             | npm, pnpm, yarn                                                                |
| `--install` / `--no-install`    | Install with the chosen manager now or later                                   |
| `--doctor`                      | Inspect prerequisites from a generated project                                 |
| `--capabilities`                | Show what can be created and what is planned; add `--json` for tools           |
| `--familiar`                    | vue, react, angular, svelte, solid, other: advice only, see below              |
| `--macos-runtime`               | appkit                                                      |
| `--framework`                   | vue; plain, react, angular, svelte, solid (native only)                        |
| `--add-macos` / `--add-windows` | Preview desktop adoption; `--write` applies                                    |

## What can be created

`--capabilities` prints the creator's catalog: every combination of targets, its Web hosts and rendering modes, its examples, the pinned versions and the tools a project needs. Each combination says how far it has been taken: **published and validated**, **published, experimental**, or **in the repository** until the next release. The wizard, the flags, `--doctor` and CI all read this one catalog, and the frameworks and hosts that are not built yet come from `targetCapabilities` in Mavis core, each with the issue that tracks it.

```sh
npx @getcortexlabs/create-mavis --capabilities
npx @getcortexlabs/create-mavis --capabilities --json
```

A choice that cannot be created is rejected before anything is written, with the reason, the tracking issue when it is planned, and what is available instead. The creator never swaps a framework, a target or a rendering mode to make a combination fit:

```text
$ create-mavis shop --targets web,macos --web vite --rendering ssr
Choose client rendering for Vite or ssr/ssg for Nuxt.
Available: --rendering client.
```

`mavis.config.json` records the hosts, framework, rendering mode, theme and package versions.

In a shared project, `shared/Welcome.vue` or `shared/Directory.vue` owns the screen, depending on the selected example. `apps/web` and `apps/mobile` provide renderers and app services. Native dependencies stay separate so each renderer loads its own Vue runtime. `mavis.config.json` records choices and versions (schema 2 lists `targets`; schema 1 projects with `target` still work with doctor and the audit); commit the lockfile after installation.

Use **pnpm 10.26+**. Generated `pnpm-workspace.yaml` files configure project boundaries and required build scripts; the hoisted dependency layout supports Vite deduplication, shared imports and NativeScript. Yarn Classic and modern Yarn use `node_modules`; initially empty `yarn.lock` files mark separate projects. In a shared project, npm/pnpm use `<manager> run install:apps`. With Yarn, first run `yarn install` and `yarn --cwd apps/mobile install`; after that, `yarn run install:apps` also works. Commit both lockfiles. Your chosen manager must already be installed; `--no-install` lets you create files and install later.

If modern Yarn reports a recently published dependency as quarantined, retry after its configured minimum package age. The creator declares the starter build scripts without changing the package-age policy.

Use Node 22.23.3+ for the new desktop and direct framework starters. Mobile needs the NativeScript CLI and platform SDKs: macOS/Xcode for iOS, JDK/Android SDK for Android. Doctor reports prerequisites without installing tools. If installation fails, source files remain available for retry.

Web and desktop use Vue. React/Angular/Svelte/Solid/JS/TS starters support the six direct native foundation components on iOS/Android. React Web, Next and SDUI remain roadmap work. The CLI does not convert React code into Vue.

## Shared imports, navigation and source audit

The new wizard offers **Basic project** (`--example welcome`, the default) and **Search, details and editing** (`--example directory`), and includes the choice in its summary. In a combined project, the final instructions point to `shared/Welcome.vue` or `shared/Directory.vue`. Both examples work with npm, pnpm and Yarn; installation, README commands and next steps use the selected manager.

The CLI provides `--check-portability`, `--path`, `--json` and the preview/apply flow `--fix-imports` / `--fix-imports --write`. The normal `--doctor` includes the source audit as well as prerequisite checks. For source development, use matching local Mavis tarballs; generated projects pin the versions reported by `--capabilities`.

Alpha.9 introduced a common `#mavis` import, app-owned navigation, a full `--example directory` and portability diagnostics. The reference covers **Vue + Vite SPA, Nuxt SSR/SSG and NativeScript iOS/Android**. See [Share screens](./sharing) for setup, migration and release availability.

## Adding platforms and shared platform differences

See [Add a platform](./adopt-platforms) for experimental `--add-macos` and the published APIs: `--add-native`/`--add-web`, `MPlatform`, list layout motion, section-relative scroll and navigation transitions.
