# Mavis component catalog

A NativeScript-Vue catalog with a page for each Mavis component, two themes, and a separate Showcase section. The vehicle composition demonstrates layouts, controls, state and navigation together; its data is local demonstration data.

From the repository root:

```sh
npm ci
npm run build
cd examples/catalog
npm ci
npm run android
# or npm run ios on macOS with Xcode
```

The NativeScript CLI and native SDKs must already be configured. The Android build uses SDK 36 and requires `ANDROID_HOME` to point to your Android SDK. iOS requires working Xcode and CocoaPods installations.

After changing library sources, rebuild at the repository root and restart the app. `npm run bundle:android` and `npm run bundle:ios` validate the JavaScript bundles without compiling or launching a native app; they do not validate native rendering.

The sample pins TypeScript 6 because the current NativeScript webpack tooling uses the TypeScript JavaScript compiler API.

The screens and app state live in `shared/` and are also used by `../catalog-web`. The native entry provides vue-router-ns behind a navigation interface; shared screens import Vue APIs from `vue`, which the native build aliases to NativeScript-Vue.
