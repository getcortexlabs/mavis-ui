# Create Mavis

Start a project for the Web, Native (iOS and Android through NativeScript) and the Mac, in any combination. Web projects use Vue + Vite or Nuxt with server rendering/static generation. Web and Native share a Vue screen and give each host its own service implementation; with the Mac, screens are written once and generated for each target (experimental, see below).

Run `npm create @getcortexlabs/mavis@latest` for the interactive wizard, or pass a project name and options:

```sh
npm create @getcortexlabs/mavis@latest my-app -- --targets web,native --web nuxt --rendering ssr --theme midnight --no-install
```

The terminal wizard uses arrow keys and Enter, with descriptions, inline name validation and a summary before creation. Choose **Back** to revisit a choice or **Change choices** at the summary. Escape or Ctrl-C cancels. Explicit flags are preserved. In CI, supply a project name and flags, or `--yes` for defaults without installation.

Choose **Basic project** (`--example welcome`, the default) or **Search, details and editing** (`--example directory`). The summary includes the example. After creation, the CLI points to `Welcome.vue` or `Directory.vue` in the shared source directory. Both examples support all five presets and npm, pnpm and Yarn; generated instructions follow the chosen manager.

Choose **npm, pnpm or Yarn** regardless of how you launched the creator. The invoking manager is preselected when detected; otherwise npm is the default. `--package-manager pnpm` selects it without a prompt. The generated scripts, README, installation and next steps all use your choice. Before the final summary, the wizard checks whether the selected manager can run. If it cannot, choose another manager, check again, or create without installing; your project choices are preserved. Shell PATH changes require restarting the creator from the updated terminal.

```sh
npm create @getcortexlabs/mavis@latest my-app -- --package-manager pnpm --yes --no-install
cd my-app
pnpm install
pnpm run dev
```

The wizard, package-manager selection and both examples are included in RC.12. RC.13 adds `--targets` with any combination of `web`, `native` and `macos` (`--target` keeps working), the Tasks example and `--capabilities`, which prints what can be created and how far each combination has been validated.

- `--dry-run` prints the file plan without writing or installing.
- Existing directories are never merged or overwritten.
- `--install` runs the chosen package manager after creating the project. It must already be available on PATH. A failed install preserves the source for retry.
- `--doctor` checks a generated project's Node, package-manager and native prerequisites without installing tools.
- `mavis.config.json` records the resolved choices and dependency versions.

Node.js 22.16+ is required. Native projects also need the NativeScript CLI and the platform SDK. iOS requires macOS and Xcode. A shared project keeps native dependencies separate from its Web workspace so each renderer loads the correct Vue runtime.

Templates pin **Mavis 0.1.0-rc.14** and **Jolt 0.1.0-rc.15**. The CLI and its generated projects use the same Mavis release. Commit the generated lockfile (both lockfiles for a shared project).

pnpm requires **10.26+**. Its generated workspace files keep the mobile installation separate, use a hoisted layout for Vite deduplication, shared imports and NativeScript, and allow only the starter's required dependency build scripts. Yarn Classic and modern Yarn use `node_modules`; initial empty `yarn.lock` files mark separate projects before installation. The starter declares its dependency build scripts explicitly; other package-manager policies remain in effect. If modern Yarn reports a fresh dependency as quarantined, retry after its configured minimum package age. Do not add `apps/mobile` to the Web workspace.

React, Next, Angular, Svelte and SDUI are roadmap work. Shared Vue and TSX compilation for Mac is experimental. The creator reports unsupported choices instead of generating placeholder integrations.

MIT · [Mavis UI](https://github.com/getcortexlabs/mavis-ui)

## Shared screens and portability

`#mavis` resolves shared named imports and types for Vue + Vite SPA, Nuxt SSR/SSG and NativeScript iOS/Android. The new `--example directory` adds shared search, details, editing, persistence and automatic navigation through an app-owned router adapter.

`--check-portability` reports platform dependencies with locations, and then, for each shared file, whether the experimental Mac target can compile it and why not. `--fix-imports` previews safe named-import changes to `#mavis`; add `--write` to apply. `--path` selects a source directory and `--json` emits structured diagnostics. `--doctor` also runs this source audit. Unknown dependencies, HTML/CSS and device services still require review and target tests.

## Add a host to an existing Mavis application (RC.12)

Run `create-mavis --add-native` in a Vue + Vite/Nuxt package, or `create-mavis --add-web [--web nuxt]` in a NativeScript-Vue package. Use `--dry-run` to inspect the plan and `--screen path/to/Screen.vue` to reuse an existing screen without moving it. The command creates an isolated host under `apps`, adds root launch/install scripts and preserves existing source/configuration/lockfiles. Dependencies install only with `--install`; npm, pnpm and Yarn are supported. Conflicts and unsupported workspaces/version baselines are reported before writing. The selected screen's services, aliases and router remain application-owned; portability diagnostics are not automatic conversion. Align the existing Mavis packages with the creator version before adding a host.

## Experimental shared sources with Mac

Experimental RC.14 includes Nuxt SSR/SSG with Mac, the shared Vue Directory example and `--add-macos`. Mac parity issues #338–#354 remain open; check the documented per-component and motion limits before adoption.

```sh
create-mavis studio --targets web,native,macos --web nuxt --rendering ssr --example directory
```

`--example directory` keeps the same Vue screens, typed store and route table across Web, NativeScript and SwiftUI. Welcome and Tasks use shared TSX. The compiler is the versioned `@getcortexlabs/mavis-compiler` package, pinned with Mavis; generated projects contain a small launcher instead of a copy of the compiler. The Web host remains Vue + Vite or Nuxt. Run the generated Mac script on macOS 14+ with Xcode. See the [supported source contracts](https://mavis-ui.getcortexlabs.com/guide/macos-experimental) and source diagnostics before adopting an existing screen.

## Add Mac to an existing application

Run in the existing Web, NativeScript or combined project:

```sh
create-mavis --add-macos --shared-root src/shared --entry src/shared/screens/Home.vue
create-mavis --add-macos --shared-root src/shared --entry src/shared/screens/Home.vue --write
```

The first command is a preview. `--write` applies the reviewed plan; `--json` emits the plan for tools. Nested source folders stay in place. The command adds `apps/macos`, `generate:macos`, `build:macos` and `macos`, and migrates schema 1 configuration to schema 2. It preserves existing Web/native hosts and lockfiles, detects conflicts before writing, and never installs packages. Run your package manager after applying. `--shared-root` accepts comma-separated roots; `portability.roots`, `sourceRoot` and `entry` retain those choices.

For the unchanged RC.13 Directory template, `--add-macos --migrate-directory` previews the typed storage adapter migration; add `--write` to apply it. The migration requires exact original sources and host entries, preserves the stored JSON array and `mavis:directory` key, and rejects customized versions. It does not transfer stored data between devices. Directory's Swift host uses UserDefaults. Other app-owned service interfaces require explicit Swift implementations; the CLI reports these instead of inventing service behavior.

Set `macos.name`, `bundleId`, `icon` (project-relative `.icns`), `minWidth` and `minHeight` in `mavis.config.json`. `--doctor` checks installed compiler/Mavis alignment, the exact Jolt/JoltSwiftUI pin and shared-source diagnostics. Align dependencies first; adoption does not silently upgrade them. Signing, provisioning, notarization and store distribution are separate from this unsigned development build.
