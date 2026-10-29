---
title: Vehicle controls
description: A Mavis showcase with climate, battery, charging and navigation. See how components form a screen shared by NativeScript and Web.
---

# Vehicle controls

A composition with range, climate, charging preferences and access to details. The same Vue screens and state run in the native app and in the browser.

<a href="/playground/#/showcase/vehicle" target="_blank" rel="noopener">Explore the showcase ↗</a>

## Two themes

Screenshots of the native Android example in Midnight and Mavis.

<div style="display: flex; gap: 16px; flex-wrap: wrap; margin: 24px 0">
  <img src="/images/vehicle-midnight.png" alt="Vehicle controls with the Midnight theme" width="240" height="533" loading="lazy" style="border-radius: 16px; max-width: 100%; height: auto" />
  <img src="/images/vehicle-mavis.png" alt="Vehicle controls with the Mavis theme" width="240" height="533" loading="lazy" style="border-radius: 16px; max-width: 100%; height: auto" />
</div>

## How it is composed

| Screen area | Components |
| --- | --- |
| Structure and scrolling | [Screen](../components/screen), [Column](../components/column), [Row](../components/row) |
| Range and battery | [Text](../components/text), [Box](../components/box) |
| Climate and charge limit | [Card](../components/card), [Slider](../components/slider) |
| Actions and states | [Button](../components/button) |
| Additional preferences | [Reveal](../components/reveal) |

`shared/context.ts` keeps local values and receives a navigation interface. The native app provides vue-router-ns; Web provides Vue Router. Components use the same theme while rendering platform-specific controls.

## Screen source

<details>
<summary>View Vehicle.vue</summary>

<<< @/../examples/catalog/shared/pages/Vehicle.vue

</details>

This example demonstrates composition without connecting to real vehicles. To study an individual API, return to the [component catalog](../components/).
