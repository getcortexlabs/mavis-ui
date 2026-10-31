---
title: Sessão de foco
description: Uma tela compartilhada Mavis com um grupo Radio, slider controlado, loading e conteúdo condicional no nativo e na Web.
---

# Sessão de foco

Escolha um ambiente, ajuste a duração e prepare uma sessão. Radio escolhe o ambiente; Slider e Button controlam a duração e a preparação. O mesmo código Vue roda no NativeScript e na Web.

<a href="/playground/#/showcase/focus" target="_blank" rel="noopener">Abrir exemplo interativo ↗</a>

A tela usa dados locais de demonstração e não reproduz áudio. Os valores das opções Radio são independentes dos rótulos traduzidos; o resumo usa o rótulo. Durante a preparação, as opções ficam desabilitadas. A aplicação controla os valores e o estado de preparação, enquanto os componentes controlam a renderização e as regras de interação. Trocar o tema preserva a seleção.

## Código

<<< @/../examples/catalog/shared/pages/Focus.vue

Consulte o [contrato dos componentes](../guide/component-contract) para padrões, eventos e limites de plataforma.
