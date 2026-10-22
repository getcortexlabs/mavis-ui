# Mavis UI

Beautiful native interfaces, down to the details.

Mavis UI is a UI library in development for **NativeScript-Vue**. The goal is a cohesive set of components, themes, and screen patterns for iOS and Android, with motion and navigation considered from the start.

[Website](http://mavis-ui.getcortexlabs.com/) · [GitHub](https://github.com/getcortexlabs/mavis-ui)

## The direction

- **Components that belong together.** Buttons, inputs, cards, sheets, and everyday UI with a shared design language.
- **Room for your own style.** Color, typography, spacing, and shape that can adapt to the app.
- **Motion with purpose.** Press feedback, springs, and transitions using [Jolt](https://jolt.rafaelaugusto.dev/).
- **Native navigation.** Screen flows built around [vue-router-ns](https://vue-router-ns.rafaelaugusto.dev/).
- **Care in the details.** Accessible interactions, reduced-motion support, and layouts that feel at home on the device.

These are the foundations we're working toward, not a list of shipped features.

## Status

Early development. There is no published package or stable component API yet. This repository currently contains the project README and landing page only. The interactive previews on the website explore the visual direction; they are browser demos, not native components.

Follow the repository for the first components and examples.

## Website

The site is plain HTML, CSS, and JavaScript in `docs/`. No build step or dependencies.

```sh
python3 -m http.server 8080 --directory docs
```

Open `http://localhost:8080`. GitHub Pages serves `docs/` from `main`; `docs/CNAME` declares the custom domain.

---

Built by [Cortex Labs](https://getcortexlabs.com/).
