---
title: Component contract
description: Shared Mavis props, defaults, events, slots and platform boundaries for NativeScript-Vue and Vue Web.
---

# Component contract

The ten experimental components use the same Vue prop declarations in both renderers. Template types are derived from those declarations. This is the baseline for the next adapters; the alpha API remains experimental.

## Names, defaults and slots

Register components with `createMavis()` or import them individually. Vue accepts both `MButton` and `m-button`. With no theme provider, an individually imported component uses Mavis; changing themes across a screen requires the shared app provider.

| Component | Main defaults | Default slot | Events |
| --- | --- | --- | --- |
| Screen | `scroll=false` | Screen content | None |
| Row | `gap=none`, `align=center`, `justify=start`, `wrap=false` | Child components | None |
| Column | `gap=none`, `align=stretch`, `justify=start`, `wrap=false` | Child components | None |
| Box | No padding or radius | Layers in drawing order | None |
| Card | `padding=lg`, `radius=lg`, `gap=none`, `interactive=false`, `disabled=false` | Vertical content | `click`, no payload |
| Text | `variant=body`, `tone=text`, `as=p`, `align=left`, `wrap=true` | Text only | None |
| Icon | `size=md`, `tone=text`; `name` required; `label` optional | None | None |
| Button | `variant=primary`, `size=md`, `disabled=false`, `loading=false` | Text only | `click`, no payload |
| Slider | `modelValue=0`, `min=0`, `max=100`, `step=1`, `disabled=false`; `label` required | None | `update:modelValue`, number |
| Input | `modelValue=''`, `type=text`, `multiline=false`, `rows=3`; `label` required | None | `update:modelValue` and `submit`, string; `focus/blur`, no payload |
| Reveal | `show=false`; Column layout defaults | Conditional child components | None |
| Sheet | `open=false`, `dismissible=true`, `fullscreen=false`, `padding=lg`; `title` or `accessibilityLabel` required | Sheet content | `update:open`, boolean; `close`, reason |

Text and Button accept plain or interpolated text; surrounding slot whitespace is trimmed. Nested elements/components are rejected. An explicit `text` prop, including an empty string, takes precedence over the slot. A loading Button uses `loadingText` (default `Loading…`) and cannot emit `click`. A Card emits `click` only when interactive and enabled. An interactive Card represents one action: keep buttons, links and fields outside it.

## Layout values

Row, Column, Box, Card and Reveal accept `padding`, `paddingX`, `paddingY`, `radius`, `grow`, `shrink`, `width`, `height` and `backgroundColor`. Reveal also accepts the Column alignment, gap and wrapping props. Button and Text expose `grow` and `shrink`; Screen, Slider and Sheet have their own layout behavior, and Sheet applies `padding`, `gap` and `align` to its panel and content column.

- Spacing accepts theme tokens or finite, non-negative numbers. Axis padding overrides the corresponding sides of `padding`, including an explicit zero.
- Radius accepts a theme radius token or a finite, non-negative number.
- Dimensions accept finite, non-negative numbers, percentages such as `50%`, or `auto`. Numbers mean DIPs on native and CSS pixels on Web. Parent constraints determine percentage sizing.
- `grow` defaults to 0. `shrink` defaults to 1 inside Row and 0 inside Column. Both accept finite, non-negative numbers. Screen establishes a column context; Reveal participates in its parent layout and establishes a column for its children.

Invalid numeric values, spacing/radius tokens and portable dimensions throw a `RangeError` in both renderers. Enumerated props such as `variant` and `align` are checked by TypeScript and Vue's development validators. Unsupported values are not part of the API.

## Controlled values

Slider displays the closest allowed value without rewriting an out-of-range or unsnapped external model. User interaction emits a number only when the displayed value changes; disabled controls emit nothing. Updating the model from the application does not itself emit another update.

The final step reaches `max` even if the interval is shorter. For `min=0`, `max=1`, `step=0.3`, the allowed values are `0`, `0.3`, `0.6`, `0.9`, `1`. A supplied value of `0.96` displays `1`; a value of `0.94` displays `0.9`. Floating point rounding must not add an extra duplicate step.

## Attributes and platform boundaries

`id` identifies the rendered root, except on Input, Switch and Checkbox where it identifies the editor or toggle. `accessibilityLabel` and `accessibilityHidden` are typed common props, mapped to native accessibility properties and Web ARIA attributes. Slider uses its required `label` as the accessible name. Do not hide interactive controls from accessibility.

`class`, `style` and other undeclared attributes are forwarded to the rendered root; Reveal forwards them to its conditional column. Local styles override theme styles, and a layout prop that is not given leaves its style key untouched, so native attributes such as `paddingTop` survive re-renders. These are platform escape hatches: browser CSS, native properties and raw platform events are not portable Mavis APIs. Undeclared props accidentally consumed by an internal wrapper are not guaranteed behavior. Use `click` and `v-model` for shared interactions. Button enabled/loading state and Slider range/value fields remain owned by their declared props.

Native Screen renders a Page and needs a navigation host; Web Screen renders `main`. Native layouts use native views, Web layouts use flex/grid. Native Android sliders use step indices internally; iOS preserves its semantic native range. Button/Card/Reveal use Jolt in both environments; see [motion](./motion). Font metrics, safe areas and navigation transitions can differ.

## Native press and application motion

Native Button, interactive Card/ListItem and Switch label feedback multiply the current application scale through a private Jolt layer. For example, an app scale of `1.1` and a press factor of `0.96` display `1.056`. Retargeting the app to `1.2` while held displays `1.152`; release, disabling, a theme refresh or disposal removes only the press contribution and leaves `1.2`. Each attachment owns its layer, so an old cleanup cannot remove replacement feedback.

When changing scale while feedback or another Jolt layer is active, use Jolt `animate(nativeView, { scale: 1.2 })` or `set(nativeView, { scale: 1.2 })`. Those calls update the application's base inside Jolt's composition. Raw `scaleX`/`scaleY` or style writes while a layer is active bypass that base and are not a supported way to retarget it. Direct assignments before a press or after release has settled remain intact when feedback is removed.

The integration now uses Jolt `0.1.0-rc.5`. An [experimental surface reference](./motion#one-application-animation) demonstrates one application animation in both renderers. It is not a stable API or a physical-device performance guarantee.

## Review and migration notes

The [#19 review](https://github.com/getcortexlabs/mavis-ui/issues/19) removed duplicated prop/type declarations, typed Reveal's existing layout options and made Screen's column sizing explicit in both renderers. It also corrected floating point and partial-final-step Slider behavior.

If you used dimensions such as `width="240px"`, use `:width="240"`. Keep renderer-specific units in platform styles. Negative/non-finite geometry now fails consistently rather than relying on platform coercion. System theme selection and new frameworks remain separate work.

The [focus session](../showcase/focus) exercises the nine initial components in one shared screen. This consumer exercise exposed the missing Reveal layout types and a wrapper that forwarded dimensions without declaring them. Template checks now cover the shared catalog, direct imports and global component names. Behavioral conformance tests cover both renderers; browser tests and native checks cover the actual screen. These checks do not replace a full accessibility or physical-device audit.

Icon renders one Lucide glyph from the bundled font; it is decorative unless `label` names it, and it never consumes a slot. Input uses a string model, a visible label and explicit focus/submit events. Its `id` identifies the editor; `class`, `style`, `width`, `grow` and `shrink` apply to the whole field. See the [Input contract](../components/input) and the [profile screen](../showcase/profile).
