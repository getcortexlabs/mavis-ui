# Mavis catalog for Web

Vue Web entry for the component catalog and Showcase. It imports the screens and application state from `../catalog/shared`; there are no duplicate Web templates.

From the repository root:

```sh
npm ci
npm run build
npm run web:dev
```

Open `/playground/` on the URL printed by Vite. `npm run web:build` writes the static demo into `docs/.vitepress/dist/playground`. The documentation deploy includes it.

The app uses Vue Router hash history for static hosting and a small navigation interface shared with the native entry. Browser motion uses CSS until Jolt supports DOM elements. NativeScript SDKs are not needed to run this example.

Documentation previews use the same demos through `/playground/#/preview/:id`, with `theme` and `lang` query options. For local docs development, run `npm run web:dev` and `npm run docs:dev` in separate terminals; VitePress proxies preview requests to the Web dev server.
