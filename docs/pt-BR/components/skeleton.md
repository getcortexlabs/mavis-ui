---
title: Skeleton
description: Blocos de carregamento com dimensões, temas e movimento consistentes no NativeScript e na Web.
---

# Skeleton

`MSkeleton` representa o formato do conteúdo enquanto o app carrega os dados. Combine blocos com Row e Column para compor cartões, perfis ou listas.

::: info Próxima alpha
Disponível no repositório para a próxima alpha; não incluído em `0.1.0-alpha.3`.
:::

<ComponentPreview component="skeleton" :height="1020" />

## Uso

```vue
<template>
  <m-column v-if="loading" gap="md">
    <m-text>Carregando perfil…</m-text>
    <m-row gap="md">
      <m-skeleton :width="48" :height="48" radius="full" :shrink="0" />
      <m-column :width="0" :grow="1" gap="sm">
        <m-skeleton width="70%" />
        <m-skeleton width="45%" :height="12" />
      </m-column>
    </m-row>
  </m-column>
  <m-text v-else>{{ profile.name }}</m-text>
</template>
```

`loading` e `profile` pertencem ao app. Não há busca de dados, timer ou escolha automática entre estado vazio, erro e sucesso no componente.

## Propriedades

| Propriedade | Tipo | Padrão | Comportamento |
| --- | --- | --- | --- |
| `width` | `number \| % \| auto` | `auto` | Preenche a largura disponível na Column. |
| `height` | `number \| % \| auto` | `16` | Altura do bloco. |
| `radius` | token de radius ou número | `sm` | Arredondamento; `full` com dimensões iguais produz um círculo. |
| `animated` | `boolean` | `true` | Habilita o pulso quando o sistema permite movimento. |
| `grow / shrink` | `number` | `0 / contexto` | Participação no layout, como Box. |
| `id` | `string` | — | Identificador opcional. |

Números usam DIP no nativo e px na Web. Porcentagens precisam de um pai com dimensão definida no eixo correspondente. `auto` não mede o conteúdo futuro: este bloco é vazio. Use dimensões explícitas para reservar espaço. Em Row, use `shrink=0` para preservar o tamanho de um círculo. Larguras automáticas preenchem a Column; larguras explícitas usam `flex-start` para preservar blocos menores. Em Row, defina a largura ou use `width=0` com `grow=1` para dividir o espaço disponível.

## Estado e composição

Skeleton não recebe slots, eventos ou conteúdo real. Seus blocos são decorativos: não entram no foco nem são anunciados individualmente. Apresente uma mensagem de carregamento para a região, fora dos blocos; o anúncio de mudanças e o tratamento de falhas pertencem ao app. Não coloque um formulário real dentro do Skeleton para escondê-lo.

A cor usa `theme.colors.border` nos temas Mavis e Midnight. Escolha dimensões próximas ao resultado esperado para reduzir mudanças de layout. Não há medição automática, grupo com contagem de linhas ou tamanho ajustado à fonte do sistema.

[Na Biblioteca](../showcase/library), **Atualizar coleção** simula uma espera de 1,5 segundo. Os placeholders substituem os cartões e preservam filtros, aba ativa e leituras salvas. A demonstração não faz requisições de rede.

## Movimento e ciclo de vida

O pulso varia apenas a opacidade, em um ciclo de 1,6 segundo: Jolt no NativeScript e CSS na Web. `animated=false` ou movimento reduzido mantêm opacidade 1, sem repetição. O NativeScript suspende a animação em segundo plano e remove animação e listeners no unload/unmount; uma página retida pode reiniciar ao carregar novamente. A Web pausa em uma aba oculta e remove seu listener no unmount.

Use um número limitado de placeholders; sair do viewport por rolagem não desmonta o componente nem interrompe sua animação. Grandes listas exigem estratégia de virtualização do app. Não há shimmer, gradiente em movimento ou scheduler global.

## Exemplo completo

<details>
<summary>Ver código</summary>

<<< @/../examples/catalog/shared/demos/SkeletonDemo.vue

</details>
