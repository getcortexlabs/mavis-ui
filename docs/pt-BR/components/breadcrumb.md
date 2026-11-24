---
title: Breadcrumb
---

# Breadcrumb

::: info Adicionado na alpha.11
Incluído no Mavis 0.1.0-alpha.11 para Vue + Vite, Nuxt e NativeScript iOS/Android. Mantenha core e renderizadores na mesma versão.
:::

<ComponentPreview component="breadcrumb" :height="1000" />

```vue
<MBreadcrumb :items="path" :maxItems="3" label="Breadcrumb" />
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `readonly BreadcrumbItem[]` | required | Key única, label e href dos ancestrais; navigate opcional. Último item é a página atual. |
| `maxItems` | `number` | 4 | No mínimo dois. Ancestrais intermediários ficam acessíveis pelo botão de expansão. |
| `label / expandLabel` | `string` | Breadcrumb / Show full path | Rótulos localizáveis da navegação e expansão. |

O último item é texto com semântica de página atual. Ancestrais usam destinos reais MLink. Expandir mostra o caminho inteiro, sem outro modelo de navegação, e é reiniciado quando as identidades mudam. Caminhos longos quebram linha em telas estreitas. Separadores são decorativos.

Eventos: `error(unknown)`.

<<< @/../examples/catalog/shared/demos/BreadcrumbDemo.vue
