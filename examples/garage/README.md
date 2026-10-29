# Mavis Garage

A NativeScript-Vue app built with Mavis components. It includes two themes, climate and charge sliders, Jolt press and reveal animations, and two pages connected by vue-router-ns. All vehicle data is local demonstration data.

From the repository root:

```sh
npm ci
npm run build
cd examples/garage
npm ci
npm run android
# or npm run ios on macOS with Xcode
```

The NativeScript CLI and native SDKs must already be configured. The Android build uses SDK 36 and requires `ANDROID_HOME` to point to your Android SDK. iOS requires working Xcode and CocoaPods installations.

After changing library sources, rebuild at the repository root and restart the app. `npm run bundle:android` and `npm run bundle:ios` validate the JavaScript bundles without compiling or launching a native app; they do not validate native rendering.

The sample pins TypeScript 6 because the current NativeScript webpack tooling uses the TypeScript JavaScript compiler API.
