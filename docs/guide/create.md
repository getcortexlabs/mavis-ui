---
title: Create a project
description: 'Create a Mavis project for the Web, iOS, Android and the Mac with one command.'
---

# Create a project

The creator scaffolds a project for the Web (Vue + Vite or Nuxt SSR/SSG), Native (iOS and Android through NativeScript-Vue) and the Mac, in any combination. Web and Native share Vue screens; a combination with the Mac writes its screens once in `shared/` and generates each target, which is [experimental](./macos-experimental). CLI RC.13 pins **Mavis RC.13** and **Jolt RC.13**, including the shared imports, navigation and example APIs described below.

Start the interactive wizard with either command:

```sh
npm create @getcortexlabs/mavis@latest
# Or:
npx @getcortexlabs/create-mavis@latest
```

::: info CLI RC.13
Any combination of Web, Native and Mac with `--targets`, the [Tasks example](./tasks-example), `--capabilities` and `--familiar` are included in RC.13. `--target` from earlier versions keeps working.
:::

::: info CLI RC.12
The keyboard-driven wizard, npm/pnpm/Yarn selection, basic and directory examples, and portability commands are included in RC.12.
:::

The new wizard uses arrow keys and Enter, option descriptions, name validation and a summary before creation. It asks where the app runs (Web, Native for iOS and Android, Mac, in any combination), the Web host, rendering, example, theme, **npm/pnpm/Yarn** and installation. The invoking package manager is preselected when detected, but you can change it. Instructions, scripts and the README follow your choice. Before the final summary, the wizard checks the selected manager. If it is missing or cannot run, you can choose another, check again, or create without installing while keeping your answers. After changing your shell PATH, restart the creator from that terminal.

Explicit flags are preserved. **Back** revisits an answer; **Change choices** revises the summary; Escape or Ctrl-C cancels. `--dry-run` lists files without writing; `--yes` accepts defaults without installing unless paired with `--install`. Existing directories are never overwritten.

| Option                       | Values                                                                     |
| ---------------------------- | -------------------------------------------------------------------------- |
| `--targets`                  | Any combination of web, native and macos, for example `web,native,macos`   |
| `--target`                   | Earlier names: web, mobile (native), both (web,native), macos (web,macos)  |
| `--web`                      | vite, nuxt                                                                 |
| `--rendering`                | client (Vite), ssr or ssg (Nuxt)                                           |
| `--example`                  | welcome (basic), directory (search, details and editing), tasks (with Mac) |
| `--theme`                    | mavis, midnight                                                            |
| `--package-manager`          | npm, pnpm, yarn                                                            |
| `--install` / `--no-install` | Install with the chosen manager now or later                               |
| `--doctor`                   | Inspect prerequisites from a generated project                             |
| `--capabilities`             | Show what can be created and what is planned; add `--json` for tools       |
| `--familiar`                 | vue, react, angular, svelte, solid, other: advice only, see below          |

## What can be created

`--capabilities` prints the creator's catalog: every combination of targets, its Web hosts and rendering modes, its examples, the pinned versions and the tools a project needs. Each combination says how far it has been taken: **published and validated**, **published, experimental**, or **in the repository** until the next release. The wizard, the flags, `--doctor` and CI all read this one catalog, and the frameworks and hosts that are not built yet come from `targetCapabilities` in Mavis core, each with the issue that tracks it.

```sh
npx @getcortexlabs/create-mavis --capabilities
npx @getcortexlabs/create-mavis --capabilities --json
```

A choice that cannot be created is rejected before anything is written, with the reason, the tracking issue when it is planned, and what is available instead. The creator never swaps a framework, a target or a rendering mode to make a combination fit:

```text
$ create-mavis shop --targets web,macos --web nuxt
With Mac, the Web app uses Vue + Vite. The shared-source compiler does not support Nuxt rendering yet.
Tracked in https://github.com/getcortexlabs/mavis-ui/issues/157.
Available: --web vite, --targets web --web nuxt.
```

`--familiar react` (or angular, svelte, solid) tells the creator what you already know. It prints advice for that background and records it in `mavis.config.json`; Vue still runs the Web and Native apps. `mavis.config.json` keeps the choices apart: `targets` and `apps` (the toolkit, framework, host and rendering of each app), `authoring` (Vue templates or shared TSX), `mode` (`direct` or `portable`) and `execution` (the components themselves, or code generated from the sources), plus the theme, the example and the pins. Configurations from earlier creators are migrated when read, so doctor and the audit keep working on them.

In a shared project, `shared/Welcome.vue` or `shared/Directory.vue` owns the screen, depending on the selected example. `apps/web` and `apps/mobile` provide renderers and app services. Native dependencies stay separate so each renderer loads its own Vue runtime. `mavis.config.json` records choices and versions (schema 2 lists `targets`; schema 1 projects with `target` still work with doctor and the audit); commit the lockfile after installation.

Use **pnpm 10.26+**. Generated `pnpm-workspace.yaml` files configure project boundaries and required build scripts; the hoisted dependency layout supports Vite deduplication, shared imports and NativeScript. Yarn Classic and modern Yarn use `node_modules`; initially empty `yarn.lock` files mark separate projects. In a shared project, npm/pnpm use `<manager> run install:apps`. With Yarn, first run `yarn install` and `yarn --cwd apps/mobile install`; after that, `yarn run install:apps` also works. Commit both lockfiles. Your chosen manager must already be installed; `--no-install` lets you create files and install later.

If modern Yarn reports a recently published dependency as quarantined, retry after its configured minimum package age. The creator declares the starter build scripts without changing the package-age policy.

Node 22.16+ is required. Mobile needs the NativeScript CLI and platform SDKs: macOS/Xcode for iOS, JDK/Android SDK for Android. Doctor reports prerequisites without installing tools. If installation fails, source files remain available for retry.

Current authoring is Vue. React/Next, other frameworks, portable syntax and SDUI remain roadmap work; unsupported options report that boundary instead of generating placeholders. The CLI does not convert React code into Vue.

## Web, Native and Mac together

Without Mac, screens are Vue templates, as above. With Mac, shared screens are TSX (`shared/*.lite.tsx`) and an experimental compiler generates Vue for the Web, Vue for NativeScript and SwiftUI for the Mac from them; the wizard says so before creating files.

| Targets            | Layout                                             |
| ------------------ | -------------------------------------------------- |
| Mac                | `shared/`, `apps/macos`                            |
| Web + Mac          | `shared/`, `apps/web`, `apps/macos`                |
| Native + Mac       | `shared/`, `apps/mobile`, `apps/macos`             |
| Web + Native + Mac | `shared/`, `apps/web`, `apps/mobile`, `apps/macos` |

Root scripts generate first and then run the host: `generate`, `dev:web`, `ios`, `android`, `macos` and `build`. With Mac the Web app is Vue + Vite: Nuxt needs server rendering in the compiler first. The directory example uses Vue routes, so it is available only without Mac; with Mac, `--example tasks` creates the [Tasks example](./tasks-example), a task manager from one shared source. `--doctor` checks Xcode and Swift only when Mac is selected; on Linux and Windows the creator still writes the Mac sources. [What the shared sources can use](./macos-experimental). Existing Vue screens are not converted.

## Shared imports, navigation and source audit

The new wizard offers **Basic project** (`--example welcome`, the default) and **Search, details and editing** (`--example directory`), and includes the choice in its summary. In a combined project, the final instructions point to `shared/Welcome.vue` or `shared/Directory.vue`. Both examples work with npm, pnpm and Yarn; installation, README commands and next steps use the selected manager.

The CLI provides `--check-portability`, `--path`, `--json` and the preview/apply flow `--fix-imports` / `--fix-imports --write`. The normal `--doctor` includes the source audit as well as prerequisite checks. For source development, use matching local Mavis tarballs; generated projects pin the coordinated RC.12.2 release.

Alpha.9 introduced a common `#mavis` import, app-owned navigation, a full `--example directory` and portability diagnostics. The reference covers **Vue + Vite SPA, Nuxt SSR/SSG and NativeScript iOS/Android**. See [Share screens](./sharing) for setup, migration and release availability.

## Adding platforms and shared platform differences

See [Add a platform](./adopt-platforms) for the RC.12 APIs: `--add-native`/`--add-web`, `MPlatform`, list layout motion, section-relative scroll and navigation transitions.
