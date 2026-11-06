---
title: Atlas
description: Um planejador de viagens compartilhado, com gestos contínuos, listas e dados animados.
---

# Atlas

Um caderno de viagens com três espaços: inspiração, roteiro e orçamento. A mesma tela Vue usa os renderizadores Web e NativeScript. Inclui temas claro e escuro, busca local, rascunhos preservados e navegação por teclado.

No desktop, a fotografia ocupa uma área ampla ao lado do caderno de planejamento; os destinos aparecem em três colunas. `MStack.responsive` e `MGrid` reorganizam essas áreas em telas menores. Temas de papel e tinta, tipografia editorial e entradas de fotografia e palavras com Jolt dão identidade própria ao exemplo.

**Showcase do catálogo para Mavis 0.1.0-rc.11.1.** Atlas fica no repositório de exemplos; não é um componente npm separado.

<a href="/playground/#/showcase/atlas">Abrir Atlas</a>

Arraste um destino, renomeie a viagem, inverta o roteiro, escolha um intervalo de datas e compare os cenários de orçamento. O Jolt controla o assentamento dos gestos, os indicadores de seleção, a geometria das listas e a interpolação do gráfico. Os dados acessíveis do gráfico mudam imediatamente; sua apresentação acompanha os novos valores. Com redução de movimento, a geometria vai diretamente ao destino.

Os dados são ilustrativos e ficam na memória. Os preços não representam ofertas de viagem. As três fotografias de paisagens vêm do Unsplash e estão embutidas no exemplo para funcionar offline. Não há serviço de reservas ou conta conectado.

## Implementação

- `Atlas.vue`: tela compartilhada, navegação controlada, rascunhos e dados locais.
- `atlas/theme.ts`: tipografia, cores e tempos de movimento do exemplo.
- `atlas/photos.ts`: imagens embutidas com suas URLs de origem.

A tela compartilhada não acessa DOM nem views nativas. Os renderizadores cuidam desses detalhes. A composição decorativa exclusiva da Web fica isolada com `MPlatform`; os controles de planejamento são compartilhados.

<<< @/../examples/catalog/shared/atlas/theme.ts
