---
title: Avatar
description: Imagens, iniciais e identidade com a mesma API no NativeScript e Web.
---

# Avatar

`MAvatar` representa uma pessoa ou equipe. Exibe uma imagem com recorte central e mantém as iniciais enquanto ela carrega ou quando não pode ser aberta. Sem nome, usa o ícone `user-round`.

::: info Próxima alpha
Disponível no repositório para a próxima alpha; não faz parte de `0.1.0-alpha.3`.
:::

<ComponentPreview component="avatar" :height="1050" />

## Uso

```vue
<m-avatar :src="person.image" :name="person.name" size="lg" />
<m-avatar name="Mavis Studio" shape="square" />
<m-avatar accessibilityLabel="Visitante" />
```

O app fornece `person`. A fonte segue a plataforma: no NativeScript, caminho `~/`, arquivo, `res://`, URL HTTPS ou data URI de imagem; na Web, URL acessível ao navegador ou data URI. Uma string de caminho nativo não é transformada em URL Web. Mapeie seus recursos na borda da aplicação. As demos usam uma ilustração PNG original em data URI para funcionar offline nos dois renderizadores.

## Propriedades

| Propriedade | Tipo | Padrão | Comportamento |
| --- | --- | --- | --- |
| `src` | `string` | `''` | Fonte da imagem. Ausência ou erro mantém o fallback. |
| `name` | `string` | `''` | Nome usado para iniciais e nome acessível padrão. |
| `size` | `sm \| md \| lg \| xl` | `md` | 32, 48, 64 ou 96 DIP/px. |
| `shape` | `circle \| square` | `circle` | Círculo ou quadrado com cantos arredondados. |
| `accessibilityLabel` | `string` | `name` | Substitui o nome anunciado. |
| `accessibilityHidden` | `boolean` | `false` | Oculta o avatar quando a identidade já aparece ao lado. |
| `id` | `string` | — | Identificador opcional. |

As iniciais usam a primeira letra da primeira e da última palavra; um nome de uma palavra usa uma letra. Não há análise cultural de sobrenomes. O fundo usa `primarySoft` e as iniciais usam `primary` do tema. A dimensão é fixa e não encolhe em Row. As iniciais e o ícone são uma marca visual: não acompanham a ampliação de texto; forneça o nome em Text ao lado.

## Carregamento e composição

Trocar `src` volta imediatamente ao fallback. Resultados antigos são ignorados, inclusive após desmontar no nativo. Requisições nativas já iniciadas podem terminar em segundo plano: o componente não cancela a conexão, não define cache próprio e não redimensiona arquivos antes do download. Use imagens adequadas ao tamanho de exibição. Não há retry automático: altere `src` ou remonte o componente para tentar novamente.

Sem nome nem `accessibilityLabel`, o avatar é decorativo. Imagem, iniciais e ícone internos não são anunciados separadamente. Não há slots, eventos, seletor de imagem, upload ou ação embutida. Para uma ação, componha o controle apropriado com um nome claro.

[O perfil](../showcase/profile) combina Avatar, Badge e campos editáveis; o nome continua sendo estado do app.

## Exemplo completo

<details>
<summary>Ver código</summary>

<<< @/../examples/catalog/shared/demos/AvatarDemo.vue

</details>
