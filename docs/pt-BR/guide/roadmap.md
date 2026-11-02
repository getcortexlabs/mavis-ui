---
title: Roadmap e próximos passos
description: "Acompanhe o roadmap do Mavis UI: os próximos controles Switch, Checkbox, Radio e Select, o inventário de componentes e futuras integrações NativeScript."
---

# Roadmap

O Mavis tem pacotes experimentais no npm para NativeScript-Vue e Vue Web. A API pode mudar entre versões alpha; ainda não há data para uma versão estável. [Instale a alpha atual](./foundation).

## Agora: validar a base

A coleção atual tem trinta componentes: Screen, Row, Column, Box, Card, Text, Icon, Button, Input, Switch, Checkbox, Radio, Select, Slider, Sheet, Dialog, Toast, Tabs, Chip, EmptyState, Accordion, SegmentedControl, Skeleton, Progress, Alert, Avatar, Badge, ListItem, Separator e Reveal. Os temas Mavis e Midnight funcionam no catálogo nativo e nas telas Vue Web compartilhadas. No nativo, o Jolt cuida do movimento e o vue-router-ns da navegação; na Web, Button/Card/Reveal usam Jolt e a navegação usa Vue Router. [Veja o compartilhamento](./web).

O retorno de apps reais, os testes em aparelhos e as verificações de layout, teclado e desempenho continuam junto com o desenvolvimento dos componentes. O [índice de entregas](https://github.com/getcortexlabs/mavis-ui/issues/1) registra os limites restantes e as correções concluídas.

## Primeira expansão: seleção e formulários

O primeiro lote de seleção e formulários, Switch → Checkbox → Radio → Select, está implementado para NativeScript-Vue e Vue Web no repositório. Os quatro entram na próxima alpha, depois da `0.1.0-alpha.3`. Select reutiliza o contrato de opções do Radio.

| Controle | Tipo e finalidade | Issue |
| --- | --- | --- |
| Switch | Primitivo para uma preferência ligada/desligada de efeito imediato, como notificações. | [#76](https://github.com/getcortexlabs/mavis-ui/issues/76) |
| Checkbox | Primitivo para escolhas independentes, incluindo um estado indeterminado explícito. | [#77](https://github.com/getcortexlabs/mavis-ui/issues/77) |
| Radio | Primitivo de grupo para uma escolha entre opções visíveis, com valor controlado e opções desabilitadas. | [#78](https://github.com/getcortexlabs/mavis-ui/issues/78) |
| Select | Campo composto para uma escolha em uma lista local. Reaproveita o contrato de opções do Radio e abre uma Sheet no NativeScript. | [#79](https://github.com/getcortexlabs/mavis-ui/issues/79) |

A ordem mantém os primeiros controles pequenos e dá ao Select um contrato de opções já definido. Switch e Checkbox não dependem um do outro em execução. Busca, carregamento remoto, seleção múltipla e listas virtualizadas ficam fora do primeiro Select.

Cada entrega inclui:

- Contrato de valor e tipos compartilhados, com as diferenças de plataforma tratadas dentro do renderizador.
- Visual Mavis e Midnight nos estados ativo, pressionado, focado e desabilitado, revisado com rótulos longos, telas estreitas e tamanho de texto do sistema.
- Rótulos e estados de seleção claros, área fácil de acionar e interação de teclado esperada. Button/Card/Reveal usam Jolt nos dois renderizadores; outros indicadores Web mantêm CSS. Ambos respeitam movimento reduzido.
- Demo compartilhada do componente, exemplo em uma tela completa, documentação EN/PT e testes de mudança de valor, interação e limpeza nos dois renderizadores.

O app continua responsável por validação, persistência e envio. Este lote não cria um motor de formulários. Nenhuma dessas quatro issues depende do Jolt Web.

## Feedback: Toast

[Toast](../components/toast) acrescenta fila local, fechamento automático ou manual e quatro tons no NativeScript-Vue e na Web. Ele segue o lote de seleção/formulários e chega na próxima alpha depois da `0.1.0-alpha.3`. Entrega e validação: [#85](https://github.com/getcortexlabs/mavis-ui/issues/85).


## Confirmações: Dialog

[Dialog](../components/dialog) acrescenta decisões controladas, tom destrutivo e processamento nos dois renderizadores. Disponível para a próxima alpha; [#87](https://github.com/getcortexlabs/mavis-ui/issues/87).

## Abas de conteúdo: Tabs

[Tabs](../components/tabs) organiza painéis locais com seleção controlada, barra rolável e indicador animado. A Biblioteca inclui Explorar e Salvos. Próxima alpha após `0.1.0-alpha.3`; [#89](https://github.com/getcortexlabs/mavis-ui/issues/89).

## Carregamento: Skeleton

[Skeleton](../components/skeleton) compõe placeholders com pulso opcional e inclui carregamento simulado na Biblioteca. Próxima alpha após `0.1.0-alpha.3`; [#91](https://github.com/getcortexlabs/mavis-ui/issues/91).

## Inventário para os próximos lotes

Os candidatos abaixo continuam na [issue de inventário #31](https://github.com/getcortexlabs/mavis-ui/issues/31). Eles não têm data de implementação; uma necessidade concreta de app e um contrato definido vão orientar o próximo lote.

| Área | Candidatos e tipo | O que precisa ser definido antes |
| --- | --- | --- |
| Formulários | Seletores de data/hora: integrações de plataforma. | Localidade, fuso horário e comportamento dos seletores nativos e do navegador. |
| Seleção | Controle segmentado: padrão composto de seleção. | Reuso do contrato do Radio e os casos em que segmentos compactos funcionam melhor. |
| Feedback | Progress e Alert disponíveis no repositório (#107/#108), junto de Toast e Skeleton. | Novos padrões dependem de fluxos reais do app; anúncios e tarefas continuam sob controle do consumidor. |
| Camadas | Popover: integração de apresentação ancorada. | Foco, dispensa, posição da âncora, teclado e bordas da janela. |
| Navegação | Barra de abas: integração de navegação. | Separar a seleção local de painéis do estado do router, do comportamento de voltar e de links diretos. |
| Conteúdo | Avatar, Badge, ListItem e Separator estão disponíveis no repositório (#94/#95/#97/#98); coleções virtualizadas: integração de plataforma. | Alternativa para imagens ausentes, semântica de status e necessidades de linhas reutilizáveis; coleções grandes também exigem um contrato de virtualização medido. |

Primitivos oferecem um contrato pequeno de visual e interação. Padrões compostos combinam essas peças. Integrações de plataforma coordenam serviços como seletores, navegação ou virtualização de coleções e precisam de validação própria por plataforma.

## Depois: os demais frameworks do NativeScript

Vue é a primeira porta de entrada, não o limite da biblioteca. Queremos ampliar o suporte para os outros frameworks do ecossistema NativeScript.

A intenção é manter os nomes, as propriedades e as regras de composição, respeitando a sintaxe de cada framework. As definições de tema já ficam fora da integração Vue.

## Mais adiante: explorar outras plataformas

React Native, Flutter e integrações nativas diretas são possibilidades futuras. Nenhuma delas está em desenvolvimento no Mavis neste momento, e não há uma ordem de lançamento definida.

| Plataforma | Direção |
| --- | --- |
| NativeScript-Vue | Implementação experimental no repositório |
| Vue Web | Implementação experimental com telas compartilhadas |
| Demais frameworks do NativeScript | Expansão planejada |
| React Native | Possibilidade futura |
| Flutter | Possibilidade futura |
| Integrações nativas diretas | Possibilidade futura |

## Acompanhe o progresso

Acompanhe o [índice de entregas](https://github.com/getcortexlabs/mavis-ui/issues/1), o [inventário de componentes](https://github.com/getcortexlabs/mavis-ui/issues/31) e as [releases](https://github.com/getcortexlabs/mavis-ui/releases). As referências dos componentes descrevem a API implementada; este roadmap distingue o próximo lote aprovado dos candidatos futuros.

## Identidade e contexto

[Avatar](../components/avatar) e [Badge](../components/badge) compõem identidades, categorias e estados no perfil. Próxima alpha após `0.1.0-alpha.3`; [#94](https://github.com/getcortexlabs/mavis-ui/issues/94) e [#95](https://github.com/getcortexlabs/mavis-ui/issues/95).

## Linhas e divisões

[ListItem](../components/list-item) e [Separator](../components/separator) compõem a nova [Equipe](../showcase/team). Próxima alpha após `0.1.0-alpha.3`; issues [#97](https://github.com/getcortexlabs/mavis-ui/issues/97) e [#98](https://github.com/getcortexlabs/mavis-ui/issues/98).

## Progresso e avisos

[Progress](../components/progress) e [Alert](../components/alert) compõem o download simulado da [Biblioteca](../showcase/library): preparação, progresso, cancelamento, erro e nova tentativa. Próxima alpha após `0.1.0-alpha.3`; issues [#107](https://github.com/getcortexlabs/mavis-ui/issues/107) e [#108](https://github.com/getcortexlabs/mavis-ui/issues/108).


## Expansão e seleção compacta

[Accordion](../components/accordion) e [SegmentedControl](../components/segmented-control) compõem a [Central de ajuda](../showcase/help), com assuntos e respostas controlados pelo app. Próxima alpha após `0.1.0-alpha.3`; issues [#110](https://github.com/getcortexlabs/mavis-ui/issues/110) e [#111](https://github.com/getcortexlabs/mavis-ui/issues/111).

[Chip](../components/chip) e [EmptyState](../components/empty-state) ampliam a [Biblioteca](../showcase/library) com filtros e recuperação de resultados vazios. Próxima alpha após `0.1.0-alpha.3`; issues [#114](https://github.com/getcortexlabs/mavis-ui/issues/114) e [#115](https://github.com/getcortexlabs/mavis-ui/issues/115).
