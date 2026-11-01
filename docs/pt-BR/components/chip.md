---
title: Chip
description: Filtros de assuntos e tags removíveis com ações independentes no NativeScript e na Web.
---

# Chip

`MChip` apresenta um rótulo curto em uma coleção: estático, selecionável, removível ou com seleção e remoção juntas.

::: info Próxima alpha
Disponível no repositório para a próxima alpha; não está em `0.1.0-alpha.3`.
:::

<ComponentPreview component="chip" :height="850" />

## Uso

```vue
<script setup lang="ts">
import { ref } from 'vue'
const design = ref(true)
const tags = ref(['Vue', 'NativeScript'])
</script>

<template>
  <m-chip v-model="design" selectable label="Design" icon="palette" />
  <m-row gap="sm" wrap>
    <m-chip v-for="tag in tags" :key="tag" :label="tag" removable
      :removeLabel="`Remover ${tag}`" @remove="tags = tags.filter(value => value !== tag)" />
  </m-row>
</template>
```

## Propriedades

| Propriedade | Tipo | Padrão | Comportamento |
| --- | --- | --- | --- |
| `label` | string | obrigatório | Texto visível e nome da seleção, não vazio. |
| `icon` | IconName | — | Ícone decorativo, substituído por check na seleção. |
| `selectable` | boolean | false | Torna o rótulo um botão de alternância. |
| `modelValue` | boolean | false | Seleção controlada; usado somente com selectable. |
| `removable` | boolean | false | Adiciona botão separado de remoção. |
| `removeLabel` | string | — | Obrigatório e não vazio com removable, como `Remover Vue`. |
| `tone` | primary / accent | primary | Cor da seleção e do foco. |
| `disabled` | boolean | false | Bloqueia as duas ações e preserva o valor recebido. |
| `width / grow / shrink` | dimensão / number / number | auto / 0 / contexto | Participação no layout. |
| `id / accessibilityHidden` | string / boolean | — / false | Identificador e exclusão de acessibilidade. |

Rótulos ausentes ou vazios lançam `TypeError`, incluindo o nome de remoção quando `removable` é true.

## Estado e ações

`update:modelValue` solicita o booleano oposto. O pai precisa aceitar a solicitação para mudar a seleção. `remove` não tem payload: não alterna seleção nem remove o componente. As duas ações são alvos irmãos, com nomes separados. Desabilitado, o Chip não emite nenhum dos eventos. O rótulo estático não cria parada de foco interativa.

Use Row com wrap para grupos. O texto pode quebrar dentro da largura disponível; não há altura fixa de conteúdo. Chip não gerencia coleções, seleção exclusiva, navegação ou um handle de foco. O app cuida do foco ao excluir um chip focado, levando-o a um controle adequado. Prefira Badge para estados curtos e SegmentedControl para uma escolha única em um grupo.

## Teclado e movimento

Na Web, seleção usa botão com `aria-pressed`; remoção é outro botão. Tab visita cada ação habilitada, Enter/Espaço ativam e o foco de teclado fica visível. No nativo, compõe Row, Text e Icon com papel de botão e estados selecionado/desabilitado; desabilitado tem precedência no estado único do NativeScript. A fala depende das configurações da plataforma.

Press usa Jolt no nativo e CSS na Web, respeitando movimento reduzido. O feedback nativo é removido no unload e reinstalado no load. Não há animação de remoção da coleção.

A [Biblioteca](../showcase/library) usa chips nos assuntos e EmptyState para recuperar uma busca vazia.

## Exemplo completo

<details>
<summary>Ver código</summary>

<<< @/../examples/catalog/shared/demos/ChipDemo.vue

</details>
