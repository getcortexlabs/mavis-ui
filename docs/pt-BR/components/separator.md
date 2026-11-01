---
title: Separator
description: Divisões horizontais e verticais com espaçamento do tema no NativeScript e Web.
---

# Separator

`MSeparator` desenha uma linha decorativa na cor `border` do tema. Ajuda a separar conteúdo sem acrescentar controles ou anúncios repetidos.

::: info Próxima alpha
Disponível no repositório para a próxima alpha; não faz parte de `0.1.0-alpha.3`.
:::

<ComponentPreview component="separator" :height="1050" />

## Uso

```vue
<m-column>
  <m-list-item title="Design" description="Ideias que ganham forma." />
  <m-separator inset="md" />
  <m-list-item title="Engenharia" description="Experiências que funcionam." />
</m-column>

<m-row>
  <m-text>12 projetos</m-text>
  <m-separator orientation="vertical" :length="32" spacing="md" />
  <m-text>4 pessoas</m-text>
</m-row>
```

## Propriedades

| Propriedade | Tipo | Padrão | Comportamento |
| --- | --- | --- | --- |
| `orientation` | `horizontal \| vertical` | `horizontal` | Direção da linha. |
| `length` | `number` | automático | Comprimento explícito em DIP/px, sem contar margens. |
| `spacing` | token de espaço ou número | `none` | Margem de cada lado, perpendicular à linha. |
| `inset` | token de espaço ou número | `none` | Recuo de cada ponta da linha. |
| `id` | `string` | — | Identificador opcional. |

Em uma Column, a linha horizontal automática estica na largura útil. Em uma Row, a vertical automática estica na altura da linha. Use esses pais sem `wrap` para que o eixo e os limites sejam previsíveis; fora deles, defina `length`. O comprimento explícito é centralizado. Valores negativos ou não finitos são rejeitados.

`spacing="sm"` acrescenta 8 DIP/px de cada lado no tema padrão. `inset="md"` recua cada ponta em 16. Na linha horizontal, spacing afeta cima/baixo e inset afeta esquerda/direita; na vertical, os eixos se invertem. Padding do pai, essas margens e o comprimento explícito devem caber no espaço disponível.

A espessura é 1 DIP no nativo e 1 CSS pixel na Web, não uma promessa de um pixel físico. Não há conteúdo, slots, eventos, foco, animação ou alça de redimensionamento. A linha é ocultada da árvore assistiva; forneça títulos e estrutura de grupos no app. [Equipe](../showcase/team) usa os dois eixos junto a ListItem.

## Exemplo completo

<details>
<summary>Ver código</summary>

<<< @/../examples/catalog/shared/demos/SeparatorDemo.vue

</details>
