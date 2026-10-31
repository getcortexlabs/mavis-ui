---
title: Contrato dos componentes
description: Propriedades, padrões, eventos, slots e limites compartilhados entre NativeScript-Vue e Vue Web no Mavis.
---

# Contrato dos componentes

Os dez componentes experimentais usam as mesmas declarações de propriedades Vue nos dois renderizadores. Os tipos dos templates são derivados dessas declarações. Essa é a base para os próximos adapters; a API da alpha continua experimental.

## Nomes, padrões e slots

Registre os componentes com `createMavis()` ou importe-os individualmente. Vue aceita `MButton` e `m-button`. Sem um provedor de tema, um componente importado individualmente usa Mavis; para trocar o tema de uma tela, use o provedor compartilhado da aplicação.

| Componente | Padrões principais | Slot padrão | Eventos |
| --- | --- | --- | --- |
| Screen | `scroll=false` | Conteúdo da tela | Nenhum |
| Row | `gap=none`, `align=center`, `justify=start`, `wrap=false` | Componentes filhos | Nenhum |
| Column | `gap=none`, `align=stretch`, `justify=start`, `wrap=false` | Componentes filhos | Nenhum |
| Box | Sem padding ou radius | Camadas em ordem de desenho | Nenhum |
| Card | `padding=lg`, `radius=lg`, `gap=none`, `interactive=false`, `disabled=false` | Conteúdo vertical | `click`, sem payload |
| Text | `variant=body`, `tone=text`, `as=p`, `align=left`, `wrap=true` | Apenas texto | Nenhum |
| Button | `variant=primary`, `size=md`, `disabled=false`, `loading=false` | Apenas texto | `click`, sem payload |
| Slider | `modelValue=0`, `min=0`, `max=100`, `step=1`, `disabled=false`; `label` obrigatório | Nenhum | `update:modelValue`, número |
| Icon | `size=md`, `tone=text`; `name` obrigatório; `label` opcional | Nenhum | Nenhum |
| Input | `modelValue=''`, `type=text`, `multiline=false`, `rows=3`; `label` obrigatório | Nenhum | `update:modelValue` e `submit`, string; `focus/blur`, sem payload |
| Reveal | `show=false`; padrões de layout de Column | Componentes condicionais | Nenhum |
| Sheet | `open=false`, `dismissible=true`, `fullscreen=false`, `padding=lg`; `title` ou `accessibilityLabel` obrigatório | Conteúdo da sheet | `update:open`, boolean; `close`, motivo |

Text e Button aceitam texto simples ou interpolado; espaços nas extremidades do slot são removidos. Elementos e componentes aninhados são rejeitados. A propriedade `text`, inclusive uma string vazia, tem precedência sobre o slot. Durante o carregamento, Button usa `loadingText` (padrão `Loading…`) e não emite `click`. Card só emite `click` quando interativo e habilitado. Um Card interativo representa uma ação: mantenha botões, links e campos fora dele.

## Valores de layout

Row, Column, Box, Card e Reveal aceitam `padding`, `paddingX`, `paddingY`, `radius`, `grow`, `shrink`, `width`, `height` e `backgroundColor`. Reveal também aceita alinhamento, gap e quebra de Column. Button e Text expõem `grow` e `shrink`; Screen, Slider e Sheet possuem comportamento de layout próprio, e Sheet aplica `padding`, `gap` e `align` ao painel e à coluna de conteúdo.

- Espaçamentos aceitam tokens do tema ou números finitos não negativos. O padding por eixo substitui os lados correspondentes de `padding`, inclusive quando vale zero.
- Radius aceita um token de raio do tema ou um número finito não negativo.
- Dimensões aceitam números finitos não negativos, percentuais como `50%` ou `auto`. Números representam DIPs no nativo e pixels CSS na Web. O tamanho percentual depende das restrições do pai.
- `grow` começa em 0. `shrink` começa em 1 dentro de Row e em 0 dentro de Column. Ambos aceitam números finitos não negativos. Screen estabelece um contexto de coluna; Reveal participa do layout pai e estabelece uma coluna para os filhos.

Números inválidos, tokens de espaçamento/raio desconhecidos e dimensões fora desse contrato lançam `RangeError` nos dois renderizadores. Propriedades enumeradas, como `variant` e `align`, são verificadas pelo TypeScript e pelos validadores de desenvolvimento do Vue. Valores não suportados ficam fora da API.

## Valores controlados

Slider exibe o valor permitido mais próximo sem reescrever um modelo externo fora da faixa ou do passo. A interação do usuário emite um número somente quando o valor exibido muda; controles desabilitados não emitem. Atualizar o modelo pela aplicação não emite outra atualização.

O último passo alcança `max`, mesmo quando seu intervalo é menor. Com `min=0`, `max=1`, `step=0.3`, os valores são `0`, `0.3`, `0.6`, `0.9`, `1`. Um valor externo de `0.96` exibe `1`; `0.94` exibe `0.9`. O arredondamento de ponto flutuante não deve criar um passo duplicado.

## Atributos e limites de plataforma

`id` identifica a raiz renderizada, exceto em Input, onde identifica o editor. `accessibilityLabel` e `accessibilityHidden` são propriedades comuns tipadas, traduzidas para propriedades nativas e atributos ARIA na Web. Slider usa seu `label` obrigatório como nome acessível. Não esconda controles interativos da acessibilidade.

`class`, `style` e outros atributos não declarados são repassados à raiz renderizada; Reveal os repassa à sua coluna condicional. Estilos locais sobrescrevem estilos do tema, e uma propriedade de layout não informada deixa a chave de estilo em paz, então atributos nativos como `paddingTop` sobrevivem às re-renderizações. Esses são pontos de acesso à plataforma: CSS de navegador, propriedades nativas e eventos brutos não são APIs portáveis do Mavis. Propriedades não declaradas eventualmente consumidas por wrappers internos não são comportamento garantido. Use `click` e `v-model` para interações compartilhadas. Estado de Button e faixa/valor de Slider continuam controlados pelas propriedades declaradas.

Screen nativa renderiza uma Page e precisa de um host de navegação; na Web, renderiza `main`. Layouts nativos usam views nativas, enquanto os da Web usam flex/grid. O Slider Android usa índices de passos internamente; o iOS preserva a faixa semântica nativa. Jolt cuida do movimento nativo; a Web usa CSS até o [Jolt Web](https://github.com/rafaelaugustos/jolt/issues/236) estar disponível. Métricas de fonte, safe areas e transições de navegação podem diferir.

## Revisão e migração

A revisão da [#19](https://github.com/getcortexlabs/mavis-ui/issues/19) removeu declarações duplicadas de propriedades/tipos, tipou as opções de layout já aceitas por Reveal e tornou explícito o contexto de coluna de Screen nos dois renderizadores. Também corrigiu o arredondamento e o último intervalo parcial de Slider.

Se você usava dimensões como `width="240px"`, use `:width="240"`. Mantenha unidades específicas nos estilos da plataforma. Geometria negativa ou não finita agora falha de forma consistente. Tema automático e novos frameworks continuam em trabalhos separados.

A [sessão de foco](../showcase/focus) exercita os nove componentes iniciais em uma tela compartilhada. Esse exercício de consumo revelou a falta de tipos para o layout de Reveal e um wrapper que repassava dimensões sem declará-las. A checagem de templates agora cobre o catálogo compartilhado, imports diretos e nomes globais. Testes de comportamento cobrem os dois renderizadores; testes de navegador e verificações nativas cobrem a tela real. Isso não substitui uma auditoria completa de acessibilidade ou de aparelhos físicos.

Icon renderiza um glifo Lucide da fonte embutida; é decorativo a menos que `label` o nomeie, e nunca consome slot. Input usa modelo string, rótulo visível e eventos explícitos de foco e envio. Seu `id` identifica o editor; `class`, `style`, `width`, `grow` e `shrink` se aplicam ao campo completo. Veja o [contrato de Input](../components/input) e a [tela de perfil](../showcase/profile).
