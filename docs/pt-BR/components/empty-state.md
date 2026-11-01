---
title: Empty State
description: Estado vazio ilustrado com título, orientação e ações de recuperação do app para NativeScript e Web.
---

# Empty State

`MEmptyState` explica uma coleção ou busca vazia e apresenta um próximo passo. O app decide quando mostrar.

::: info Próxima alpha
Disponível no repositório para a próxima alpha; não está em `0.1.0-alpha.3`.
:::

<ComponentPreview component="empty-state" :height="1000" />

## Uso

```vue
<m-empty-state title="Nada salvo ainda."
  description="Guarde uma leitura para depois." icon="bookmark" tone="accent">
  <template #actions>
    <m-button @click="explore">Explorar leituras</m-button>
  </template>
</m-empty-state>
```

## Propriedades

| Propriedade | Tipo | Padrão | Comportamento |
| --- | --- | --- | --- |
| `title` | string | obrigatório | Título não vazio; ausente/vazio lança TypeError. |
| `description` | string | vazio | Orientação opcional abaixo do título. |
| `icon` | IconName | inbox | Símbolo da ilustração padrão. |
| `tone` | primary / accent | primary | Paleta da ilustração. |
| `compact` | boolean | false | Ilustração, título e espaçamentos menores. |
| `titleAs` | h1 / h2 / h3 / h4 / h5 / h6 | h2 | Nível na Web; no nativo continua cabeçalho. |
| `width / grow / shrink` | dimensão / number / number | auto / 0 / contexto | Participação no layout. |
| `id / accessibilityHidden` | string / boolean | — / false | Identificador e exclusão de acessibilidade. |

## Slots e comportamento

`illustration` substitui a arte padrão. É sempre decorativo e excluído da acessibilidade; coloque texto significativo no título/descrição e controles interativos em `actions`. A arte padrão usa formas e ícone do tema, sem arquivos remotos.

`actions` recebe botões ou outros controles adequados. Eles mantêm seus eventos, estados desabilitado/loading e nomes. Várias ações quebram linha quando necessário. Não há slot padrão nem evento próprio do componente.

Texto e layout crescem naturalmente, inclusive com traduções longas e texto maior do sistema no nativo. Use compact em seções menores. O componente não busca dados, deduz estados de loading/erro, anuncia atualizações, move foco ou inicia movimento automaticamente. Use Skeleton no carregamento, Alert para mensagens e foco ou anúncios definidos pelo app quando uma mudança de resultado precisar deles.

A [Biblioteca](../showcase/library) combina chips de assuntos, busca e leituras salvas vazias com ações de recuperação.

## Exemplo completo

<details>
<summary>Ver código</summary>

<<< @/../examples/catalog/shared/demos/EmptyStateDemo.vue

</details>
