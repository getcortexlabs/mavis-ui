---
title: ListItem
description: Linhas de conteúdo com título, descrição, slots e ação opcional no NativeScript e Web.
---

# ListItem

`MListItem` organiza um título, uma descrição e conteúdo nas laterais. Use linhas informativas para apresentar dados ou `interactive` para uma ação sobre a linha inteira.

::: info Próxima alpha
Disponível no repositório para a próxima alpha; não faz parte de `0.1.0-alpha.3`.
:::

<ComponentPreview component="list-item" :height="950" />

## Uso

```vue
<m-list-item title="Marina Costa" description="Design · São Paulo" interactive
  accessibilityLabel="Abrir Marina Costa, Design, disponível" @click="openMember">
  <template #leading><m-avatar name="Marina Costa" :accessibilityHidden="true" /></template>
  <template #trailing><m-badge text="Disponível" tone="success" size="sm" /></template>
</m-list-item>
```

`openMember` pertence ao app. A linha emite `click` sem payload; não escolhe uma rota, seleção ou política de abertura.

## Propriedades

| Propriedade | Tipo | Padrão | Comportamento |
| --- | --- | --- | --- |
| `title` | `string` | obrigatório | Título não vazio; quebra linha. |
| `description` | `string` | `''` | Texto secundário, também com quebra de linha. |
| `interactive` | `boolean` | `false` | Transforma a superfície em uma ação. |
| `disabled` | `boolean` | `false` | Bloqueia somente a ação da linha interativa. |
| `width` | `number \| % \| auto` | `auto` | Largura conforme o contrato de layout. |
| `grow / shrink` | `number` | `0 / contexto` | Participação no layout. |
| `accessibilityLabel` | `string` | título + descrição | Nome da linha interativa. Inclua informação relevante dos slots. |
| `accessibilityHidden` | `boolean` | `false` | Oculta conteúdo redundante. |
| `id` | `string` | — | Identificador opcional. |

## Slots e interação

`leading` recebe avatar ou ícone; `trailing`, uma informação compacta ou controle. Não há slot padrão: título e descrição usam props. Uma linha interativa sem `trailing` mostra `chevron-right`. A presença do slot substitui a seta.

**Linha interativa:** uma única ação, com foco, Enter/Espaço na Web e feedback de pressão Jolt no nativo. Não aninhe botões, links ou campos nos slots. O nome acessível padrão combina título e descrição; forneça `accessibilityLabel` quando um Badge ou outro elemento lateral acrescentar significado. Os filhos são ocultados como alvos assistivos separados no nativo.

**Linha informativa:** não recebe foco nem emite `click`. Seus filhos mantêm seus próprios textos e semântica. Pode conter um botão independente no `trailing`; `disabled` não desabilita esse controle. Não há agrupamento acessível automático de toda a linha.

A composição reutiliza Card, Row, Column, Text e Icon: superfície do tema, padding `md`, radius `md`, sem borda. A altura acompanha o texto. Mantenha slots compactos; conteúdo lateral muito grande disputa espaço com o título. Para formulários ou conteúdo complexo, componha um Card próprio.

Agrupe poucas linhas em Column/Card e use Separator entre elas. Este componente não fornece coleção virtualizada, swipe, reordenação ou gerenciamento de seleção. [Equipe](../showcase/team) demonstra detalhes em Sheet e favoritos mantidos no pai.

## Exemplo completo

<details>
<summary>Ver código</summary>

<<< @/../examples/catalog/shared/demos/ListItemDemo.vue

</details>
