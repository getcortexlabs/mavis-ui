---
outline: deep
---

# NativeScript and AppKit experiment

::: info SwiftUI paused
NativeScript desktop is the current priority. SwiftUI stays in the repository and is available with `--macos-runtime swiftui`, but its native CI builds, packaging and UI validation are paused. Existing results do not establish validation of new changes.
:::

New macOS work prioritizes an AppKit renderer through NativeScript's Node-API runtime. **SwiftUI stays available**: its compiler, templates, capabilities and compatibility maintenance remain; further parity expansion has lower priority. The RC.15 creator defaults new `--targets macos` projects to AppKit and adds Windows; see the [native desktop guide](./native-desktop). The legacy `--target macos` retains SwiftUI.

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

Reveal opacity uses curves compiled by Jolt RC.17 and played by Core Animation. No JavaScript animation-frame loop was added. The adapter currently consumes private, version-checked Jolt core modules; it needs a supported upstream boundary before becoming a published renderer. It does not yet implement live values, gestures, scroll ownership or the full motion surface.

`npm run package --prefix examples/appkit` creates `examples/appkit/artifacts/Mavis AppKit.app`, including Node, Vue/Directory/Jolt JavaScript, the NativeScript runtime and licenses. It launches without Edge, npm, an installed Node or a preview server. The packager restores framework links omitted by npm and verifies an ad hoc signature. Developer ID signing, hardened-runtime policy, notarization and public distribution remain separate work.

The pinned runtime is `@nativescript/macos-node-api@0.5.0-beta.0`, with an arm64 binary declaring macOS 13.3 as its minimum. Acceptance on that oldest OS, Intel and Windows is not claimed. Runtime PR [#105](https://github.com/NativeScript/runtimes/pull/105) is a reference; this build uses the published package.

## Compare the two paths

| | AppKit experiment | Retained SwiftUI target |
| --- | --- | --- |
| Application logic | Vue/TypeScript runs as JavaScript | Supported source subset compiled to Swift |
| Directory | Original Vue screens/store and host storage interface | Same flow through compiler and typed host services |
| Components | Small set needed by Directory | Broader generated set with [documented limits](./macos-capabilities) |
| Motion | Finite Reveal opacity via a private Jolt adapter | Existing JoltSwiftUI integration |
| Runtime | Bundled Node and NativeScript | Native Swift application |
| Startup and memory | No comparative benchmark yet | No comparative benchmark in this experiment |

`node scripts/check-appkit.mjs` packages and relocates the app, then drives AppKit mouse/keyboard events, editing, persistence, motion, sheets and cleanup. It requires a usable WindowServer session. The separate `--host-only` diagnostic exercises native control actions and the field editor; it does not replace visible UI acceptance. Neither is a claim of physical-pointer or accessibility parity. Evidence is written under `artifacts/appkit` and collected by the `AppKit packaged native acceptance` CI job.

After native acceptance, the next stages are a supported Jolt host adapter, a publishable renderer with explicit capabilities, component families validated through native interaction, and a distinct opt-in CLI target. The current SwiftUI target is not silently switched or removed.

Jolt adapter tracking: [rafaelaugustos/jolt#516](https://github.com/rafaelaugustos/jolt/issues/516).
