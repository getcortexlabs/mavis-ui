---
title: Share screens across platforms
description: One Vue screen for Vue + Vite SPA, Nuxt SSR/SSG and NativeScript iOS/Android.
---

# Share screens across platforms

Write screens with Mavis components, shared props and Vue state. The host selects the renderer and supplies routing and device services. Vue + Vite SPA, Nuxt SSR/SSG and NativeScript-Vue iOS/Android are all supported targets; Vite is the build tool, while Vue is the UI framework.

::: warning Source APIs — next release
The aliases, directory reference, app navigation and portability commands below are new source features. They are not in the published alpha.8 CLI. Repository checks install matching local tarballs; the next coordinated release must update the generated package pins before publication. The existing published CLI still creates its original starter.
:::

## The same import and screen

The creator now generates a `#mavis` alias in each host's build and TypeScript configuration. The host's `mavis.ts` exports the shared component/composable set, core contracts and date-format helpers. It does not expose Web-only APIs such as `useMavisTokens` or raw native views. `#shared-ui` points to the same application sources.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MColumn, MInput, MButton } from '#mavis'
const query = ref('')
</script>

<template>
  <MColumn gap="md" padding="lg">
    <MInput v-model="query" label="Search" />
    <MButton href="/results" text="See results" />
  </MColumn>
</template>
```

Vue + Vite and Nuxt resolve components to Mavis Web; NativeScript resolves them to Mavis native. Named imports provide template types and work with services-only installation. NativeScript's build and TypeScript aliases also map `vue` to its own renderer. Each host has its own dependency tree: the Web bundle does not need NativeScript.

The alias is project configuration, not a new npm package or an implicit runtime platform check. Existing apps can copy the creator's host facade and aliases without moving their screens into a specially named folder. Keep the facade, bundler alias and TypeScript alias together.

## Configure navigation once

```ts
import { createMavisServices } from '@getcortexlabs/mavis-web/services'
import { createRouterNavigation } from '@getcortexlabs/mavis-core'

app.use(createMavisServices({ navigation: createRouterNavigation(router) }))
```

Use Vue Router for a Vue + Vite SPA, Nuxt's request-owned router in its plugin, or `vue-router-ns` at the NativeScript entry (with `@getcortexlabs/mavis/vue/services`). `createMavis` accepts the same `navigation` option when global registration is wanted.

`MLink`, linked `MButton` and linked `MCard` now use that adapter automatically. Web anchors use the router's resolved URL, including history base/hash configuration. Ordinary clicks delegate to the router, retaining its guards and history; modified clicks and `_blank` retain browser behavior. External URLs keep the platform default. Shared native links require an absolute URL with a scheme; protocol-relative URLs remain a Web behavior. An explicit `navigate` prop overrides the global adapter and retains its original destination/callback contract.

Use `useMavisNavigation()` in shared setup code for `push`, `replace` and `back`. It requires an installed adapter. Route state, route-specific parameters, native back gestures and deep-link configuration remain with the host router. The reference's Nuxt wrappers pass route parameters as shared screen props. This adapter does not emulate native navigation with a Web history stack.

## A complete reference

The creator's new `--example directory` generates search → details → edit → persistence with the same `Directory.vue`, `Details.vue`, `Edit.vue` and directory service in every preset:

```sh
create-mavis places --target both --web vite --example directory
create-mavis places --target both --web nuxt --rendering ssr --example directory
create-mavis places --target web --web nuxt --rendering ssg --example directory
create-mavis places --target mobile --example directory
```

Each command creates a separate project; use different names to keep several. `--example welcome` remains the default starter. Combined projects have `shared/`, `apps/web` and `apps/mobile`; single-target projects keep the shared screens inside their source tree.

The reference includes filtering/empty state, responsive MGrid, real links and route parameters, an editable draft, loading and retry after a failed save. `MReveal` supplies the shared confirmation animation; button press feedback also uses the existing Mavis/Jolt implementation. More advanced motion uses the existing [shared motion contracts](./motion), rather than DOM or native-view code inside the screen.

Web hosts use localStorage after mount/hydration; native uses ApplicationSettings. Every Nuxt request creates its own store with deterministic initial data. Storage is a local demonstration, not a backend or cross-device synchronization. Replace the host storage service when integrating an application. Vue SPA history hosting needs a fallback to `index.html`; Nuxt generation crawls the real detail/edit links into static routes.

## Check portability and migrate imports

Run from the project root:

```sh
create-mavis --check-portability
create-mavis --check-portability --path src/modules --json
create-mavis --fix-imports          # preview only
create-mavis --fix-imports --write  # apply safe import edits
```

The checker reports file, line, column and a suggestion for renderer/router imports, browser globals, platform elements, DOM directives and CSS/class/style that need review. It follows relative imports inside the project, skips generated/dependency directories and refuses symlinks. Unknown external imports need review; audited dependencies can be listed in `portability.allowImports` in `mavis.config.json`. `--doctor` also includes the source audit, in addition to toolchain checks. Findings return exit status 1 so the check can run in CI.

The migration changes only named imports composed entirely of shared renderer exports to `#mavis`, preserving local aliases. It requires the generated host configuration. It does not rewrite namespace imports, mixed Web-only exports, HTML, CSS, routers, storage or device APIs. The preview includes the proposed edits; invalid syntax prevents writing. Review the diff and typecheck both hosts after applying it.

This is a conservative source diagnostic, not a portable compiler or a certification of dependencies. Dynamic behavior and platform-specific component capabilities still require tests on each target. The useful contract is one screen source, validated in all intended hosts, with explicit services at platform boundaries.
