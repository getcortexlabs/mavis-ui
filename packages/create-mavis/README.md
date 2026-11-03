# Create Mavis

Start with Vue on the Web, NativeScript, or both. Web projects use Vue + Vite or Nuxt with server rendering/static generation. The generated example shares a Vue screen and gives each host its own service implementation.

Run `npm create @getcortexlabs/mavis@alpha` for the interactive wizard, or pass a project name and options:

```sh
npm create @getcortexlabs/mavis@alpha my-app -- --target both --web nuxt --rendering ssr --theme midnight --no-install
```

Without flags, a terminal wizard asks for target, Web host, rendering and theme. `back` revisits a choice; `cancel` or Ctrl-C stops it. Explicit flags are preserved. In CI, supply a project name and flags, or `--yes` for defaults.

- `--dry-run` prints the file plan without writing or installing.
- Existing directories are never merged or overwritten.
- `--install` runs npm after creating the project. A failed install preserves the source for retry.
- `--doctor` checks a generated project's Node and native prerequisites without installing tools.
- `mavis.config.json` records the resolved choices and dependency versions.

Node.js 22.16+ is required. Native projects also need the NativeScript CLI and the platform SDK. iOS requires macOS and Xcode. A shared project keeps native dependencies separate from its Web workspace so each renderer loads the correct Vue runtime.

Templates pin **Mavis 0.1.0-alpha.8** and **Jolt 0.1.0-rc.10**. The published CLI uses those releases. The new source templates below require matching local Mavis tarballs until the next coordinated release updates these pins. Commit the lockfile npm generates.

React, Next, Angular, Svelte, portable authoring and SDUI are roadmap work. The creator reports unsupported choices instead of generating placeholder integrations.

MIT · [Mavis UI](https://github.com/getcortexlabs/mavis-ui)

## Source additions (next release)

`#mavis` resolves shared named imports and types for Vue + Vite SPA, Nuxt SSR/SSG and NativeScript iOS/Android. The new `--example directory` adds shared search, details, editing, persistence and automatic navigation through an app-owned router adapter.

`--check-portability` reports platform dependencies with locations. `--fix-imports` previews safe named-import changes to `#mavis`; add `--write` to apply. `--path` selects a source directory and `--json` emits structured diagnostics. `--doctor` also runs this source audit. Unknown dependencies, HTML/CSS and device services still require review and target tests.
