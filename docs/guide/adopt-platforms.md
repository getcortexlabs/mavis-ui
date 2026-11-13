---
title: Add a platform to an existing app
description: Add Web or NativeScript without moving an existing Mavis application, and declare platform differences in shared Vue screens.
---

# Add a platform to an existing app

::: info Alpha.10
These commands and APIs are included in Mavis RC.12. Keep core, renderers and the creator at the same version. Run the commands below with `npx @getcortexlabs/create-mavis@0.1.0-rc.13` in place of `create-mavis`, or use the CLI installed in your project.
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

## Add Mac to an existing project

::: info Next release — experimental
`--add-macos`, Nuxt with Mac and the Directory source migration are repository features until the next release. Use matching local compiler, creator and renderer packages while developing from source. The published RC.13 CLI does not contain them.
:::

Run from a Mavis Web, NativeScript or combined project. Source roots and the entry can be read from configuration or selected explicitly:

```sh
create-mavis --add-macos --shared-root src/shared --entry src/shared/screens/Home.vue
create-mavis --add-macos --shared-root src/shared --entry src/shared/screens/Home.vue --write
```

Each invocation validates the current sources. The first invocation only previews; `--write` applies the plan and `--json` returns structured data. This Mac command uses preview/apply rather than the Web/native `--dry-run` convention. It does not install dependencies or accept `--install`. Run npm, pnpm or Yarn after applying, then `run generate:macos` or `run build:macos` with that manager.

The plan adds `apps/macos`, a small generator launcher and root `generate:macos`, `build:macos` and `macos` scripts. Schema 1 becomes schema 2 with `targets`. Existing source files, host configuration and lockfiles remain in place; file/script conflicts and concurrent source edits while applying a plan abort the operation. Repeating the command reports an already configured target without overwriting its files.

`--shared-root` accepts comma-separated project-relative folders, including nested screens and components. The resulting configuration retains these paths:

```json
{
  "portability": {
    "roots": ["src/shared"],
    "sourceRoot": "src/shared",
    "entry": "src/shared/screens/Home.vue",
    "generate": ["macos"]
  },
  "macos": {
    "name": "Studio",
    "bundleId": "com.example.studio",
    "icon": "assets/studio.icns",
    "minWidth": 800,
    "minHeight": 600
  }
}
```

The compiler is the pinned `@getcortexlabs/mavis-compiler` package. Keep its version aligned with core and the renderers. `--doctor` reports mismatches between the installed compiler, Mavis and the exact project Jolt/JoltSwiftUI pin. Adoption reports incompatible pins before writing; it does not upgrade dependencies silently. Source constructs unsupported by the Mac compiler receive diagnostics rather than being discarded.

For the unchanged published RC.13 Directory example, explicitly request the storage migration:

```sh
create-mavis --add-macos --migrate-directory
create-mavis --add-macos --migrate-directory --write
```

The preview includes every source/host change. Migration requires exact matches to the original Directory files and host entries; customized versions require a manual adaptation. It moves persistence behind a typed host service, preserves the JSON array and `mavis:directory` storage key, and keeps the save-after-write behavior. Web uses localStorage, NativeScript uses ApplicationSettings and Mac uses UserDefaults. These stores are local to each host; migration does not synchronize user data across devices.

Directory receives its Swift storage implementation automatically. Other app-owned service interfaces require explicit Swift implementations; the CLI reports them instead of generating stubs. The adopted project's Web/native bootstraps remain app-owned. Mac startup is configured separately through `portability.startup`, as described in the [Mac guide](./macos-experimental).

Building requires macOS 14+ and Xcode. The output is an unsigned development app. Developer ID signing, provisioning, notarization and store distribution are separate steps; no credentials or signing configuration are generated.

## Show content on selected platforms

`createMavis()` and services-only installation provide platform identity automatically. Import the shared APIs from `@getcortexlabs/mavis-core/vue`; both renderer entry points also export them. This works with named imports and `components: false`. New RC.12 projects export these APIs through `#mavis`. Add explicit re-exports to older facades after upgrading their packages.

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

`only` requires `web`, `native`, `ios`, `android`, `macos`, or a nonempty array of these. The component creates no layout wrapper and evaluates only the selected slot. Excluded child components do not run setup or mount. The composable returns an immutable app-owned `{ platform, isWeb, isNative, isIOS, isAndroid, isMacOS }`; `platform` is `web`, `ios`, `android` or `macos`. A mobile browser remains Web, including during Nuxt SSR/SSG. Width and touch capability do not decide the renderer.

`macos` is the experimental SwiftUI app. No Vue renderer runs there, so `isMacOS` is always `false` on the Web and on NativeScript, `isNative` means the NativeScript renderer (iOS and Android), and `only="macos"` shows its fallback in both. The [Mac generator](./macos-experimental#shared-vue-files) answers for the Mac when it reads a shared file: it keeps the Mac branch and leaves the others out of the app.

This controls component instantiation, not module loading or tree shaking. Static imports and parent setup still execute. Isolate native-only packages, browser globals and device services in host modules. No custom `v-web`/`v-native` compiler transform is required.

## Animate filtered and reordered lists

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useMavisListMotion } from '@getcortexlabs/mavis-core/vue'
const items = ref([
  { id: 1, text: 'One' },
  { id: 2, text: 'Two' },
])
const list = useMavisListMotion({ size: false, transition: { duration: 240 } })
function reverse() {
  return list.update(() => {
    items.value = [...items.value].reverse()
  })
}
</script>

<template>
  <MColumn :motionRegion="list.region" gap="md">
    <MCard v-for="item in items" :key="item.id"
      ><MText>{{ item.text }}</MText></MCard
    >
  </MColumn>
</template>
```

The mutation is synchronous. `update()` returns `{ finished: Promise<boolean>, stop() }`; false indicates interruption or no mounted host. Before mount/SSR, the data change still executes without measuring layout. The lower-level API is `region.animateLayout(change, options)` on an experimental motion region. `MRow` and `MColumn` can now own regions, as `MBox` already does.

Jolt measures and animates direct children in each renderer. Vue keys must remain unique and stable; drafts belong to item state. Options include `transition`, `size: 'scale' | false` and `enter` (fade newly added children). In the current source checkout, Jolt RC.15 also supports bounded removal exits:

```ts
const list = useMavisListMotion({
  exit: { opacity: 0, y: 16, scale: 0.96 },
  maxSnapshotPixels: 8_000_000,
  transition: { duration: 240 },
})
```

`exit` accepts `false`, `'fadeOut'` or finite `opacity`/`x`/`y`/`scale` values. Opacity must be between 0 and 1; scale must be positive. The pixel budget is an integer from 1 to 32 million; Jolt's default is 8 million. The live row is removed immediately and Jolt may animate a static, noninteractive copy. Unsupported content or insufficient budget removes immediately: Web copies exclude form controls, canvas, media, embedded documents and other unsupported content. Native apps need rebuilt RC.15 classes. Cancellation, reinsertion, reduced motion, unmount and route teardown release copies. Pending operations remain owned until they finish, including a scope disposed inside the mutation.

This API is for nonvirtualized direct children. [MVirtualList](../components/virtual-list) uses its separate keyed `listChanges` controller; do not add an `animateLayout` owner to its recycled rows. Interactive drag reordering and `animateItems` entrance effects are separate contracts. <a href="/playground/#/checks/portable">Try keyed exits</a>. These additions are not in published Mavis RC.13; generated Swift exit support remains separate.

## Link motion to a section

Declare a stable section region separately from its animated child:

```ts
import { markRaw, onBeforeUnmount } from 'vue'
import {
  createMotionRegion,
  createMotionScrollSource,
  createMotionSurface,
  whenMotionAvailable,
} from '@getcortexlabs/mavis-core/experimental'

const scroll = markRaw(createMotionScrollSource())
const section = markRaw(createMotionRegion())
const artwork = markRaw(createMotionSurface())
onBeforeUnmount(
  whenMotionAvailable([scroll, section, artwork], () => {
    const link = artwork.scrollSection(
      scroll,
      section,
      { y: [0, -60], opacity: [0.3, 1] },
      {
        start: ['start', 'end'],
        end: ['end', 'start'],
      },
    )
    return () => link.dispose()
  }),
)
```

Bind `scroll` to `MScreen.motionScroll` with `scroll`, `section` to `MBox.motionRegion`, and `artwork` to a child `MCard.motionSurface`. Each point pairs a section edge with a viewport edge: `start`, `center` or `end`. Defaults run from the section's top reaching the viewport's bottom to its bottom reaching the viewport's top.

The adapters track layout changes and delegate numeric playback to Jolt. Reachable offsets are clipped to the scroll container; a section without a traversable range settles at the final frame. The contract is vertical, with CSS pixels on Web and DIPs natively. Keep the section itself geometrically stable; animate a separate child. Call `link.refresh()` after layout changes that do not emit observed size/content events. Disposal of the surface, section or scroll source releases observers and playback. Numeric `scrollLinked(..., { range })` remains available.

The current checkout also accepts `execution: 'auto' | 'scheduler'` for section motion. `scheduler` forces Jolt's JavaScript path on both renderers; `auto` selects the supported backend. A property taken over by a later application animation stays taken over when section geometry changes. <a href="/playground/#/checks/scroll-execution">Compare automatic execution and fallback</a>.

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
