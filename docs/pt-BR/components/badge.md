---
title: Badge
description: Rótulos, contadores e estados compactos no NativeScript e Web.
---

# Badge

`MBadge` acrescenta contexto com texto ou número: uma categoria, um estado ou um contador. É uma informação, sem ação embutida.

::: info Próxima alpha
Disponível no repositório para a próxima alpha; não faz parte de `0.1.0-alpha.3`.
:::

<ComponentPreview component="badge" :height="950" />

## Uso

```vue
<m-badge text="Publicado" tone="success" />
<m-badge :text="0" tone="accent" accessibilityLabel="0 mensagens não lidas" />
<m-badge text="99+" size="sm" accessibilityLabel="Mais de 99 mensagens" />
```

## Propriedades

| Propriedade | Tipo | Padrão | Comportamento |
| --- | --- | --- | --- |
| `text` | `string \| number` | obrigatório | Conteúdo; zero é exibido. |
| `tone` | `neutral \| primary \| accent \| success \| warning \| danger` | `neutral` | Cores do tema. |
| `size` | `sm \| md` | `md` | Escala de texto e espaçamento. |
| `accessibilityLabel` | `string` | — | Descreve o contador no contexto, quando necessário. |
| `accessibilityHidden` | `boolean` | `false` | Oculta informação redundante. |
| `id` | `string` | — | Identificador opcional. |

Primary e accent usam suas superfícies suaves; neutral e os estados semânticos usam a superfície elevada. O conteúdo visível deve comunicar o significado sem depender apenas da cor. A altura acompanha o texto e rótulos longos podem quebrar linha. Em uma lista de badges, use Row com `wrap` para permitir novas linhas.

## Estado e composição

O app controla o valor, a tradução, os limites e a formatação. `99+` é uma string escolhida pelo app, não uma regra do componente. Não há slots, eventos, botão de fechar, foco de teclado ou anúncio automático de alterações. Se uma atualização precisar ser anunciada, forneça uma região de estado no app.

`accessibilityLabel` permite anunciar “3 ideias não lidas” enquanto o contador mostra `3`. Na Web, esse rótulo usa uma imagem semântica com texto alternativo; no nativo, um único texto nomeado. Não coloque um controle interativo dentro do badge. Para indicadores sobrepostos, componha com Box e assuma o posicionamento no layout do app.

[O perfil](../showcase/profile) usa Badge para a categoria e para indicar alterações no formulário.

## Exemplo completo

<details>
<summary>Ver código</summary>

<<< @/../examples/catalog/shared/demos/BadgeDemo.vue

</details>
