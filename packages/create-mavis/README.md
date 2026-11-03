# Create Mavis

Start with Vue on the Web, NativeScript, or both. Web projects use Vue + Vite or Nuxt with server rendering/static generation. The generated example shares a Vue screen and gives each host its own service implementation.

Run `npm create @getcortexlabs/mavis@latest` for the interactive wizard, or pass a project name and options:

```sh
npm create @getcortexlabs/mavis@latest my-app -- --target both --web nuxt --rendering ssr --theme midnight --no-install
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

The wizard, package-manager selection and both examples are included in alpha.10.

- `--dry-run` prints the file plan without writing or installing.
- Existing directories are never merged or overwritten.
- `--install` runs the chosen package manager after creating the project. It must already be available on PATH. A failed install preserves the source for retry.
- `--doctor` checks a generated project's Node, package-manager and native prerequisites without installing tools.
- `mavis.config.json` records the resolved choices and dependency versions.

Node.js 22.16+ is required. Native projects also need the NativeScript CLI and the platform SDK. iOS requires macOS and Xcode. A shared project keeps native dependencies separate from its Web workspace so each renderer loads the correct Vue runtime.

Templates pin **Mavis 0.1.0-alpha.10** and **Jolt 0.1.0-rc.10**. The CLI and its generated projects use the same Mavis release. Commit the generated lockfile (both lockfiles for a shared project).

pnpm requires **10.26+**. Its generated workspace files keep the mobile installation separate, use a hoisted layout for Vite deduplication, shared imports and NativeScript, and allow only the starter's required dependency build scripts. Yarn Classic and modern Yarn use `node_modules`; initial empty `yarn.lock` files mark separate projects before installation. The starter declares its dependency build scripts explicitly; other package-manager policies remain in effect. If modern Yarn reports a fresh dependency as quarantined, retry after its configured minimum package age. Do not add `apps/mobile` to the Web workspace.

React, Next, Angular, Svelte, portable authoring and SDUI are roadmap work. The creator reports unsupported choices instead of generating placeholder integrations.

MIT · [Mavis UI](https://github.com/getcortexlabs/mavis-ui)

## Shared screens and portability

`#mavis` resolves shared named imports and types for Vue + Vite SPA, Nuxt SSR/SSG and NativeScript iOS/Android. The new `--example directory` adds shared search, details, editing, persistence and automatic navigation through an app-owned router adapter.

`--check-portability` reports platform dependencies with locations. `--fix-imports` previews safe named-import changes to `#mavis`; add `--write` to apply. `--path` selects a source directory and `--json` emits structured diagnostics. `--doctor` also runs this source audit. Unknown dependencies, HTML/CSS and device services still require review and target tests.

## Add a host to an existing Mavis application (alpha.10)

Run `create-mavis --add-native` in a Vue + Vite/Nuxt package, or `create-mavis --add-web [--web nuxt]` in a NativeScript-Vue package. Use `--dry-run` to inspect the plan and `--screen path/to/Screen.vue` to reuse an existing screen without moving it. The command creates an isolated host under `apps`, adds root launch/install scripts and preserves existing source/configuration/lockfiles. Dependencies install only with `--install`; npm, pnpm and Yarn are supported. Conflicts and unsupported workspaces/version baselines are reported before writing. The selected screen's services, aliases and router remain application-owned; portability diagnostics are not automatic conversion. Upgrade the existing Mavis renderer to alpha.10 before adding a host.
