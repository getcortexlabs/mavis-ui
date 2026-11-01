---
title: Equipe
description: Uma equipe em uma tela compartilhada com ListItem, Separator, Avatar, Badge, Tabs e Sheet.
---

# Equipe

Quatro pessoas fictícias, áreas diferentes e uma identidade compartilhada. A tela combina ListItem com Avatar e Badge; Separator organiza os contatos e os números do estúdio.

<a href="/playground/#/showcase/team" target="_blank" rel="noopener">Abrir exemplo interativo ↗</a>

Tabs filtra todas as pessoas ou somente as disponíveis. Tocar na linha abre detalhes em Sheet. Favoritar ou remover favorito atualiza a linha e o contador; trocar a aba ou fechar os detalhes preserva esse estado. Sair da tela reinicia a demonstração. Não há conta, contatos reais, mensagens ou requisições de rede.

O estado pertence ao pai. ListItem fornece somente a composição e a ação; o app escolhe os filtros, a pessoa aberta e a lista de favoritos. Linhas interativas recebem um nome acessível que inclui função, disponibilidade e favorito. Os slots são visuais, sem controles aninhados.

## Código

<<< @/../examples/catalog/shared/pages/Team.vue

Referências: [ListItem](../components/list-item), [Separator](../components/separator), [Avatar](../components/avatar), [Badge](../components/badge), [Tabs](../components/tabs) e [Sheet](../components/sheet).
