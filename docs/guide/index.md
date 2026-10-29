---
description: "Meet Mavis UI, a NativeScript component library starting with Vue. Learn about the planned components, platform support, and current development status."
---

# What is Mavis UI?

Mavis UI is a component library in development for **NativeScript**, starting with **NativeScript-Vue**. We're working toward a set of components, themes, and screen patterns that feel at home on iOS and Android.

The idea is straightforward: spend less time rebuilding the same UI, with enough control to make the result feel like your app.

::: info Project status
The repository includes an experimental NativeScript-Vue library and the Garage example app. There is no published package or stable component API yet. [Try the first components](./foundation) from a checkout.
:::

## A UI library

Mavis provides components and conventions for appearance, behavior, and layout. Use `m-row`, `m-column`, `gap`, and `padding` to compose screens without choosing NativeScript layout classes for everyday UI.

The initial direction includes:

- Everyday components: buttons, inputs, cards, and sheets.
- Theme values for colour, typography, spacing, and shape.
- Interaction states and animation built into the design.
- Screen patterns that work with native navigation.

This is the broader scope. The [first-components guide](./foundation) separates the implemented foundation from future work. The [design principles](./design) explain the decisions behind it.

## NativeScript first, Vue first

Vue is the first integration. Support for the other NativeScript frameworks is the next step we want to take.

React Native, Flutter, and direct native integrations may follow further down the line. They are possibilities to explore, not announced releases. See the [roadmap](./roadmap) for the current direction.

## Motion and navigation

[Jolt](https://jolt.rafaelaugusto.dev/) is the animation foundation for NativeScript components. [vue-router-ns](https://vue-router-ns.rafaelaugusto.dev/) supplies the navigation foundation for the first Vue integration.

Learn how these fit together in the [ecosystem guide](./ecosystem).

## On the Web too

The Vue Web implementation shares themes, props, and Garage screens with NativeScript-Vue. [Explore Web support and its limits](./web).

## Why Mavis?

The name comes from **Mavis Vermillion, from Fairy Tail**. The character also informs the site's colours: the pink ribbon, light blue panels, and ivory dress.

That reference gives the project its personality. The components themselves are intended to adapt to your app's visual identity.

## Follow the project

Development happens in [getcortexlabs/mavis-ui](https://github.com/getcortexlabs/mavis-ui). The [first-components guide](./foundation) covers the current experimental API and how to run the native example.
