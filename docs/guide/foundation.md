---
title: Getting started
description: Run the Mavis UI catalog on Web, iOS or Android and register the components in a Vue application.
---

# Getting started

The API is experimental and no packages have been published to npm yet. Use a repository checkout to try it. The catalog opens on individual components; complete examples live in Showcase.

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
import { createMavis } from '@mavis-ui/nativescript/vue'
import { midnight } from '@mavis-ui/core'

app.use(createMavis({ theme: midnight }))
```

```ts [Web]
import { createMavis } from '@mavis-ui/web'
import { midnight } from '@mavis-ui/core'
import '@mavis-ui/web/style.css'

app.use(createMavis({ theme: midnight }))
```

:::

`app` is the Vue application created for your target platform. On NativeScript, a Screen needs a navigation host such as RouterView. The catalog includes complete startup code for both environments.

Components are registered as `MButton`, `MRow` and so on; Vue also accepts `m-button` and `m-row`. Individual imports are available too.

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
