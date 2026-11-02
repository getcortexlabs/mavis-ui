---
title: Create a project
description: "Create a Mavis project with Vue, Nuxt or NativeScript."
---

# Create a project

The creator scaffolds Vue + Vite, Nuxt SSR/SSG, NativeScript-Vue, or mobile + Web with a shared screen. Templates pin published **Mavis alpha.6** and **Jolt RC.8**, independently of newer source APIs.

Start the interactive wizard with either command:

```sh
npm create @getcortexlabs/mavis@latest
# Or:
npx @getcortexlabs/create-mavis@latest
```

The wizard asks for target, Web host, rendering, theme and installation. Explicit flags are preserved. `back` revisits a choice; `cancel` or Ctrl-C cancels. `--dry-run` lists files without writing; `--yes` accepts defaults. Existing directories are never overwritten.

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
