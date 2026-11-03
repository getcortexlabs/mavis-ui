# Create Mavis

Start with Vue on the Web, NativeScript, or both. Web projects use Vue + Vite or Nuxt with server rendering/static generation. The generated example shares a Vue screen and gives each host its own service implementation.

Run `npm create @getcortexlabs/mavis@latest` for the interactive wizard, or pass a project name and options:

```sh
npm create @getcortexlabs/mavis@latest my-app -- --target both --web nuxt --rendering ssr --theme midnight --no-install
```

The terminal wizard uses arrow keys and Enter, with descriptions, inline name validation and a summary before creation. Choose **Back** to revisit a choice or **Change choices** at the summary. Escape or Ctrl-C cancels. Explicit flags are preserved. In CI, supply a project name and flags, or `--yes` for defaults without installation.

Choose **npm, pnpm or Yarn** regardless of how you launched the creator. The invoking manager is preselected when detected; otherwise npm is the default. `--package-manager pnpm` selects it without a prompt. The generated scripts, README, installation and next steps all use your choice.

```sh
npm create @getcortexlabs/mavis@latest my-app -- --package-manager pnpm --yes --no-install
cd my-app
pnpm install
pnpm run dev
```

This updated wizard and package-manager selection are available in repository source and will ship in the next release. The published alpha.8 creator still uses the previous npm-only wizard.

- `--dry-run` prints the file plan without writing or installing.
- Existing directories are never merged or overwritten.
- `--install` runs the chosen package manager after creating the project. It must already be available on PATH. A failed install preserves the source for retry.
- `--doctor` checks a generated project's Node, package-manager and native prerequisites without installing tools.
- `mavis.config.json` records the resolved choices and dependency versions.

Node.js 22.16+ is required. Native projects also need the NativeScript CLI and the platform SDK. iOS requires macOS and Xcode. A shared project keeps native dependencies separate from its Web workspace so each renderer loads the correct Vue runtime.

Templates pin **Mavis 0.1.0-alpha.8** and **Jolt 0.1.0-rc.10**. They use APIs available in those releases, independently of newer repository capabilities. Commit the generated lockfile (both lockfiles for a shared project).

pnpm requires **10.26+**. Its generated workspace files keep the mobile installation separate, use a hoisted layout for NativeScript, and allow only the starter's required dependency build scripts. Yarn Classic and modern Yarn use `node_modules`; initial empty `yarn.lock` files mark separate projects before installation. Do not add `apps/mobile` to the Web workspace.

React, Next, Angular, Svelte, portable authoring and SDUI are roadmap work. The creator reports unsupported choices instead of generating placeholder integrations.

MIT · [Mavis UI](https://github.com/getcortexlabs/mavis-ui)
