---
title: Biblioteca
description: Uma coleção de leituras Mavis compartilhada com filtros independentes, seleção parcial e estado vazio.
---

# Biblioteca

Escolha assuntos de design, desenvolvimento e produto para filtrar uma pequena coleção de leituras. A tela começa com dois assuntos selecionados, deixando o checkbox pai no estado parcial. Selecione todos, escolha assuntos individuais ou limpe a seleção para ver o estado vazio.

<a href="/playground/#/showcase/library" target="_blank" rel="noopener">Abrir exemplo interativo ↗</a>

A tela controla o array de IDs selecionados, deriva os dois estados do pai e filtra os cartões. `MCheckbox` apenas solicita mudanças. A coleção é uma demonstração local, sem requisições nem preferências salvas; sair da tela reinicia os filtros.

## Código

<<< @/../examples/catalog/shared/pages/Library.vue

[Referência de Checkbox](../components/checkbox) · [Temas](../guide/themes)
