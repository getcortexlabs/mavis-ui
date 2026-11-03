---
title: Create a project
description: "Create a Mavis project with Vue, Nuxt or NativeScript."
---

# Create a project

The creator scaffolds Vue + Vite, Nuxt SSR/SSG, NativeScript-Vue, or mobile + Web with a shared screen. Templates pin published **Mavis alpha.8** and **Jolt RC.10**, independently of newer source APIs.

Start the interactive wizard with either command:

```sh
npm create @getcortexlabs/mavis@latest
# Or:
npx @getcortexlabs/create-mavis@latest
```

::: info Next CLI release
The updated wizard and package-manager selection are in repository source and will ship in the next release. The published alpha.8 creator still uses the previous npm-only wizard.
:::

The new wizard uses arrow keys and Enter, option descriptions, name validation and a summary before creation. It asks for target, Web host, rendering, theme, **npm/pnpm/Yarn** and installation. The invoking package manager is preselected when detected, but you can change it. Instructions, scripts and the README follow your choice.

Explicit flags are preserved. **Back** revisits an answer; **Change choices** revises the summary; Escape or Ctrl-C cancels. `--dry-run` lists files without writing; `--yes` accepts defaults without installing unless paired with `--install`. Existing directories are never overwritten.

| Option | Values |
| --- | --- |
| `--target` | web, mobile, both |
| `--web` | vite, nuxt |
| `--rendering` | client (Vite), ssr or ssg (Nuxt) |
| `--theme` | mavis, midnight |
| `--package-manager` | npm, pnpm, yarn |
| `--install` / `--no-install` | Install with the chosen manager now or later |
| `--doctor` | Inspect prerequisites from a generated project |

In a shared project, `shared/Welcome.vue` owns the screen. `apps/web` and `apps/mobile` provide renderers and app services. Native dependencies stay separate so each renderer loads its own Vue runtime. `mavis.config.json` records choices and versions; commit the lockfile after installation.

Use **pnpm 10.26+**. Generated `pnpm-workspace.yaml` files configure project boundaries and required build scripts; the hoisted dependency layout supports Vite deduplication, shared imports and NativeScript. Yarn Classic and modern Yarn use `node_modules`; initially empty `yarn.lock` files mark separate projects. In a shared project, npm/pnpm use `<manager> run install:apps`. With Yarn, first run `yarn install` and `yarn --cwd apps/mobile install`; after that, `yarn run install:apps` also works. Commit both lockfiles. Your chosen manager must already be installed; `--no-install` lets you create files and install later.

If modern Yarn reports a recently published dependency as quarantined, retry after its configured minimum package age. The creator declares the starter build scripts without changing the package-age policy.

Node 22.16+ is required. Mobile needs the NativeScript CLI and platform SDKs: macOS/Xcode for iOS, JDK/Android SDK for Android. Doctor reports prerequisites without installing tools. If installation fails, source files remain available for retry.

Current authoring is Vue. React/Next, other frameworks, portable syntax and SDUI remain roadmap work; unsupported options report that boundary instead of generating placeholders. The CLI does not convert React code into Vue.
