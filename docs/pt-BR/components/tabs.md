---
title: Tabs
description: Abas de conteúdo com seleção controlada, indicador animado e uma API para NativeScript e Web.
---

# Tabs

`MTabs` · Um espaço, várias perspectivas.

::: info Próxima alpha
Tabs está no repositório; não faz parte da `0.1.0-alpha.3`.
:::

<ComponentPreview component="tabs" :height="920" />

## Uso

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { ChoiceValue, TabOption } from '@getcortexlabs/mavis-core'

const active = ref<ChoiceValue | null>('profile')
const tabs: TabOption[] = [
  { value: 'profile', label: 'Profile' },
  { value: 'activity', label: 'Activity' },
  { value: 'upcoming', label: 'Coming soon', disabled: true },
]
</script>

<template>
  <m-tabs v-model="active" :tabs="tabs" label="Your space">
    <template #default="{ value }">
      <m-column v-if="value === 'profile'" gap="md">
        <m-text variant="heading">About you</m-text>
        <m-text>Your profile content.</m-text>
      </m-column>
      <m-text v-else>Recent activity.</m-text>
    </template>
  </m-tabs>
</template>
```

## Props

| Prop | Tipo | Padrão | Comportamento |
| --- | --- | --- | --- |
| `modelValue` | `string \| number \| null` | `null` | Valor controlado. Use `v-model` e escolha o valor inicial no app. |
| `tabs` | `readonly TabOption[]` | obrigatório | Lista ordenada de abas. |
| `label` | `string` | obrigatório | Nome não vazio do conjunto, usado por tecnologia assistiva. |
| `disabled` | `boolean` | `false` | Impede ativação pelo usuário; o pai ainda pode alterar a seleção. |
| `id` | `string` | — | Identificador do contêiner. |
| `width` | `number \| % \| auto` | `auto` | Largura do contêiner, não de cada aba. |
| `grow / shrink` | `number` | `0 / contexto` | Participação no layout pai. |
| `accessibilityHidden` | `boolean` | `false` | Oculta o conjunto para tecnologia assistiva. |

`TabOption`: `{ value: string | number; label: string; disabled?: boolean }`.

Os valores devem ser únicos e os números finitos. `0` e `'0'` são valores distintos; rótulos não vazios podem mudar com o idioma. O tipo e `TabPanelProps` são exportados pelo core.

## Seleção e painel

`update:modelValue(value)` solicita uma mudança para uma aba habilitada e diferente. Repetir a seleção, rolar a barra ou focar outra aba não emite alteração. O pai pode rejeitar o pedido. Não há seleção automática: inicialize o modelo no app.

O slot `default` recebe `{ value }` e só é chamado quando o valor corresponde a uma aba. Apenas esse painel fica montado; mudar de aba desmonta o anterior, liberando seus componentes e efeitos. Guarde formulários, filtros e dados compartilhados no pai, como na [Biblioteca](../showcase/library). Não há cache interno de painéis.

`null`, uma lista vazia ou um valor ausente removem painel e indicador, sem alterar o modelo ou emitir eventos. Reinserir a aba restaura seu painel. Desabilitar a aba selecionada mantém o conteúdo atual: `disabled` limita a interação, não reescreve a decisão do app.

## Interação e movimento

A barra tem largura intrínseca e rolagem horizontal. Os rótulos ficam em uma linha; a seleção externa revela a aba sem rolar verticalmente a página. Redimensionamento e mudança do tamanho de texto reposicionam o indicador. Arrastar a barra apenas rola; não troca painéis.

Na Web, o conjunto usa `tablist`, botões `tab` e um `tabpanel` nomeado pela aba ativa. Tab entra em uma única aba; setas, Home e End movem foco entre as habilitadas. Enter/Espaço ativam. Esquerda/direita acompanham a direção RTL do documento. O painel também pode receber foco pelo teclado.

No nativo, cada aba é um botão rotulado com estado de seleção; os controles acompanham o tamanho de texto do sistema. Android tem navegação de foco com setas/Home/End e ativação padrão do botão. A primeira implementação nativa dispõe a barra da esquerda para a direita; não promete espelhamento RTL ou navegação de teclado iOS auditados.

O indicador usa Jolt no nativo e CSS na Web, seguindo movimento reduzido. Unload/unmount libera animações, listeners, medições pendentes e observadores; páginas nativas retidas refazem a medição ao voltar. Isso é comportamento básico, não uma auditoria completa de leitores de tela.

Tabs organiza conteúdo local. Rotas, deep links, tab bar de navegação, orientação vertical, cabeçalhos livres e swipe entre painéis ficam fora deste contrato.

## Exemplo completo

<details>
<summary>Ver código</summary>

<<< @/../examples/catalog/shared/demos/TabsDemo.vue

</details>
