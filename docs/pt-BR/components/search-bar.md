---
title: SearchBar
---

# SearchBar

Prévia para Vue Web e NativeScript em iOS e Android.

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

A digitação atualiza a consulta controlada. Enter ou a tecla Buscar do celular emite `submit(query)`. Limpar pede um valor vazio e devolve o foco ao campo. Cancelar tira o foco e emite `cancel`, deixando a navegação e a consulta salva com a aplicação. Use `clearLabel` e `cancelLabel` para traduzir as ações.

<<< @/../examples/catalog/shared/demos/SearchBarDemo.vue
