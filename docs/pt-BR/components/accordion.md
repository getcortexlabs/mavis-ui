---
title: Accordion
description: Seções expansíveis controladas pelo app, com itens, slots e movimento no NativeScript e na Web.
---

# Accordion

`MAccordion` reúne seções relacionadas sob cabeçalhos individuais. O app controla quais ficam abertas e fornece cada corpo pelo slot.

::: info Próxima alpha
Disponível no repositório para a próxima alpha; não está em `0.1.0-alpha.3`.
:::

<ComponentPreview component="accordion" :height="1000" />

## Uso

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { ChoiceValue } from '@getcortexlabs/mavis-core'
const expanded = ref<ChoiceValue[]>([])
const items = [{ value: 'delivery', title: 'Quando chega?', icon: 'package' }] as const
</script>

<template>
  <m-accordion v-model="expanded" :items="items" label="Dúvidas de entrega"
    expandedLabel="Expandido" collapsedLabel="Recolhido">
    <template #default="{ item }">
      <m-text v-if="item.value === 'delivery'">Confira a data no seu pedido.</m-text>
    </template>
  </m-accordion>
</template>
```

## Propriedades

| Propriedade | Tipo | Padrão | Comportamento |
| --- | --- | --- | --- |
| `items` | `readonly AccordionItem[]` | obrigatório | `value` único, `title` não vazio; `description`, `icon` e `disabled` opcionais. |
| `modelValue` | `readonly ChoiceValue[]` | `[]` | Valores abertos; sempre um array. |
| `multiple` | `boolean` | `false` | Permite várias seções abertas. |
| `label` | `string` | obrigatório | Nome acessível não vazio do grupo. |
| `expandedLabel / collapsedLabel` | `string` | `Expanded / Collapsed` | Descrições não vazias do estado nativo; traduza no app. |
| `disabled` | `boolean` | `false` | Bloqueia os cabeçalhos. Controles do corpo continuam sob controle do app. |
| `width / grow / shrink` | dimensão / number / number | `auto / 0 / contexto` | Participação no layout. |
| `id / accessibilityHidden` | string / boolean | — / false | Identificação e exclusão da acessibilidade. |

Valores são strings ou números finitos; `0` e `'0'` são distintos. Valores duplicados nos itens ou no array aberto lançam `RangeError`. Valores inválidos ou nomes obrigatórios vazios lançam `TypeError`. Mais de um valor aberto no modo simples lança `RangeError`; reduza o array antes de desligar `multiple`. Valores ausentes dos itens ficam no model, mas não renderizam um corpo. Remover um item não reescreve o estado do app.

## Estado e composição

`update:modelValue` pede um novo array sem alterar o original. Fechar a única seção aberta produz `[]`. Cabeçalhos desabilitados não emitem, inclusive se o corpo já estiver aberto. O app pode aceitar ou rejeitar cada pedido.

O slot padrão recebe `{ item }`. O corpo monta ao abrir e desmonta depois da saída do Reveal. Guarde no pai os dados que precisam sobreviver ao fechamento. Controles no corpo são ações separadas; o cabeçalho não aceita botões personalizados. Título e descrição quebram linha naturalmente.

Reveal anima opacidade/deslocamento, sem interpolar a altura. O nativo usa Jolt; a Web usa CSS. Respeita movimento reduzido. Evite rolagem vertical aninhada em uma Screen que já rola.

## Teclado e foco

Na Web, cabeçalhos são botões dentro de títulos, com `aria-expanded` e uma região nomeada para o corpo aberto. Enter/Espaço alternam a seção. Cima/Baixo, Home e End percorrem cabeçalhos habilitados sem abrir seções. Fechar ou remover um corpo com foco devolve-o a um cabeçalho disponível; desabilitar todo o grupo mantém o comportamento normal do navegador.

No nativo, os cabeçalhos expõem título, descrição, dica do grupo e o valor traduzido de expandido/recolhido usando a interação do ListItem. A fala do VoiceOver/TalkBack depende da plataforma. Teclado nativo usa o sistema de foco da plataforma. Auditorias com teclado físico e aparelhos reais continuam separadas dos testes em simuladores.

A [Central de ajuda](../showcase/help) guarda no pai os valores abertos por assunto e o retorno por pergunta.

## Exemplo completo

<details>
<summary>Ver código</summary>

<<< @/../examples/catalog/shared/demos/AccordionDemo.vue

</details>
