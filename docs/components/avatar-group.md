---
title: AvatarGroup
---

# AvatarGroup

Preview for Vue Web and NativeScript on iOS and Android.

<ComponentPreview component="avatar-group" :height="660" />

```vue
<MAvatarGroup :members="contributors" :maxVisible="3" size="lg" />
```

Pass members in display order, each with a unique string `id`, a `name` and an optional image `src`. The first `maxVisible` portraits appear in the stack, followed by the count of additional people. The default is four portraits. Each uses the image and initials fallback from Avatar. Size accepts `sm`, `md`, `lg` and `xl`.

<<< @/../examples/catalog/shared/demos/AvatarGroupDemo.vue
