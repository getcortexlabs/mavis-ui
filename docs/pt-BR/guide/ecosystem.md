---
description: "Entenda o papel de NativeScript, Jolt e vue-router-ns no Mavis UI e as bases planejadas para componentes, animação e navegação nativa."
---

# Ecossistema

O Mavis cuida da camada de UI. Jolt e vue-router-ns fornecem as bases de animação e navegação da primeira integração.

## NativeScript

[NativeScript](https://nativescript.org/) é a plataforma inicial. O Mavis é pensado para interfaces nativas de iOS e Android, com NativeScript-Vue como primeira integração.

## Jolt: animação

[Jolt](https://jolt.rafaelaugusto.dev/) é uma biblioteca de animação para NativeScript. Oferece presets, springs, keyframes e animações escalonadas para views nativas.

A Mavis usa o Jolt no feedback de toque dos botões e nas transições de revelação. Ele é uma peer dependency obrigatória: o aplicativo instala o Jolt explicitamente. A biblioteca preserva sua configuração de movimento reduzido.

- [Documentação do Jolt](https://jolt.rafaelaugusto.dev/)
- [Começando com Jolt](https://jolt.rafaelaugusto.dev/guide/)

## vue-router-ns: navegação

[vue-router-ns](https://vue-router-ns.rafaelaugusto.dev/) leva a API do Vue Router ao NativeScript-Vue 3, usando as pilhas de navegação nativas.

É a base de navegação da primeira integração do Mavis com Vue. Isso inclui fluxos de tela com rotas, abas e apresentação de modais. As escolhas de navegação para outros frameworks serão tratadas nas respectivas integrações.

- [Documentação do vue-router-ns](https://vue-router-ns.rafaelaugusto.dev/)
- [Começando com vue-router-ns](https://vue-router-ns.rafaelaugusto.dev/guide/)

## O que está disponível hoje?

Jolt e vue-router-ns têm documentação e lançamentos próprios. A Mavis possui uma implementação experimental e o catálogo interativo no repositório, ainda sem pacote publicado. [Execute o exemplo](./foundation).

Veja o [roadmap](./roadmap) para conhecer o escopo planejado.

## Vue Web

A versão Web usa HTML, Vue e Vue Router. Temas e telas do catálogo são compartilhados com o nativo. O Jolt continua específico ao NativeScript nesta versão; [Jolt #236](https://github.com/rafaelaugustos/jolt/issues/236) acompanha o suporte Web. [Veja a implementação atual](./web).
