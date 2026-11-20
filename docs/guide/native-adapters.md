---
title: Direct NativeScript adapters
description: NativeScript foundations for React, Angular, Svelte, Solid and plain JavaScript or TypeScript.
---

# Direct NativeScript adapters

The repository includes five direct adapters built on the neutral foundation contracts: **MBox, MRow, MColumn, MText, MButton and MInput**. Each adapter uses its framework's own state and lifecycle with NativeScript views. No Vue runtime, WebView or portable compiler is required by these entrypoints.

This work is unreleased after RC.14. The native acceptance matrix is part of PR #379; until it passes, treat these entrypoints as under validation. This page describes the six-component foundation slice, not the complete Vue catalog.

| Framework | Package / entrypoint | Consumer versions |
| --- | --- | --- |
| JavaScript / TypeScript | `@getcortexlabs/mavis/native` | NativeScript Core 9.1.3 |
| React NativeScript | `@getcortexlabs/mavis-react-nativescript` | React 18.3.1, react-nativescript 5.0.0 |
| Angular | `@getcortexlabs/mavis-angular-nativescript` | Angular 22.3.0, @nativescript/angular 22.0.2 |
| Svelte Native | `@getcortexlabs/mavis-svelte-nativescript` | Svelte 4.2.20, @nativescript-community/svelte-native 1.0.32 |
| Solid Native | `@getcortexlabs/mavis-solid-nativescript` | Solid 2.0.0, @nativescript-community/solid-js 2.0.1, DOMiNATIVE 0.1.3 |

The consumer pins Node 22.23.3, TypeScript 6.0.3, NativeScript iOS 9.1.0, Android 9.1.1 and Jolt 0.1.0-rc.16. React Native is a separate renderer and is not provided by the React NativeScript package.

## Run the catalog slice

From this checkout, with the [NativeScript environment](https://docs.nativescript.org/setup/) installed:

```sh
npm ci
npm run build
cd examples/native-adapters
npm ci
ns run ios --env.framework=react
# Or: ns run android --env.framework=angular
```

Choose `plain`, `react`, `angular`, `svelte` or `solid`. The app uses the shared catalog's `App_Resources` directory. The [consumer manifest](https://github.com/getcortexlabs/mavis-ui/blob/main/examples/native-adapters/package.json) and Webpack configuration are the executable installation reference. They contain all five frameworks for this comparison; an application needs only its selected framework and renderer, Mavis, Mavis Core, NativeScript and Jolt.

For an existing app, import the explicit framework entrypoint and keep its normal NativeScript bootstrap and navigation host. Copy `@getcortexlabs/mavis/fonts/lucide.ttf` into the application's `fonts` folder when using icon props. The example's Webpack copy rule does this automatically. Do not point a browser bundler at a native entrypoint.

React NativeScript and stable Svelte Native still declare Core 8 peers. The consumer has targeted overrides selecting Core 9.1.3. Jolt's optional framework peers also reject Solid 2 and Svelte 4 even when only its imperative native API is used; [Jolt #517](https://github.com/rafaelaugustos/jolt/issues/517) tracks that packaging boundary. Keep these overrides scoped to the named packages, as in the consumer manifest. They do not establish compatibility for `jolt/solid` or `jolt/svelte` framework hooks, which these adapters do not import.

Svelte Native's 5.0.0-alpha.0 package imports `svelte/renderer`, absent from the published Svelte 5.57.3 package inspected for this delivery. This slice therefore uses stable Svelte 4. Solid 2 uses its current context and renderer APIs; pin its browser/client exports as the example does so a NativeScript build does not select the nonreactive server entry.

## JavaScript and TypeScript

`createMavis()` owns one theme scope. `create()` returns a view and separate update, focus and disposal intentions. Add layout children through the returned native layout view.

```ts
import { createMavis } from '@getcortexlabs/mavis/native'

const ui = createMavis()
let value = 'Ada'
const field = ui.create(
  'MInput',
  { label: 'Name', modelValue: value },
  {
    valueChange(next) {
      value = next
      field.update({ label: 'Name', modelValue: value })
    },
  },
)
const column = ui.create('MColumn', { padding: 'lg', gap: 'md' })
column.view.addChild(field.view)
// Mount column.view in the app's Page. On final ownership release:
// field.dispose(); column.dispose()
```

Updates are complete prop snapshots; omitted optional properties return to their defaults. Calling `update()` after final disposal throws. Temporary native unload does not dispose the application object, so retained views can load again.

## React NativeScript

Use components and ordinary React state. `MInput` requests `onValueChange`; the owner chooses whether to update its value. A forwarded ref exposes `{ view, focus(), blur(), focusAction() }`.

```tsx
import { useState } from 'react'
import { MColumn, MInput, MButton } from '@getcortexlabs/mavis-react-nativescript'

function Form() {
  const [name, setName] = useState('Ada')
  return (
    <MColumn padding="lg" gap="md">
      <MInput label="Name" modelValue={name} onValueChange={setName} />
      <MButton onClick={() => save(name)}>Save</MButton>
    </MColumn>
  )
}
```

The native renderer owns mounting and unmounting. Plain text children are accepted by Text and Button; an explicit `text`, including `''`, takes precedence.

## Angular

Import the standalone directives individually or spread `MAVIS_COMPONENTS` into a standalone component's `imports`. Mavis registers both `MInput` and `m-input` native element names. The library is published with Angular partial compilation.

```html
<MColumn padding="lg" gap="md">
  <MInput label="Name" [modelValue]="name()" (modelValueChange)="name.set($event)" />
  <MButton text="Save" (click)="save(name())" />
</MColumn>
```

`[(modelValue)]` also works with an assignable owner property. Native `Page`/`Frame` elements come from NativeScript Angular. A directive reference exposes `view`, `focusInput()`, `blurInput()` and `focusAction()`. Use `[mavisTheme]="themeData"` on an ancestor with `MThemeProvider` imported for a scoped theme, or pass a `MavisThemeScope` through `[theme]`.

## Svelte Native

Svelte 4 wrappers dispatch semantic component events. Keep the model controlled with an explicit owner assignment; these wrappers do not silently mutate `modelValue` or implement an independent editing store.

```svelte
<script>
  import { MColumn, MInput, MButton } from '@getcortexlabs/mavis-svelte-nativescript'
  let name = 'Ada'
</script>

<MColumn padding="lg" gap="md">
  <MInput label="Name" modelValue={name} on:valueChange={event => name = event.detail} />
  <MButton on:click={() => save(name)}>Save</MButton>
</MColumn>
```

`bind:this` exposes `focusInput()`, `blurInput()` and `focusAction()`. Layout default slots accept components; Text and Button slots accept plain/interpolated text. The package ships compiled Svelte 4 client components. Compile the application's `.svelte` files using its normal Svelte Native build configuration.

## Solid Native

Use Solid state accessors inside component props and the NativeScript universal renderer. Do not destructure a reactive props object before passing its current values. The runnable consumer shows both the renderer's `createComponent` form and the required export resolution.

```tsx
const [name, setName] = createSignal('Ada')
<MColumn padding="lg" gap="md">
  <MInput label="Name" modelValue={name()} onValueChange={setName} />
  <MButton onClick={() => save(name())}>Save</MButton>
</MColumn>
```

Import the components from `@getcortexlabs/mavis-solid-nativescript`. A `ref` receives the native view, whose `focusInput()`, `blurInput()` and `focusInputAction()` keep focus intentions distinct from the framework's rendering state. Disposal belongs to the Solid owner.

## Themes, motion and ownership

`createMavisTheme(themeData)` returns a scope with `setTheme(next)`. React, Svelte and Solid expose `MThemeProvider` with that scope. Native views subscribe while loaded, release subscriptions on unload, and repaint from the latest scope on reload. A component-level `theme` overrides an ancestor scope. Applications own system-appearance selection and pass the desired theme data; this slice does not install Vue's application services.

Buttons use the existing native Jolt press integration. Box, Text and Button accept the neutral `motionSurface`; Box, Row and Column accept `motionRegion`. These reuse native surface and region ownership, including reduced-motion handling. They start when the native view loads and release resources on unload or final disposal. Framework hooks are not an additional animation engine.

Navigation belongs to the application. Button `navigate` callbacks can use that framework's NativeScript router; external `href` uses the native URL service. No Vue router is installed. Web-only form attributes do not create native HTML forms. NativeScript targets have no Web SSR, hydration, static HTML or RSC support.

## Coverage boundary

The initial foundation uses the neutral prop names and defaults. It includes layout dimensions/tokens, text typography, icon props, disabled/loading text, controlled single-line and multiline inputs, input actions, themes and native motion references. The full Vue catalog and its application services are not re-exported.

Rich `MSpan` content, custom leading/trailing Button decoration slots, retained reorder handles and animated Button loading decorations are not implemented in this initial direct slice. Unsupported `reorderHandle=true` or a non-`none` `loadingIndicator` produces a diagnostic. Keep custom interactive content outside Button. Use native view refs for platform-specific work, while allowing Mavis to own its declared presentation properties.

Direct framework support does not add a portable authoring frontend. The shared compiler's semantics and framework generators remain the separate boundary tracked by #146.

The dedicated native workflow installs release tarballs and checks framework state updates, native activation, controlled editing, identity/focus, independent themes and Jolt mount/remount/disposal. Recordings and reports are CI artifacts. These simulator/emulator checks do not establish physical-device performance or a complete accessibility audit.

Each framework has a separate package so its peers do not affect other framework installations. Install only the selected adapter, alongside matching Mavis and Mavis Core versions. The nine release packages are coordinated; these four new packages have not been published yet.

Svelte Native 1.0.32 wraps Svelte 4 CustomEvent payloads incorrectly. The Svelte adapter applies a feature-detected fix after native DOM initialization, preserving `detail` and cancellation semantics; [#380](https://github.com/getcortexlabs/mavis-ui/issues/380) tracks removal once upstream conforms (upstream issues are disabled).
