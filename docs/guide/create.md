---
title: Create a project
description: "Create a project com Mavis, Vue, Nuxt e NativeScript."
---

# Create a project

The creator scaffolds Vue + Vite, Nuxt SSR/SSG, NativeScript-Vue, or mobile + Web with a shared screen. Templates pin published **Mavis alpha.5** and **Jolt RC.7**, independently of newer source APIs.

`@getcortexlabs/create-mavis` is prepared for publication. Until it is on the registry, run the source checkout or install its `npm pack` tarball:

```sh
node packages/create-mavis/src/cli.mjs my-app --target both --web nuxt --rendering ssr --no-install
```

The intended published command is `npm create @getcortexlabs/mavis@alpha`. The wizard asks for target, Web host, rendering, theme and installation. Explicit flags are preserved. `back` revisits a choice; `cancel` or Ctrl-C cancels. `--dry-run` lists files without writing; `--yes` accepts defaults. Existing directories are never overwritten.

| Option | Values |
| --- | --- |
| `--target` | web, mobile, both |
| `--web` | vite, nuxt |
| `--rendering` | client (Vite), ssr or ssg (Nuxt) |
| `--theme` | mavis, midnight |
| `--install` / `--no-install` | Install with npm now or later |
| `--doctor` | Inspect prerequisites from a generated project |

In a shared project, `shared/Welcome.vue` owns the screen. `apps/web` and `apps/mobile` provide renderers and app services. Native dependencies stay separate so each renderer loads its own Vue runtime. `mavis.config.json` records choices and versions; commit the lockfile after installation.

Node 22.16+ is required. Mobile needs the NativeScript CLI and platform SDKs: macOS/Xcode for iOS, JDK/Android SDK for Android. Doctor reports prerequisites without installing tools. If npm fails, source files remain available for retry.

Current authoring is Vue. React/Next, other frameworks, portable syntax and SDUI remain roadmap work; unsupported options report that boundary instead of generating placeholders. The CLI does not convert React code into Vue.
