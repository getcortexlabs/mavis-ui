# Mavis UI

Native UI, with character.

Mavis UI is a UI library in development for **NativeScript and the Web**, starting with **Vue**. The goal is a cohesive set of components, themes, and screen patterns for iOS and Android, with familiar layout concepts and motion and navigation considered from the start.

[Components](https://mavis-ui.getcortexlabs.com/components/) · [Showcase](https://mavis-ui.getcortexlabs.com/showcase/) · [Website](https://mavis-ui.getcortexlabs.com/) · [GitHub](https://github.com/getcortexlabs/mavis-ui)

Named after [Mavis Vermillion from Fairy Tail](https://www.fairytail-tv.com/character/), with a little of that imagination in the way we approach native UI.

## The direction

- **Components that belong together.** Buttons, inputs, cards, sheets, and everyday UI with a shared design language.
- **Room for your own style.** Color, typography, spacing, and shape that can adapt to the app.
- **Motion with purpose.** Press feedback, springs, and transitions using [Jolt](https://jolt.rafaelaugusto.dev/).
- **Native navigation.** Screen flows built around [vue-router-ns](https://vue-router-ns.rafaelaugusto.dev/).
- **Care in the details.** Accessible interactions, reduced-motion support, and layouts that feel at home on the device.

The first experimental implementation is available in this repository. Text inputs, icons and a sheet now join the foundation; the broader component collection is still planned.

## Platform direction

Vue is the first integration, not the boundary of the project. We plan to support the other NativeScript frameworks next. React Native, Flutter, and direct native integrations are longer-term possibilities to explore, not committed releases.

Jolt and vue-router-ns are the foundation for the initial NativeScript-Vue integration. Navigation adapters for other frameworks will be considered as those integrations take shape.

## Status

`0.1.0-alpha.3` is the current experimental prerelease, intended for testing in real apps. The API can change between alpha versions. The repository includes experimental NativeScript-Vue and Vue Web implementations, the shared component catalog, and the documentation website.

The initial components are `MScreen`, `MRow`, `MColumn`, `MBox`, `MCard`, `MText`, `MIcon`, `MButton`, `MInput`, `MSlider`, `MSheet`, and `MReveal`. Vue also accepts their `m-*` spellings. Layouts expose familiar spacing and alignment properties, buttons emit `click`, and inputs and sliders use `v-model`. Mavis and Midnight demonstrate two identities using the same components. Jolt is a required peer dependency of the NativeScript package. Web motion currently uses CSS; [Jolt #236](https://github.com/rafaelaugustos/jolt/issues/236) tracks browser support.

See [Getting started](https://mavis-ui.getcortexlabs.com/guide/foundation) for setup and [the component reference](https://mavis-ui.getcortexlabs.com/components/) for the experimental API.

## Install the alpha

In an existing NativeScript-Vue app:

```sh
npm install @getcortexlabs/mavis@0.1.0-alpha.3 @rafaelaugusto/jolt@0.1.0-rc.1
```

Register `createMavis` from `@getcortexlabs/mavis/vue`. For Vue Web, install `@getcortexlabs/mavis-web@0.1.0-alpha.3` and import its `style.css` entry. See [Getting started](https://mavis-ui.getcortexlabs.com/guide/foundation) for complete startup code.

The npm tag is `alpha`. Keep exact versions while testing. [Release notes](CHANGELOG.md) record the tested versions and known limitations, including expensive deep native layouts and an unresolved VoiceOver status-insertion case.

## Explore the components

[Open the component catalog](https://mavis-ui.getcortexlabs.com/playground/) or run it from a checkout with `npm ci`, `npm run build`, and `npm run web:dev`. The same screen files run in both examples. See [sharing with the Web](https://mavis-ui.getcortexlabs.com/guide/web) for setup and limits.

## Run the native catalog

With Node 22+ and a configured NativeScript development environment:

```sh
npm ci
npm run build
cd examples/catalog
npm ci
npm run android
# or npm run ios on macOS with Xcode
```

The catalog uses local packages so changes to the library can be tested before publication.

`MSwitch`, `MCheckbox`, `MRadioGroup` and `MSelect` are available on main for the next alpha; they are not part of `0.1.0-alpha.3`.

## Development

`packages/core/src` contains shared themes and Vue contracts. `packages/nativescript/src` handles native rendering and `packages/web/src` handles HTML rendering. `examples/catalog/shared` contains the screens and state used by both `examples/catalog` and `examples/catalog-web`. The current integration targets NativeScript Core 9.1.3+, NativeScript-Vue 3.1.3+, and Jolt 0.1.0-rc.1+.

Run `npm run check` at the root for type checking, component behavior tests, library compilation, and the documentation build. The example also has `bundle:android` and `bundle:ios` scripts. Bundle checks do not replace testing on a simulator or device. See [layout regression checks](test/native-layout.md) for the shared geometry fixture and native capture commands.

The [Screen checks](test/native-screen.md) cover safe areas, keyboard visibility, navigation and app resume.

The [performance protocol](test/performance.md) includes shared workloads, recorded native/Web baselines, cleanup checks and regression comparisons. Deep native layouts and catalog startup have measured limits tracked in [#56](https://github.com/getcortexlabs/mavis-ui/issues/56).

## License

Code and documentation are [MIT licensed](LICENSE). [Asset attribution](ASSETS.md) describes the separate status of website artwork, which is excluded from the npm packages.

## Website

The site uses **VitePress** and its standard documentation theme, with English and Portuguese pages, local search, and light and dark modes.

```sh
npm ci
npm run docs:dev
```

Build with `npm run docs:build`; preview the build with `npm run docs:preview`.
GitHub Actions builds and deploys the site to GitHub Pages on pushes to `main`.
The custom domain is declared in `docs/public/CNAME`.

---

Built by [Cortex Labs](https://getcortexlabs.com/).
