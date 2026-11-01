---
title: Central de ajuda
description: Uma central compartilhada com assuntos segmentados, respostas expansíveis e retorno por pergunta.
---

# Central de ajuda

Escolha um assunto, abra uma resposta e marque se ela foi útil. `MSegmentedControl` seleciona a categoria; `MAccordion` organiza as perguntas expansíveis. Valores abertos e retorno ficam no pai, então voltar a um assunto preserva os dois. A troca de tema mantém o mesmo estado.

<a href="/playground/#/showcase/help" target="_blank" rel="noopener">Abrir exemplo interativo ↗</a>

A tela usa conteúdo local de demonstração. Não envia mensagens, gerencia assinaturas nem salva preferências. **Quero conversar** mostra um aviso no conteúdo explicando esse limite. Desmontar a tela reinicia o estado. Roteadores nativos podem reter a página ao visitar Perfil e voltar.

[Accordion](../components/accordion) · [SegmentedControl](../components/segmented-control) · [Temas](../guide/themes)

## Código

<<< @/../examples/catalog/shared/pages/Help.vue
