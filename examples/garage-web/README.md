# Garage Web

Vue Web entry for the Garage example. It imports the screens and application state from `../garage/shared`; there are no duplicate Web templates.

From the repository root:

```sh
npm ci
npm run build
npm run web:dev
```

Open `/garage/` on the URL printed by Vite. `npm run web:build` writes the static demo into `docs/.vitepress/dist/garage`. The documentation deploy includes it.

The app uses Vue Router hash history for static hosting and a small navigation interface shared with the native entry. Browser motion uses CSS until Jolt supports DOM elements. NativeScript SDKs are not needed to run this example.
