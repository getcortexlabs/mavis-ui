---
title: CollapsibleHeader
---

# CollapsibleHeader

::: info Incluído na RC.12
Disponível no Mavis 0.1.0-rc.12 para Vue + Vite, Nuxt e NativeScript. Mantenha os pacotes Mavis na mesma versão.
:::

<ComponentPreview component="collapsible-header" :height="1000" />

```vue
<MCollapsibleHeader title="Field notes" :image="cover" :height="540">
  <MColumn padding="lg"><Stories /></MColumn>
</MCollapsibleHeader>
```

| Prop                                        | Type             | Default                       | Contract                                                               |
| ------------------------------------------- | ---------------- | ----------------------------- | ---------------------------------------------------------------------- |
| `title / subtitle / image`                  | string           | —                             | Título, texto de apoio e imagem decorativa opcional.                   |
| `height / expandedHeight / collapsedHeight` | number           | 540 / 240 / 64                | Altura finita; expanded deve superar collapsed, que deve ser positivo. |
| `parallax / sectionHeight`                  | number           | 0.35 / 0                      | Fração de parallax entre 0 e 1 e altura da seção fixa.                 |
| `back / backLabel / topLabel`               | boolean / string | false / Go back / Back to top | Ação de retorno opcional e controles traduzíveis.                      |

Cabeçalho com imagem e duas apresentações do título. O conteúdo rola em uma região com altura definida; o componente não cria uma Page nativa. Use dentro de MScreen, evitando dar a esta região e ao pai a mesma responsabilidade de rolagem. Jolt controla colapso, parallax e limpeza. Slots: default, artwork, leading, actions e section. Ao usar section, defina sectionHeight com a altura da composição. O evento back pertence à aplicação; o botão de topo retorna esta região ao início.

Numa tela compartilhada para o destino experimental Mac, o cabeçalho recolhe com as mesmas alturas, a mesma troca de título e o mesmo parallax, pelo movimento ligado à rolagem do Jolt para SwiftUI. Veja [Listas longas, cabeçalhos que recolhem e atualização](../guide/macos-experimental#listas-longas-cabecalhos-que-recolhem-e-atualizacao) no guia do Mac.

<<< @/../examples/catalog/shared/demos/CollapsibleHeaderDemo.vue
