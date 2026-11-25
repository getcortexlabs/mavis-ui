---
title: TagInput
---

# TagInput

Preview for Vue Web and NativeScript on iOS and Android.

<ComponentPreview component="tag-input" :height="660" />

```vue
<MTagInput v-model="tags" label="Photo tags" :maxTags="8" />
```

Enter or a comma commits a tag. Paste a comma- or newline-separated list to add several at once. Whitespace is trimmed and duplicates are compared without case. Tags beyond `maxTags` stay in the editor. Each chip has a remove action. On Web, Backspace in an empty field removes the last tag. Translate the actions with `addLabel` and `removeLabel`.

<<< @/../examples/catalog/shared/demos/TagInputDemo.vue
