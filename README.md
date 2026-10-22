# Mavis UI

Native UI, with character.

Mavis UI is a UI library in development for **NativeScript**, starting with **NativeScript-Vue**. The goal is a cohesive set of components, themes, and screen patterns for iOS and Android, with motion and navigation considered from the start.

[Website](http://mavis-ui.getcortexlabs.com/) · [GitHub](https://github.com/getcortexlabs/mavis-ui)

Named after [Mavis Vermillion from Fairy Tail](https://www.fairytail-tv.com/character/), with a little of that imagination in the way we approach native UI.

## The direction

- **Components that belong together.** Buttons, inputs, cards, sheets, and everyday UI with a shared design language.
- **Room for your own style.** Color, typography, spacing, and shape that can adapt to the app.
- **Motion with purpose.** Press feedback, springs, and transitions using [Jolt](https://jolt.rafaelaugusto.dev/).
- **Native navigation.** Screen flows built around [vue-router-ns](https://vue-router-ns.rafaelaugusto.dev/).
- **Care in the details.** Accessible interactions, reduced-motion support, and layouts that feel at home on the device.

These are the foundations we're working toward, not a list of shipped features.

## Platform direction

Vue is the first integration, not the boundary of the project. We plan to support the other NativeScript frameworks next. React Native, Flutter, and direct native integrations are longer-term possibilities to explore, not committed releases.

Jolt and vue-router-ns are the foundation for the initial NativeScript-Vue integration. Navigation adapters for other frameworks will be considered as those integrations take shape.

## Status

Early development. There is no published package or stable component API yet. This repository currently contains the project README and documentation website. The docs describe the planned scope, design principles, and ecosystem.

Follow the repository for the first components and examples.

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
