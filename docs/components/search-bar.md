---
title: SearchBar
---

# SearchBar

Preview for Vue Web and NativeScript on iOS and Android.

<ComponentPreview component="search-bar" :height="660" />

```vue
<MSearchBar
  v-model="query"
  label="Find a photo"
  showCancel
  @submit="search"
  @cancel="leaveSearch"
/>
```

Type to update the controlled query. Return or the mobile Search key emits `submit(query)`. Clear requests an empty value and restores focus. Cancel blurs the editor and emits `cancel`, giving the application control of navigation and the stored query. Translate both actions with `clearLabel` and `cancelLabel`.

<<< @/../examples/catalog/shared/demos/SearchBarDemo.vue
