---
description: "Meet Mavis UI, a NativeScript component library starting with Vue. Learn about the planned components, platform support, and current development status."
---

# What is Mavis UI?

Mavis UI is a component library in development for **NativeScript**, starting with **NativeScript-Vue**. We're working toward a set of components, themes, and screen patterns that feel at home on iOS and Android.

The idea is straightforward: spend less time rebuilding the same UI, with enough control to make the result feel like your app.

::: info Project status
This repository currently contains the README and documentation website. There is no published package, installation command, or stable component API yet.
:::

## A UI library

Mavis is a UI library. It will sit alongside NativeScript and your framework, providing components and conventions for how they look and behave.

The initial direction includes:

- Everyday components: buttons, inputs, cards, and sheets.
- Theme values for colour, typography, spacing, and shape.
- Interaction states and animation built into the design.
- Screen patterns that work with native navigation.

These describe the intended scope, not features available today. The [design principles](./design) explain the decisions behind it.

## NativeScript first, Vue first

Vue is the first integration. Support for the other NativeScript frameworks is the next step we want to take.

React Native, Flutter, and direct native integrations may follow further down the line. They are possibilities to explore, not announced releases. See the [roadmap](./roadmap) for the current direction.

## Motion and navigation

[Jolt](https://jolt.rafaelaugusto.dev/) is the planned animation foundation for NativeScript components. [vue-router-ns](https://vue-router-ns.rafaelaugusto.dev/) supplies the navigation foundation for the first Vue integration.

Learn how these fit together in the [ecosystem guide](./ecosystem).

## Why Mavis?

The name comes from **Mavis Vermillion, from Fairy Tail**. The character also informs the site's colours: the pink ribbon, light blue panels, and ivory dress.

That reference gives the project its personality. The components themselves are intended to adapt to your app's visual identity.

## Follow the project

Development will happen in [getcortexlabs/mavis-ui](https://github.com/getcortexlabs/mavis-ui). When the first components are ready, these docs will include installation instructions, runnable examples, and an API reference.
