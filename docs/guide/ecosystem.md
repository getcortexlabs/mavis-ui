---
description: "How NativeScript, Jolt, and vue-router-ns fit into Mavis UI. Understand the planned foundations for native components, animation, and navigation."
---

# Ecosystem

Mavis brings the UI layer. Jolt and vue-router-ns provide the animation and navigation foundations for its first integration.

## NativeScript

[NativeScript](https://nativescript.org/) is the starting platform. Mavis is intended for native iOS and Android interfaces, with NativeScript-Vue as the first framework integration.

## Jolt: animation

[Jolt](https://jolt.rafaelaugusto.dev/) is an animation library for NativeScript. It provides presets, springs, keyframes, and staggered animations for native views.

Mavis uses Jolt for button press feedback and reveal transitions. It is a required peer dependency: consuming apps install Jolt explicitly. The library preserves its reduced-motion configuration.

- [Jolt documentation](https://jolt.rafaelaugusto.dev/)
- [Getting started with Jolt](https://jolt.rafaelaugusto.dev/guide/)

## vue-router-ns: navigation

[vue-router-ns](https://vue-router-ns.rafaelaugusto.dev/) brings the Vue Router API to NativeScript-Vue 3, backed by native navigation stacks.

It is the navigation foundation for Mavis's first Vue integration. This includes screen flows using routes, tabs, and modal presentation. Navigation choices for the other frameworks will be addressed with those integrations.

- [vue-router-ns documentation](https://vue-router-ns.rafaelaugusto.dev/)
- [Getting started with vue-router-ns](https://vue-router-ns.rafaelaugusto.dev/guide/)

## What is available today?

Jolt and vue-router-ns have their own documentation and releases. Mavis has an experimental implementation and the Garage example in the repository, with no published package yet. [Run the example](./foundation).

See the [roadmap](./roadmap) for the planned scope.

## Vue Web

The Web implementation uses HTML, Vue, and Vue Router. Themes and Garage screens are shared with native. Jolt remains NativeScript-specific in this version; [Jolt #236](https://github.com/rafaelaugustos/jolt/issues/236) tracks Web support. [See the current implementation](./web).
