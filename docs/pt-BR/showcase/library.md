---
title: Biblioteca
description: Uma coleção de leituras Mavis compartilhada com filtros independentes, seleção parcial e estado vazio.
---

# Biblioteca

Escolha assuntos de design, desenvolvimento e produto para filtrar uma pequena coleção de leituras. A tela começa com dois assuntos selecionados, deixando o checkbox pai no estado parcial. Selecione todos, escolha assuntos individuais ou limpe a seleção para ver o estado vazio.

<a href="/playground/#/showcase/library" target="_blank" rel="noopener">Abrir exemplo interativo ↗</a>

A tela controla o array de IDs selecionados, deriva os dois estados do pai e filtra os cartões. `MCheckbox` apenas solicita mudanças. A coleção é uma demonstração local, sem requisições nem preferências salvas; sair da tela reinicia os filtros.


Os filtros de assuntos usam Chip selecionável. A busca encontra títulos e descrições, ignorando maiúsculas e acentos. EmptyState oferece limpar filtros quando nada combina; os salvos têm um estado vazio próprio e retorno a Explorar. Busca e assuntos não filtram a aba Salvos.

## Código

<<< @/../examples/catalog/shared/pages/Library.vue

[Referência de Checkbox](../components/checkbox) · [Temas](../guide/themes)

`MTabs` separa Explorar e Salvos. Salvar uma leitura atualiza o contador da aba; filtros e IDs salvos ficam no pai e permanecem ao trocar painéis. A coleção reinicia ao sair da tela. [Referência de Tabs](../components/tabs).

**Atualizar coleção** simula uma espera de 1,5 segundo com `MSkeleton`. Filtros, aba ativa e salvos são preservados; não há requisição de rede.

## Feedback do download

**Baixar coleção** demonstra um fluxo local: preparação indeterminada, progresso conhecido, cancelamento, falha e nova tentativa. **Simular falha** interrompe o timer; o aviso de erro oferece outra tentativa. Ao concluir, a ação **Ver salvos** abre os itens salvos. Fechar um aviso só esconde a mensagem; filtros e favoritos continuam preservados.

É uma simulação: nenhum arquivo é buscado, armazenado ou disponibilizado offline. O timer é cancelado ao desmontar a tela. O app controla progresso e mensagens; `MProgress` e `MAlert` exibem esse estado.

[Referência de Progress](../components/progress) · [Referência de Alert](../components/alert)

<details>
<summary>Código do exemplo de download</summary>

<<< @/../examples/catalog/shared/LibraryDownload.vue

</details>
