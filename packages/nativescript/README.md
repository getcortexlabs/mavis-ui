# Mavis UI for NativeScript

Experimental source package. It is private and has not been published to npm.

- `@mavis-ui/core`: shared themes, spacing, slider step conversion and Vue context.
- `src/native/`: NativeScript behavior, including owned Jolt press effects.
- `src/vue/`: Vue components, reactive theme context, and optional global registration.

The root entry exports themes and their types. The `/vue` entry exports components, `createMavis`, and `useMavisTheme`. NativeScript Core 9.1.3+, Jolt 0.1.0-rc.1+, and NativeScript-Vue 3.1.3+ are the initial baseline. The consuming Vue app installs all three; Vue is optional on the package metadata so importing theme values does not require a Vue renderer.

From the repository root, run `npm ci` and `npm run build`. Then run the app in `examples/garage`. See [the first-components guide](../../docs/guide/foundation.md) for the current API and limits.

Other NativeScript frameworks come after the Vue implementation. No adapters for React Native, Flutter, or direct native use are implemented here.
