---
description: "Princípios de design do Mavis UI: componentes consistentes, estados acessíveis, temas adaptáveis e interação nativa com Jolt e vue-router-ns."
---

# Princípios de design

O Mavis deve facilitar a primeira tela e ajudar a manter as próximas dez consistentes. Estes são os princípios que orientam o design da biblioteca.

::: info Direção do projeto
O repositório já inclui uma base experimental. Estes princípios também orientam os componentes que ainda virão. [Experimente a implementação atual](./foundation).
:::

## Consistência desde o começo

Um botão, um input e uma sheet precisam parecer parte do mesmo app. Tipografia, espaçamento, cores e formato dos cantos precisam de uma base comum.

Valores de tema compartilhados são o ponto de partida. Cada componente ainda deve permitir ajustes locais.

## Todos os estados importam

Um componente não se resume à aparência inicial. Pressionado, focado, desabilitado, carregando e em erro são estados que precisam do mesmo cuidado.

Rótulos de acessibilidade, contraste legível, áreas de toque adequadas e preferências de movimento reduzido devem fazer parte do trabalho desde o início.

## A animação deve explicar a interação

O feedback confirma um toque. Uma transição conecta duas telas. A entrada de uma sheet mostra de onde veio o novo conteúdo.

O [Jolt](https://jolt.rafaelaugusto.dev/) é a base desse trabalho no NativeScript. O movimento deve permitir interrupções quando fizer sentido e respeitar a preferência por movimento reduzido.

## Respeitar o que é familiar na plataforma

A navegação de volta, o comportamento do teclado e a apresentação de telas devem seguir as convenções de cada plataforma. A consistência visual precisa dar espaço às diferenças entre iOS e Android.

A primeira integração com Vue usará o [vue-router-ns](https://vue-router-ns.rafaelaugusto.dev/) para navegação.

## O app continua com a sua identidade

A personagem Mavis dá nome e identidade ao projeto. Isso não significa que todo app feito com a biblioteca precise usar a paleta deste site.

A meta são bons padrões que você pode mudar, com uma relação clara entre cada decisão de tema e os componentes afetados por ela.
