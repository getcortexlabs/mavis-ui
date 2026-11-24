# AppKit Directory experiment

Run the existing Directory Vue screens and store as JavaScript, with native AppKit views exposed by `@nativescript/macos-node-api`. This is a private renderer experiment for [#367](https://github.com/getcortexlabs/mavis-ui/issues/367), not a new published package or a replacement for the SwiftUI target.

Requires macOS on Apple Silicon, Node 22.23.3 and Xcode command-line tools. The pinned runtime binary declares macOS 13.3 as its minimum; acceptance on that oldest OS is still pending. Intel and Windows are outside this slice.

From the repository root:

```sh
npm ci
npm ci --prefix examples/appkit
npm run build --prefix examples/appkit
npm start --prefix examples/appkit
```

Search, open a place, edit its name and save. Navigate → Back/Forward keeps the shared store. View → Toggle theme switches the existing Mavis/Midnight palettes. Help opens an AppKit sheet. Standard Edit menu shortcuts go to the native field editor. Data is stored in `~/Library/Application Support/Mavis AppKit Experiment/directory.json`; `MAVIS_APPKIT_STORAGE` overrides this path.

## What is shared

The build imports `Directory.vue`, `Details.vue`, `Edit.vue`, `directory-store.ts`, `routes.ts` and the existing `createDirectoryStorage` host boundary directly from `packages/create-mavis/templates/directory`. Those files are unchanged. Vue compiles the SFCs to JavaScript; Vue Router uses memory history. The app supplies asynchronous file persistence. No application logic is translated to Swift and no browser document renders the UI.

`src/renderer.ts` implements Vue's host operations. `src/host.mjs` owns AppKit views, weak target/delegate retention, layout, menus, native input and window cleanup. `src/components.ts` supplies only the components needed by Directory plus `MRow`. The native bridge is isolated in JavaScript because this beta does not provide a complete AppKit typing surface. The Vue renderer, facade and entry are typechecked.

The existing NativeScript-Vue renderer depends on NativeScript Core's mobile views. Wrapping AppKit in a separate Vue custom renderer avoids pretending those UIKit/Android classes already implement macOS. Extending NativeScript Core remains a possible upstream direction; it is not required to run this experiment.

## Motion boundary

Reveal opacity uses Jolt RC.17's sampled core tracks and a `CAKeyframeAnimation`. Core Animation owns playback and completion; the Cocoa event pump only delivers application events. There is no JavaScript animation-frame loop. Hide, removal and window close cancel the owned playback. Reduce Motion uses Jolt's instant track; system accessibility changes settle active reveals.

Jolt currently has no public AppKit entry. `build.mjs` checks the exact RC.17 version and bundles its private `core/track` and `core/transition` modules into this experiment. This is intentionally not a public Mavis motion API. Production adoption needs a supported Jolt AppKit adapter. Springs bound to live values, gestures, scroll ownership, layout transitions and the complete Mavis motion surface are not implemented here.

## Standalone app

```sh
npm run package --prefix examples/appkit
open "examples/appkit/artifacts/Mavis AppKit.app"
```

The `.app` includes its own Node executable, bundled Vue/Directory/Jolt JavaScript, NativeScript runtime and dependency licenses. It needs no installed Node, npm, Edge preview server or network connection at launch. The packager restores framework symlinks omitted by npm, signs the copied binaries and app ad hoc, and verifies that signature. It does not modify the installed dependency.

Ad hoc signing is for local development. Public distribution still requires an appropriate Developer ID signature for nested code, hardened-runtime entitlements suitable for Node/V8 and the native runtime, notarization and stapling. Those steps are not performed here. There is no updater or installer, and no claim of universal Intel/Apple Silicon distribution.

## Validation

```sh
npx tsc --noEmit -p examples/appkit/tsconfig.json
npx vitest run test/appkit-renderer.spec.ts
node scripts/check-appkit.mjs
```

The last command builds, packages and relocates the app to a temporary directory with spaces in its name, then runs it using its bundled Node/runtime. Native acceptance uses the AppKit event queue for mouse/keyboard input and checks search, route transitions, resize/theme state, failed and successful saves, persistence, Jolt/Core Animation, sheet cancellation and cleanup. It requires a WindowServer session in which the app can become key. It does not claim physical-pointer, accessibility or performance acceptance.

`node scripts/check-appkit.mjs --host-only` runs a separate diagnostic using native control actions and the native text editor. This can verify store/rendering/persistence while the session prevents mouse input. It explicitly does not establish visible animation or UI acceptance. Both variants write evidence under `artifacts/appkit`; the `AppKit packaged native acceptance` CI job runs the full variant.

## Boundaries and next stages

The creator provides NativeScript hosts for macOS and Windows. The former SwiftUI target is preserved on [archive/swiftui](https://github.com/getcortexlabs/mavis-ui/tree/archive/swiftui).

After native acceptance: stabilize the Jolt host boundary; extract a publishable AppKit renderer with explicit component capabilities; extend components by native interaction families; then add a distinct opt-in CLI target and migration guide. Unsupported components and DOM/Nuxt-specific dependencies must get explicit diagnostics. Running Vue JavaScript does not make browser APIs or arbitrary Nuxt modules native.

Upstream references: [NativeScript runtime](https://github.com/NativeScript/runtimes/tree/main/packages/macos-node-api), [AppKit example](https://github.com/NativeScript/runtimes/blob/main/platforms/apple/examples/appkit.js), [runtime PR #105](https://github.com/NativeScript/runtimes/pull/105), [Vue custom renderer](https://vuejs.org/api/custom-renderer.html). The experiment uses the published beta, not unmerged PR code.

Jolt adapter tracking: [rafaelaugustos/jolt#516](https://github.com/rafaelaugustos/jolt/issues/516).
