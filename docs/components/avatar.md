---
title: Avatar
description: Images, initials and identity with one API on NativeScript and Web.
---

# Avatar

`MAvatar` represents a person or team. It center-crops an image and keeps initials visible while loading or after a failure. Without a name, it uses the `user-round` icon.

::: info Next alpha
Available in the repository for the next alpha; not included in `0.1.0-alpha.3`.
:::

<ComponentPreview component="avatar" :height="1050" />

## Usage

```vue
<m-avatar :src="person.image" :name="person.name" size="lg" />
<m-avatar name="Mavis Studio" shape="square" />
<m-avatar accessibilityLabel="Guest" />
```

The app supplies `person`. Sources follow platform conventions: NativeScript accepts a `~/` path, file, `res://` resource, HTTPS URL or image data URI; Web accepts a browser-accessible URL or data URI. A native path is not converted into a Web URL. Map assets at the application boundary. The demos use an original PNG illustration as a data URI to work offline on both renderers.

## Props

| Prop | Type | Default | Behavior |
| --- | --- | --- | --- |
| `src` | `string` | `''` | Image source. Missing or failed sources keep the fallback. |
| `name` | `string` | `''` | Name for initials and the default accessible name. |
| `size` | `sm \| md \| lg \| xl` | `md` | 32, 48, 64 or 96 DIP/px. |
| `shape` | `circle \| square` | `circle` | Circle or square with rounded corners. |
| `accessibilityLabel` | `string` | `name` | Overrides the announced name. |
| `accessibilityHidden` | `boolean` | `false` | Hides the avatar when nearby text already identifies it. |
| `id` | `string` | — | Optional identifier. |

Initials use the first letter of the first and last words; a single word produces one letter. This is not a cultural surname parser. Background and initials use the theme's `primarySoft` and `primary`. Dimensions are fixed and do not shrink in Row. Initials and the icon act as a visual mark and do not follow text scaling; provide the name in Text beside the avatar.

## Loading and composition

Changing `src` immediately restores the fallback. Stale results are ignored, including native results after unmount. Native requests already in flight may finish in the background: the component does not cancel the connection, implement its own cache or resize files before download. Supply appropriately sized images. There is no automatic retry; change `src` or remount to retry.

Without a name or `accessibilityLabel`, the avatar is decorative. Inner images, initials and icons are not separately announced. There are no slots, events, image picker, upload or built-in action. Compose an appropriate, clearly named control for an action.

[Profile](../showcase/profile) combines Avatar, Badge and editable fields; the name remains app state.

## Full example

<details>
<summary>View source</summary>

<<< @/../examples/catalog/shared/demos/AvatarDemo.vue

</details>
