# Design principles

Mavis should make the first screen easier to build and the next ten screens easier to keep consistent. These are the principles guiding the library's design.

::: info Design direction
Components and APIs are not released yet. This page describes what we're aiming for.
:::

## Consistent by default

A button, an input, and a sheet should look like they belong to the same app. Typography, spacing, colours, and corner shapes need a common foundation.

Shared theme values are the intended starting point. Individual components should still leave room for local adjustments.

## Every state matters

A component is more than its default appearance. Pressed, focused, disabled, loading, and error states need the same attention.

Accessibility labels, readable contrast, suitable touch targets, and reduced-motion preferences should be part of the design work from the beginning.

## Motion should explain the interaction

Press feedback confirms a touch. A transition helps connect two screens. An entering sheet shows where the new content came from.

[Jolt](https://jolt.rafaelaugusto.dev/) is the foundation for that work on NativeScript. Motion should be interruptible where appropriate and respect the user's reduced-motion preference.

## Keep the platform familiar

Back navigation, keyboard behaviour, and native screen presentation should follow the platform's conventions. Visual consistency should leave room for the differences between iOS and Android.

The first Vue integration will build on [vue-router-ns](https://vue-router-ns.rafaelaugusto.dev/) for navigation.

## Your app should still look like your app

The Mavis character gives this project a name and an identity. It does not mean every app using the library should share the website's palette.

The goal is useful defaults that you can change, with a clear relationship between a theme decision and the components it affects.
