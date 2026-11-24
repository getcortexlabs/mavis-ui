---
title: NativeScript Mac and Windows
outline: deep
---

# NativeScript Mac and Windows

CLI RC.15 adds standalone **AppKit on macOS** and **XAML Islands on Windows**, using NativeScript's published Node-API runtimes. Vue runs the shared screens and state; each host renders native controls. There is no WebView or development server in the packaged application.

::: info Availability
These experimental presets are available in `@getcortexlabs/create-mavis@0.1.0-rc.15`. New `--targets macos` projects use AppKit. `--capabilities --json` reports each preset and its component coverage.
:::

## Create and run

```sh
npx @getcortexlabs/create-mavis@0.1.0-rc.15 studio --targets macos,windows --example directory --no-install
cd studio
npm run install:apps
npm run macos       # on macOS
npm run windows     # on Windows
```

Add `web` and/or `native` to share the same Vue sources with Vite/Nuxt and iOS/Android. `--web nuxt --rendering ssr` or `ssg` selects the Web host. Choose npm, pnpm or Yarn with `--package-manager`; all generated scripts and instructions use that manager.

`install:apps` installs each desktop runtime only on its matching OS. The projects have separate dependency trees under `apps/macos`, `apps/windows` and, when selected, `apps/mobile`. Keep desktop and mobile packages outside the Web workspace.

| Target  | Runtime                                     | Build/run requirements                                         | Packaging                                      |
| ------- | ------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------- |
| macOS   | `@nativescript/macos-node-api@0.5.0-beta.0` | Apple Silicon, macOS 13.3+, Node 22.23.3+                      | Xcode command-line tools; ad hoc signed `.app` |
| Windows | `@nativescript/windows-napi@1.0.0-beta.20`  | Windows 10 build 18362+, x64/arm64, Node 22.23.3+, Windows SDK | Unsigned portable folder with bundled Node     |

The minimum versions come from the runtime requirements, not tests on every OS/architecture. Hosted acceptance covers macOS arm64 and Windows x64 on Server 2025; Server 2022 hosted runners failed to present even the minimal XAML control probe. Run `create-mavis --doctor` on each target machine.

Windows XAML needs a compatibility manifest on its hosting executable. The generated launcher uses the SDK's `mt.exe` to prepare a **project-local copy of Node**; it does not modify the system Node installation. `MAVIS_MT` can select a Manifest Tool installed outside the standard SDK directory.

## Shared source and component scope

`shared/Welcome.vue` demonstrates controlled input, a counter and an asynchronous host service. `shared/Directory.vue` shares search, details, editing, a route table and persistence with the other selected hosts. Desktop stores data under the user's application-data directory, scoped to the generated project name.

The initial desktop subset is **MScreen, MColumn, MRow, MGrid, MText, MInput, MButton, MLink, MCard, MAlert, MEmptyState and MReveal**. It is smaller than the Vue Web/mobile catalog. The exact properties are in `--capabilities --json` → `desktop.contracts` and the generated `src/contract.mjs`. Unsupported properties raise an error.

- MRow gives its children equal-width columns. MGrid adapts to `minColumnWidth`.
- MInput supports text, label, placeholder, disabled/readonly, model updates, submit and escape.
- AppKit provides native application/editing/navigation menus and the limited `mod+s` button shortcut. Windows currently uses native control focus/keyboard behavior and in-screen navigation; arbitrary shortcut/menu APIs are not part of this subset.
- AppKit Reveal uses finite opacity sampled by the pinned Jolt version and played by Core Animation. The private integration is version-checked.
- Windows Reveal changes visibility immediately. A supported Jolt Windows XAML/Composition driver is tracked in [Jolt #519](https://github.com/rafaelaugustos/jolt/issues/519); continuous motion, gestures and scroll-linked recipes are not claimed.

NativeScript's desktop runtime support does not make its existing Core iOS/Android widget classes desktop controls. Mavis supplies a separate Vue host for these native desktop APIs. Nuxt server modules and DOM code remain Web-specific.

## Package the app

```sh
npm run build:macos
npm run package:macos
# On Windows:
npm run build:windows
npm run package:windows
```

Output lives under `apps/<target>/artifacts`. Both formats include Node, the native runtime and licenses, and can run outside the source checkout. The Mac app has an ad hoc signature and is not notarized. The Windows output is an unsigned folder with a launcher, not an installer. Public distribution requires your signing/notarization/installer setup.

## Add a desktop host

Inside an existing Mavis Vue app:

```sh
create-mavis --add-macos --shared-root src/shared --entry src/shared/Directory.vue
create-mavis --add-macos --shared-root src/shared --entry src/shared/Directory.vue --write
create-mavis --add-windows --shared-root src/shared --entry src/shared/Directory.vue --write
```

The preview checks the declared component/prop subset, keeps shared files in place and adds an isolated host plus root scripts. Existing destinations, conflicting scripts, symlinks and changes since preview are rejected. Install dependencies in the new host directory afterward. Directory's recorded example gets its route/storage wiring; for a custom entry, review `apps/<target>/src/main.ts` and install the app's own providers/router there. This is not automatic conversion of arbitrary Vue applications.

The SwiftUI compiler, templates and target-specific tests are preserved on [archive/swiftui](https://github.com/getcortexlabs/mavis-ui/tree/archive/swiftui). To create a macOS AppKit or Windows XAML app, see the [NativeScript desktop guide](./native-desktop).
