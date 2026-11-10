---
title: Architecture and support
description: Current Mavis renderers, framework-free contracts and the boundary between direct use, portable authorship and server-driven UI.
---

# Architecture and support

Mavis currently renders Vue components on the Web and NativeScript-Vue views on iOS and Android. A shared screen uses the same component API, while each host owns routing, data loading and platform services.

The table below comes from `targetCapabilities` in `@getcortexlabs/mavis-core`. It describes the repository. **Nuxt/hydration support is included in alpha.5; alpha.4 only had an import/render SSR smoke check.** Experimental means a tested, changeable contract, not stable support for every host or deployment mode.

<CapabilityTable />

Nuxt production SSR uses `node-server`. A prerendered `/static` route also works from a plain file server, with no runtime API. Streaming, selective/partial hydration, edge presets and server islands are unverified. RSC is not a Vue capability. [Setup and boundaries](./nuxt).

An [experimental macOS starter](./macos-experimental) compiles shared TSX screens (Mitosis component format) to SwiftUI and Vue. It is separate from the renderers in this table; the general compiler and full parity remain planned.

## A framework-free foundation

The package root imports without Vue, NativeScript, Jolt or DOM types. Theme tokens and behavioral helpers already live there. `componentContracts` now supplies plain property metadata for **Box, Row, Column, Text, Button and Input**; `describeContract(name)` produces JSON-compatible descriptions. `packages/core/src/vue/contracts.ts` derives the existing Vue props from this source for both current renderers. The remaining component declarations still live in the Vue boundary.

This metadata describes names, types, defaults, required values, token/unit references, semantic slots, events and controlled ownership. It is not a serialized application or a compiler. `runtimeOnly` values, including motion surfaces, cannot be sent as JSON. Rich object types such as Input actions remain TypeScript contracts; an executable schema for them belongs to the future portable/SDUI layers.

| Neutral intention | Current Vue boundary |
| --- | --- |
| Button `activate()` | `@click`, no platform event payload |
| Input `valueChange(string)` | `update:modelValue` / `v-model` |
| Input `submit`, `focus`, `blur`, `action` | Events with the same names |
| Input `focus()` / `blur()` handle | Exposed methods, no DOM or native-view handle |
| Text `text` / `spans` content | Default slot with text and `MSpan` |
| Button text and decorative edges | Default text slot, `leading` and `trailing` decoration slots |

The parent owns controlled values. An event requests a change; it does not mutate the parent's state. Native keyboard, focus, gesture and layout integration remains in the native renderer; browser form behavior remains in the Web renderer. Geometry numbers are DIPs on native and CSS pixels on Web. Line height is a ratio and letter spacing is in em; the `themeContract` export records units and token families. A font family name still requires a font installed/loaded by the application.

The [component contract](./component-contract) includes generated property tables. CI checks these descriptors against Vue props, both renderer contracts, catalog entries and bilingual reference coverage. A clean tarball consumer also typechecks using only ES libraries, with no framework or DOM declarations. This proves separation from Vue dependencies; a second framework adapter is still future work in [#145](https://github.com/getcortexlabs/mavis-ui/issues/145).

## Three ways forward

| Mode | Status | What owns execution |
| --- | --- | --- |
| Direct components | Experimental Vue Web and NativeScript-Vue | The application's framework and platform |
| Portable authorship | Experimental [macOS starter](./macos-experimental); general model in [#144](https://github.com/getcortexlabs/mavis-ui/issues/144) | Generated Vue/SwiftUI for the starter; broader target adapters remain planned |
| Server-driven UI | Planned; not enabled by SSR | A future validated document/action protocol and renderer |

SSR produces HTML for a Web request and hydrates it using the same initial data. It does not translate Vue into another framework, turn browser APIs into native APIs or enable remotely supplied UI documents. Shared components can receive serializable props from Nuxt; a NativeScript host can supply those same props from its own services. Nuxt-only APIs stay outside the shared component.

React Web, Next, Angular, Svelte, Solid and additional NativeScript integrations remain planned. React Native, Flutter, The complete SwiftUI and Compose integrations still need separate implementations and validation. The current work adds no React or Next package, general-purpose compiler, interop bridge or universal state engine. Follow the [roadmap](./roadmap) and [delivery index](https://github.com/getcortexlabs/mavis-ui/issues/1).
