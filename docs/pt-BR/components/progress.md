---
title: Progress
description: Progresso linear com valores conhecidos ou estado indeterminado no NativeScript e na Web.
---

# Progress

`MProgress` mostra quanto uma tarefa avançou ou um segmento em movimento quando o total é desconhecido. O app controla a tarefa e fornece seu estado.

::: info Próxima alpha
Disponível no repositório para a próxima alpha; não incluído na `0.1.0-alpha.3`.
:::

<ComponentPreview component="progress" :height="1000" />

## Uso

```vue
<m-progress :value="64" label="Download da coleção" tone="accent" />
<m-progress indeterminate label="Preparando coleção" indeterminateLabel="Preparando" />
```

## Propriedades

| Propriedade | Tipo | Padrão | Comportamento |
| --- | --- | --- | --- |
| `value` | `number` | `0` | Valor finito, limitado entre zero e max. |
| `max` | `number` | `100` | Limite superior finito e estritamente positivo. |
| `label` | `string` | obrigatório | Nome acessível não vazio; não desenha um rótulo visível. |
| `indeterminate` | `boolean` | `false` | Mostra um segmento em movimento em vez de um percentual conhecido. |
| `indeterminateLabel` | `string` | `Loading` | Descrição acessível não vazia do estado indeterminado; traduza no app. |
| `size` | `sm \| md \| lg` | `md` | Espessuras de 4, 8 e 12 DIP/px. |
| `tone` | `primary \| accent \| success \| warning \| danger` | `primary` | Cor do preenchimento no tema. |
| `width / grow / shrink` | dimensão / número / número | `auto / 0 / contexto` | Participação no layout, como Box. |
| `id / accessibilityHidden` | string / boolean | — / false | Identificador opcional e exclusão da árvore acessível. |

Números usam DIP no nativo e px na Web. Dentro de Column, a barra ocupa a largura disponível; em Row, informe a largura ou use `width=0` com `grow=1`. Números inválidos lançam `RangeError`, inclusive no modo indeterminado; rótulos vazios lançam `TypeError`. O percentual acessível é arredondado para até uma casa decimal. Isso não garante um anúncio automático a cada atualização.

## Estado e movimento

Não há slots ou eventos. Coloque rótulos visíveis, percentuais, ações de cancelar/tentar novamente e mensagens de sucesso/erro ao lado da barra. Chegar ao máximo não conclui a tarefa, muda o tom ou remove o componente. Valores conhecidos atualizam o preenchimento diretamente, sem interpolação nem timer próprio.

O modo indeterminado move um segmento de 32% dentro da barra em ciclos de 1,6 segundo: Jolt no nativo e CSS na Web. Movimento reduzido mantém o segmento parado no centro, sem loop. No nativo, a animação para em segundo plano e libera animações, timers e listeners no unload/unmount; páginas retidas reiniciam no load. A Web pausa em abas ocultas e remove seu listener ao desmontar. Rolar para fora da tela não desmonta o componente.

O elemento nativo expõe o papel de barra de progresso e um percentual ou descrição indeterminada. A Web usa `role=progressbar`, limites e valor atual; o modo indeterminado omite `aria-valuenow`. Forneça um nome conciso. Não há variante circular, serviço de tarefas ou estimativa de conclusão.

A [Library](../showcase/library) demonstra preparação, progresso, cancelamento e nova tentativa com timers locais, sem transferir arquivos.

## Exemplo completo

<details>
<summary>Ver código</summary>

<<< @/../examples/catalog/shared/demos/ProgressDemo.vue

</details>
