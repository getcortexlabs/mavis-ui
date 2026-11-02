---
title: Getting started
description: Run the Mavis UI catalog on Web, iOS or Android and register the components in a Vue application.
---

# Getting started

Version `0.1.0-alpha.3` is a prerelease for trying Mavis in real apps. The API can change between alpha versions. Code and documentation use the MIT license.

## Install in your app

In an existing **NativeScript-Vue** app using Core 9.1.3 and NativeScript-Vue 3.1.3:

```sh
npm install @getcortexlabs/mavis@0.1.0-alpha.3 @rafaelaugusto/jolt@0.1.0-rc.1
```

Jolt is required. The core package is installed as a Mavis dependency. Android adapter changes require a native build; when upgrading an existing app, run `ns clean` if metadata from an earlier version remains.

In a **Vue Web** app using Vue 3.5.42:

```sh
npm install @getcortexlabs/mavis-web@0.1.0-alpha.3
```

Import `@getcortexlabs/mavis-web/style.css` in the app entry. Published Web alpha.3 needs neither the native SDKs nor Jolt. Repository builds require Jolt rc.5 for the next alpha; see [motion](./motion).

The packages use the npm `alpha` tag; keep the exact version while testing. Deep native layouts can still be slow ([#56](https://github.com/getcortexlabs/mavis-ui/issues/56)). VoiceOver may skip a newly inserted offscreen status ([#54](https://github.com/getcortexlabs/mavis-ui/issues/54)). Device and keyboard coverage is incomplete. Read the [release notes](https://github.com/getcortexlabs/mavis-ui/blob/main/CHANGELOG.md) before adopting the alpha.

The catalog opens on individual components; complete examples live in Showcase. To contribute or run the catalog from source, follow the steps below.

## Run on the Web

With Node 22 or later:

```sh
git clone https://github.com/getcortexlabs/mavis-ui.git
cd mavis-ui
npm ci
npm run build
npm run web:dev
```

Open `/playground/` at the URL printed by Vite. <a href="/playground/" target="_blank" rel="noopener">You can also open the published catalog ↗</a>

## Run on NativeScript

With a configured [NativeScript environment](https://docs.nativescript.org/setup/), after installing and building the packages at the root:

```sh
cd examples/catalog
npm ci
npm run android
# On macOS with Xcode:
npm run ios
```

The app explicitly installs NativeScript-Vue, Jolt and vue-router-ns. Jolt is required by the NativeScript package. After changing library packages, run `npm run build` at the root and restart the app.

## Register components

::: code-group

```ts [NativeScript]
import { createMavis } from '@getcortexlabs/mavis/vue'
import { midnight } from '@getcortexlabs/mavis'

app.use(createMavis({ theme: midnight }))
```

```ts [Web]
import { createMavis } from '@getcortexlabs/mavis-web'
import { midnight } from '@getcortexlabs/mavis-web'
import '@getcortexlabs/mavis-web/style.css'

app.use(createMavis({ theme: midnight }))
```

:::

`app` is the Vue application created for your target platform. On NativeScript, a Screen needs a navigation host such as RouterView. The catalog includes complete startup code for both environments.

For a native screen without a router, the minimal entry is:

```ts
import { createApp, h } from 'nativescript-vue'
import { createMavis } from '@getcortexlabs/mavis/vue'
import App from './App.vue'

// App.vue has one MScreen at its root.
createApp({ render: () => h('Frame', {}, [h(App)]) })
  .use(createMavis())
  .start()
```

Components are registered as `MButton`, `MRow` and so on; Vue also accepts `m-button` and `m-row`. Individual imports are available too. With `@nativescript/vite`, write `MButton` and `MRow`: its Vue compiler treats hyphenated tags as native elements unless your `vite.config.mts` changes `isCustomElement`. Both `@nativescript/webpack` and `@nativescript/vite` pick up the Mavis iOS and Android files.

## Build your first composition

```vue
<m-screen scroll>
  <m-column padding="lg" gap="md">
    <m-text as="h1" variant="title">Your space.</m-text>
    <m-card gap="md">
      <m-text>Ready when you are.</m-text>
      <m-button @click="save">Save</m-button>
    </m-card>
  </m-column>
</m-screen>
```

`save` belongs to your application. Continue with the [component catalog](../components/), customize [themes](./themes), or see components in the [Showcase](../showcase/).
