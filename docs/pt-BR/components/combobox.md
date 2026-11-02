---
title: Combobox
description: Seleção única assíncrona com busca e valor selecionado separados.
---

# Combobox

`MCombobox` busca uma opção mantendo separados o texto editado, o resultado destacado e o valor confirmado. Digitar nunca confirma uma opção. `MSelect` continua sendo uma seleção sem busca.

::: info Não publicado
Este componente ainda não faz parte da `0.1.0-alpha.4`.
:::

<ComponentPreview component="combobox" :height="760" />

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { ChoiceOption, ChoiceValue, ComboboxSearch } from '@getcortexlabs/mavis-core'
const municipio = ref<ChoiceValue | null>(2611606)
const busca = ref('Recife')
const selecionado = ref<ChoiceOption | null>({ value: 2611606, label: 'Recife' })
const pesquisar: ComboboxSearch = async (query, { limit, onCancel }) => {
  const controller = new AbortController()
  onCancel(() => controller.abort())
  const response = await fetch(`/api/municipios?q=${encodeURIComponent(query)}&limit=${limit}`, {
    signal: controller.signal,
  })
  if (!response.ok) throw new Error('Falha na busca')
  return response.json() // Valide o retorno do seu serviço como ChoiceOption[].
}
</script>

<template>
  <m-combobox
    v-model="municipio"
    v-model:query="busca"
    :selectedOption="selecionado"
    :search="pesquisar"
    :initialResults="{ query: 'Recife', options: [{ value: 2611606, label: 'Recife' }] }"
    label="Município"
    placeholder="Buscar municípios"
    clearLabel="Limpar município"
    closeLabel="Fechar resultados"
    loadingText="Buscando…"
    emptyText="Nenhum município encontrado"
    searchErrorText="Não foi possível buscar."
    retryLabel="Tentar novamente"
    idleText="Digite para buscar."
    limitedText="Refine a busca para ver mais resultados."
    @select="selecionado = $event"
  />
</template>
```

A URL é um exemplo da aplicação, não um serviço do Mavis. No nativo, use o transporte da plataforma e registre seu cancelamento com `onCancel`. O contrato compartilhado não depende do `AbortController` do navegador.

## Estado controlado

| Prop ou evento                                | Contrato                                                                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `modelValue` / `update:modelValue`            | `ChoiceValue \| null`; padrão `null`. Número `1` e string `'1'` são IDs distintos.                                       |
| `query` / `update:query`                      | String controlada obrigatória, exibida no editor. Só a alteração aceita pelo pai dispara busca.                          |
| `selectedOption`                              | Snapshot `ChoiceOption` opcional correspondente ao valor. Informe para uma seleção inicial/externa fora da página atual. |
| `select`                                      | Objeto solicitado pelo usuário, ou `null` ao limpar. O pai continua decidindo a aceitação.                               |
| `search`                                      | Obrigatório: `(query, { requestId, limit, onCancel }) => Promise<readonly ChoiceOption[]>`.                              |
| `initialResults`                              | `{ query, options }` opcional, lido na criação sem buscar automaticamente.                                               |
| `debounce`                                    | Inteiro `0…60000` em milissegundos; padrão `200`.                                                                        |
| `minQueryLength`                              | Inteiro `0…1000`; padrão `1`. Mede comprimento sem espaços nas pontas; o serviço recebe a string original.               |
| `maxResults`                                  | Inteiro `1…100`; padrão `50`. Excedentes são omitidos com uma mensagem para refinar.                                     |
| `disabled`                                    | Bloqueia edição/ações, fecha resultados e cancela trabalho pendente.                                                     |
| `clearable`                                   | Padrão `true`. Limpar solicita `null` e uma busca vazia.                                                                 |
| `label`, `placeholder`, `helperText`, `error` | Nome, dica de busca e validação. Erro prevalece sobre ajuda.                                                             |
| `focus`, `blur`                               | Eventos de foco. A ref também expõe `focus()` e `blur()` como `InputHandle`.                                             |

Opções seguem `ChoiceOption`: `{ value, label, helperText?, disabled? }`. Valores são strings ou números finitos, rótulos não podem ser vazios e IDs tipados duplicados são rejeitados. Texto livre não vira seleção. Trocar os resultados não apaga o valor selecionado. O último rótulo conhecido continua disponível fora da página atual; uma legenda o exibe enquanto outra busca é editada. Limpar ou mudar externamente para `null` remove a seleção.

Confirmar solicita o ID e seu rótulo como novo `query`. Escape cancela a edição e solicita o rótulo selecionado, ou string vazia se não houver seleção. Blur fecha os resultados sem confirmar nem reescrever a busca. O pai pode rejeitar cada solicitação independentemente; mantenha os dois bindings para a edição normal.

## Ciclo de busca

A busca começa ao focar/abrir ou aceitar uma mudança de `query` com resultados abertos. A página inicial ou última página bem-sucedida é reutilizada quando corresponde à busca. Existe somente uma página retida, sem cache global nem junção de páginas. Tentar novamente ignora o debounce. Buscas curtas exibem `idleText`; requisições pendentes usam `loadingText`; vazio e falha têm estados próprios. Uma falha nunca substitui a seleção.

Trocar a busca, iniciar composição IME, limpar, Escape, blur, desabilitar, unload, desmontar a rota e desativar uma view em cache cancelam timers e chamam os cancelamentos do host. Respostas e falhas antigas são descartadas por identidade de requisição, inclusive para consultas repetidas e serviços sem abort. O host libera seus próprios recursos quando a promise termina. `onCancel` registrado depois de uma etapa assíncrona executa imediatamente se a requisição já foi cancelada. Serialize somente seleção, busca e resultados; serviços, credenciais e handles de transporte ficam fora do estado serializado.

`initialResults` permite SSR sem executar o loader. Na hidratação, texto editado no HTML antes do cliente é preservado e solicitado ao pai como `query`. Um snapshot inalterado não refaz a busca. IDs usam `useId` do Vue; mantenha árvore e dados iniciais iguais no servidor e cliente.

Traduza `clearLabel`, `closeLabel`, `loadingText`, `emptyText`, `searchErrorText`, `retryLabel`, `idleText` e `limitedText`. A aplicação fornece a mensagem pública de falha; exceções internas do transporte não são exibidas.

## Interação e limites

**Web:** editor `role="combobox"` com popup de listbox ancorado abaixo do campo e viewport rolável. O popup é montado no dialog dono, quando existe, ou no body, mantendo a camada modal. A posição e a altura seguem o espaço disponível na viewport; listeners de rolagem/redimensionamento são removidos ao fechar. O foco DOM continua no editor; setas para cima/baixo destacam resultados e ignoram desabilitados. Enter confirma o destaque ou repete uma busca com erro. Sem destaque, Enter nunca envia implicitamente o formulário HTML. Escape fecha e restaura o rótulo antes de um overlay externo receber outro Escape. Home/End, esquerda/direita e atalhos de seleção preservam a edição do navegador. Enter durante IME não confirma. A substituição de resultados preserva o destaque somente se a mesma opção habilitada continuar presente. Um check marca a seleção confirmada; borda/fundo indicam o destaque do teclado. Referência: [padrão combobox WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).

**NativeScript:** o editor nativo permanece montado, seguido por controles nativos de escolha. Não abre outro Sheet. Resultados usam a rolagem do Screen/Sheet dono, sem lista virtualizada interna. Tocar confirma e fecha a edição. Return busca resultados sem escolher automaticamente o primeiro. Edição e navegação por foco seguem a plataforma; as setas Web não são uma promessa de teclado físico nativo. Texto marcado/composição adiam a busca até terminar. Fechar resultados cancela a edição. Unload cancela busca e observação de composição. Use `MScreen` com rolagem para páginas longas; em Sheet, preserve o dono e as restrições de arraste existentes.

Escopo inicial: seleção única, uma página, no máximo 100 opções renderizadas. Sem paginação, scroll infinito, virtualização, tags, texto livre, multiseleção ou templates de opção. O serviço deve ordenar/filtrar e respeitar `limit`; refine a consulta para bases maiores. Se o serviço truncar os resultados, a mensagem de total pertence à aplicação.

## Receita compartilhada

A demo usa serviço em memória da aplicação e timers canceláveis. Os switches provocam uma falha ou entregam respostas antigas depois das novas. Não há API externa nem credenciais.

<<< @/../examples/catalog/shared/demos/ComboboxDemo.vue
