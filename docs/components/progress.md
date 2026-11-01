---
title: Progress
description: Linear progress for known values and indeterminate work on NativeScript and Web.
---

# Progress

`MProgress` shows how far a task has advanced, or a moving segment when its total is unknown. The app owns the task and supplies its state.

::: info Next alpha
Available in the repository for the next alpha; not included in `0.1.0-alpha.3`.
:::

<ComponentPreview component="progress" :height="1000" />

## Usage

```vue
<m-progress :value="64" label="Collection download" tone="accent" />
<m-progress indeterminate label="Preparing collection" indeterminateLabel="Preparing" />
```

## Props

| Prop | Type | Default | Behavior |
| --- | --- | --- | --- |
| `value` | `number` | `0` | Finite value, clamped between zero and max. |
| `max` | `number` | `100` | Finite, strictly positive upper bound. |
| `label` | `string` | required | Nonempty accessible name; does not render visible text. |
| `indeterminate` | `boolean` | `false` | Shows a moving segment instead of a known percentage. |
| `indeterminateLabel` | `string` | `Loading` | Nonempty accessible description for indeterminate work; translate in the app. |
| `size` | `sm \| md \| lg` | `md` | Track heights of 4, 8 and 12 DIP/px. |
| `tone` | `primary \| accent \| success \| warning \| danger` | `primary` | Themed fill color. |
| `width / grow / shrink` | dimension / number / number | `auto / 0 / context` | Layout participation, as in Box. |
| `id / accessibilityHidden` | string / boolean | — / false | Optional identifier and accessibility exclusion. |

Numbers use DIP on native and px on Web. In Column, the track fills available width; in Row, give it a width or use `width=0` with `grow=1`. Invalid numeric inputs throw `RangeError`, including in indeterminate mode; empty labels throw `TypeError`. The accessible percentage is rounded to at most one decimal. It is not a promise of automatic announcements for each update.

## State and motion

There are no slots or events. Add visible labels, percentages, cancel/retry actions and success/error messages alongside the track. A full bar does not complete a task, change its tone or remove itself. Known values update the fill directly, without a tween or internal timer.

Indeterminate mode moves a 32% segment within the track in a 1.6-second cycle: Jolt on native and CSS on Web. Reduced motion keeps this segment centered with no loop. Native motion stops in the background and releases animations, timers and listeners on unload/unmount; retained pages restart on load. Web pauses in hidden tabs and removes its visibility listener on unmount. Scrolling out of view does not unmount the component.

The native element exposes a progress-bar role and a percentage or indeterminate description. Web uses `role=progressbar`, min/max and the current value; indeterminate mode omits `aria-valuenow`. Supply a concise label. There is no circular variant, task service or estimated completion time.

[Library](../showcase/library) demonstrates preparation, progress, cancellation and retry using local timers, without transferring files.

## Full example

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/ProgressDemo.vue

</details>
