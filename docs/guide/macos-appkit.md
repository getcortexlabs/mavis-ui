---
outline: deep
---

# NativeScript and AppKit experiment

The first implementation lives in [`examples/appkit`](https://github.com/getcortexlabs/mavis-ui/tree/main/examples/appkit), tracked by [#367](https://github.com/getcortexlabs/mavis-ui/issues/367). It runs the original Directory Vue screens, route table, reactive store and asynchronous storage service as JavaScript. It renders AppKit views without a WebView and does not translate application logic to Swift.

## Run from the source checkout

Use macOS on Apple Silicon, Node 22.23.3 and Xcode command-line tools:

```sh
npm ci
npm ci --prefix examples/appkit
npm run build --prefix examples/appkit
npm start --prefix examples/appkit
```

Search by name or city, open details, edit a place and save. Native menus provide Back/Forward, standard editing shortcuts and Mavis/Midnight theme switching. A native About sheet demonstrates presentation/cancellation. Persistence is scoped to this experiment in `~/Library/Application Support/Mavis AppKit Experiment/directory.json`.

Vue's custom renderer maps the small Directory component set to AppKit. The existing NativeScript-Vue renderer depends on Core's UIKit/Android views, so this experiment has its own host/facade. The shared Directory sources are imported directly without edits. DOM-dependent code and arbitrary Nuxt modules do not become native merely because JavaScript runs in the app.

## Motion and distribution

MReveal uses the public `@rafaelaugusto/jolt/appkit` driver to fade in with Core Animation. Hiding the content or removing its view interrupts playback. With Reduce Motion enabled the content appears at its final opacity.

`npm run package --prefix examples/appkit` creates `examples/appkit/artifacts/Mavis AppKit.app`, including Node, Vue/Directory/Jolt JavaScript, the NativeScript runtime and licenses. It launches without Edge, npm, an installed Node or a preview server. The packager restores framework links omitted by npm and verifies an ad hoc signature. Developer ID signing, hardened-runtime policy, notarization and public distribution remain separate work.

The pinned runtime is `@nativescript/macos-node-api@0.5.0-beta.0`, with an arm64 binary declaring macOS 13.3 as its minimum. Acceptance on that oldest OS, Intel and Windows is not claimed. Runtime PR [#105](https://github.com/NativeScript/runtimes/pull/105) is a reference; this build uses the published package.

`node scripts/check-appkit.mjs` packages and relocates the app, then drives AppKit mouse/keyboard events, editing, persistence, motion, sheets and cleanup. It requires a usable WindowServer session. The separate `--host-only` diagnostic exercises native control actions and the field editor; it does not replace visible UI acceptance. Neither is a claim of physical-pointer or accessibility parity. Evidence is written under `artifacts/appkit` and collected by the `AppKit packaged native acceptance` CI job.


Jolt adapter tracking: [rafaelaugustos/jolt#516](https://github.com/rafaelaugustos/jolt/issues/516).
