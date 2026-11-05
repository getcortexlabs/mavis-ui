---
title: Add a platform to an existing app
description: Add Web or NativeScript without moving an existing Mavis application, and declare platform differences in shared Vue screens.
---

# Add a platform to an existing app

::: info Alpha.10
These commands and APIs are included in Mavis alpha.11. Keep core, renderers and the creator at the same version. Run the commands below with `npx @getcortexlabs/create-mavis@0.1.0-alpha.11` in place of `create-mavis`, or use the CLI installed in your project.
:::

## Add iOS and Android to Vue or Nuxt

Run inside the existing Web package:

```sh
create-mavis --add-native --dry-run
create-mavis --add-native
```

The command detects Vue + Vite or Nuxt and npm, pnpm or Yarn. It creates an isolated `apps/mobile` project with NativeScript-Vue, the native Mavis renderer, Android/iOS build configuration and a working starter. Existing Web sources, routes, configuration and lockfiles stay in place. The root package gains `install:mobile`, `ios` and `android` scripts. Instructions use the selected manager; dependencies are installed only with `--install` or the generated installation command.

To use an existing screen directly:

```sh
create-mavis --add-native --screen src/screens/Search.vue
```

The new host imports that file; it does not copy it. A top-level `MScreen` is detected and placed inside a native `Frame`. Content such as `MColumn` is wrapped in one `MScreen`. Use `--screen-root screen` or `--screen-root content` when the screen owns its page indirectly. Native `Frame`/`Page` entry components are not portable screen inputs.

The audit follows relative imports and reports browser globals, platform-specific imports, HTML and CSS. Findings are review tasks, not automatic conversions. Provide the selected screen's required props, service injections, custom aliases and routing in the new host entry. A Nuxt page using Nuxt-only composables needs an adapter before it can run natively.

## Add Web to NativeScript

Run inside the existing NativeScript-Vue package:

```sh
create-mavis --add-web
# Or Nuxt with server rendering:
create-mavis --add-web --web nuxt --rendering ssr
# Static Nuxt output is also supported:
create-mavis --add-web --web nuxt --rendering ssg --dry-run
```

This creates `apps/web` and adds `install:web`, `dev:web`, `build:web` and `preview:web` scripts. `--screen` works in this direction too. The native app keeps its entry, package manifest dependencies and build configuration. Vue + Vite uses client rendering; Nuxt supports SSR/SSG.

Both commands support `--package-manager npm|pnpm|yarn`, `--dry-run`, `--json`, `--yes`, `--install` and `--no-install`. A TTY shows the file plan and asks before applying it. A noninteractive command applies its explicit request; use `--dry-run` to inspect it first. Repeating the same command preserves edited host files and reports that the target already exists. Conflicting paths/scripts, different target choices, unsupported Mavis baselines and workspace roots are reported before writing. The creator does not silently upgrade or downgrade an existing renderer. In a monorepo, run from a standalone host package and keep the new renderer outside any parent workspace glob that would hoist both Vue runtimes.

The existing `--check-portability`, `--fix-imports` and `--fix-imports --write` commands remain separate. Import migration still requires a configured `#mavis` facade in both hosts. The add-target command does not rewrite arbitrary Web build configuration or migrate existing imports. The auditor now distinguishes `.ts`/`.mts`/`.cts`, TSX/JSX and Vue script languages, so a TypeScript generic such as `<T>(value: T) => value` is not parsed as JSX.

NativeScript still requires platform tooling: Android SDK/JDK, and macOS/Xcode for iOS. The CLI prepares the project; it does not install SDKs, configure signing or deploy an application.

## Show content on selected platforms

`createMavis()` and services-only installation provide platform identity automatically. Import the shared APIs from `@getcortexlabs/mavis-core/vue`; both renderer entry points also export them. This works with named imports and `components: false`. New alpha.11 projects export these APIs through `#mavis`. Add explicit re-exports to older facades after upgrading their packages.

```vue
<script setup lang="ts">
import { MPlatform, useMavisPlatform } from '@getcortexlabs/mavis-core/vue'
const { isNative } = useMavisPlatform()
</script>

<template>
  <MPlatform only="web"><MButton text="Print" /></MPlatform>
  <MPlatform only="native"><MButton text="Share" /></MPlatform>
  <MPlatform :only="['ios', 'android']">
    <MText>App content</MText>
    <template #fallback><MText>Browser content</MText></template>
  </MPlatform>
  <MButton v-if="isNative" text="Open camera" />
</template>
```

`only` requires `web`, `native`, `ios`, `android`, or a nonempty array of these. The component creates no layout wrapper and evaluates only the selected slot. Excluded child components do not run setup or mount. The composable returns an immutable app-owned `{ platform, isWeb, isNative, isIOS, isAndroid }`; `platform` is `web`, `ios` or `android`. A mobile browser remains Web, including during Nuxt SSR/SSG. Width and touch capability do not decide the renderer.

This controls component instantiation, not module loading or tree shaking. Static imports and parent setup still execute. Isolate native-only packages, browser globals and device services in host modules. No custom `v-web`/`v-native` compiler transform is required.

## Animate filtered and reordered lists

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useMavisListMotion } from '@getcortexlabs/mavis-core/vue'
const items = ref([{ id: 1, text: 'One' }, { id: 2, text: 'Two' }])
const list = useMavisListMotion({ size: false, transition: { duration: 240 } })
function reverse() {
  return list.update(() => { items.value = [...items.value].reverse() })
}
</script>

<template>
  <MColumn :motionRegion="list.region" gap="md">
    <MCard v-for="item in items" :key="item.id"><MText>{{ item.text }}</MText></MCard>
  </MColumn>
</template>
```

The mutation is synchronous. `update()` returns `{ finished: Promise<boolean>, stop() }`; false indicates interruption or no mounted host. Before mount/SSR, the data change still executes without measuring layout. The lower-level API is `region.animateLayout(change, options)` on an experimental motion region. `MRow` and `MColumn` can now own regions, as `MBox` already does.

Jolt measures and animates direct children in each renderer. Vue keys must remain unique and stable; drafts belong to item state. Options are `transition`, `size: 'scale' | false` and `enter` (fade newly added children). Removed items leave immediately; retained children animate into place. This does not retain deleted rows for exit animations or animate offscreen/recycled `MVirtualList` items. It is distinct from interactive drag reordering and `animateItems` entrance effects. Reduced motion and interruptions remain owned by Jolt.

## Link motion to a section

Declare a stable section region separately from its animated child:

```ts
import { markRaw, onBeforeUnmount } from 'vue'
import { createMotionRegion, createMotionScrollSource, createMotionSurface, whenMotionAvailable } from '@getcortexlabs/mavis-core/experimental'

const scroll = markRaw(createMotionScrollSource())
const section = markRaw(createMotionRegion())
const artwork = markRaw(createMotionSurface())
onBeforeUnmount(whenMotionAvailable([scroll, section, artwork], () => {
  const link = artwork.scrollSection(scroll, section, { y: [0, -60], opacity: [0.3, 1] }, {
    start: ['start', 'end'],
    end: ['end', 'start'],
  })
  return () => link.dispose()
}))
```

Bind `scroll` to `MScreen.motionScroll` with `scroll`, `section` to `MBox.motionRegion`, and `artwork` to a child `MCard.motionSurface`. Each point pairs a section edge with a viewport edge: `start`, `center` or `end`. Defaults run from the section's top reaching the viewport's bottom to its bottom reaching the viewport's top.

The adapters track layout changes and delegate numeric playback to Jolt. Reachable offsets are clipped to the scroll container; a section without a traversable range settles at the final frame. The contract is vertical, with CSS pixels on Web and DIPs natively. Keep the section itself geometrically stable; animate a separate child. Call `link.refresh()` after layout changes that do not emit observed size/content events. Disposal of the surface, section or scroll source releases observers and playback. Numeric `scrollLinked(..., { range })` remains available.

## Declare navigation transitions once

Share a policy in application code:

```ts
import { defineNavigationTransition } from '@getcortexlabs/mavis-core'
export const pageTransition = defineNavigationTransition({ name: 'slide', duration: 220 })
```

Vue + Vite imports `createMavisNavigation` from `@getcortexlabs/mavis-web`; NativeScript imports the same function name from `@getcortexlabs/mavis/vue`:

```ts
const navigation = createMavisNavigation(router, { transition: pageTransition })
app.use(createMavis({ navigation }))
```

In a Nuxt plugin, use `createNuxtMavisNavigation(nuxtApp, { transition: pageTransition })` from the Web package. It coordinates async page readiness with Nuxt's `page:finish` hook. The Web adapter installs router hooks per app; Mavis services dispose them on unmount. Manually owned instances expose `dispose()`.

Policies are `fade`, `slide` or `none`, with duration in milliseconds. Web uses the browser View Transition API when available; unsupported browsers and reduced motion keep navigation and focus behavior without snapshots. NativeScript delegates transitions, cancellation, interactive back and accessibility focus to vue-router-ns. Web observes confirmed navigation, preserves guard failures and browser history, focuses the new heading, and restores connected or keyed prior focus on back. Use a stable `id` or `data-mavis-focus-key` for a trigger that remounts. An explicit `focus()` callback can select another destination. Deliberate focus changes are respected.

These are platform transitions, not a promise of identical pixels or a replacement history stack. Keep native route-level presentation and device gestures in the native router. Test cancellations, redirects, rapid navigation and focus in the routers and hosts used by the application.
