---
title: SortableList
---

# SortableList

::: info Adicionado na RC.11.1
Incluído no Mavis 0.1.0-rc.11.1 para Vue + Vite, Nuxt e NativeScript iOS/Android. Mantenha core e renderizadores na mesma versão.
:::

<ComponentPreview component="sortable-list" :height="850" />

```vue
<MSortableList v-model="tracks" itemKey="id" :itemLabel="(track) => track.title" label="Playlist">
  <template #default="{ item }"><MText :text="item.title" /></template>
</MSortableList>
```

| Prop                                                     | Tipo                                 | Contrato                                               |
| -------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------ |
| `modelValue / itemKey`                                   | `readonly T[] / keyof T or function` | Array controlado; chaves únicas e estáveis, padrão id. |
| `itemLabel`                                              | `(item: T) => string`                | Nome acessível da linha; usa a chave quando omitido.   |
| `height / disabled`                                      | `number / boolean`                   | 360 / false. Área rolável com altura limitada.         |
| `handleLabel / moveUpLabel / moveDownLabel / emptyLabel` | `string`                             | Controles traduzíveis.                                 |

Arraste pela alça dedicada. O Jolt cuida da elevação, deslocamento dos vizinhos, rolagem nas bordas e cancelamento; a aplicação aceita a ordem pelo `v-model`. Os botões de mover oferecem a mesma operação sem arraste. `reorder` emite `{ key, beforeKey, fromIndex, toIndex }`; identidades inexistentes e movimentos sem mudança não confirmam. O array recebido não é modificado.

O slot padrão recebe `{ item, index, itemKey }`; filhos com estado mantêm sua identidade ao mover. O slot `empty` substitui a mensagem vazia. Mudanças nos dados ou desativação cancelam o gesto. As linhas ficam montadas: use para playlists, prioridades e etapas, não como lista virtualizada ou Kanban entre colunas.

<<< @/../examples/catalog/shared/demos/SortableListDemo.vue
