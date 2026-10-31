---
title: Roadmap e próximos passos
description: "Acompanhe o roadmap do Mavis UI: os próximos controles Switch, Checkbox, Radio e Select, o inventário de componentes e futuras integrações NativeScript."
---

# Roadmap

O Mavis tem pacotes experimentais no npm para NativeScript-Vue e Vue Web. A API pode mudar entre versões alpha; ainda não há data para uma versão estável. [Instale a alpha atual](./foundation).

## Agora: validar a base

A coleção atual tem quatorze componentes: Screen, Row, Column, Box, Card, Text, Icon, Button, Input, Switch, Checkbox, Slider, Sheet e Reveal. Os temas Mavis e Midnight funcionam no catálogo nativo e nas telas Vue Web compartilhadas. No nativo, o Jolt cuida do movimento e o vue-router-ns da navegação; na Web, usamos CSS e Vue Router. [Veja o compartilhamento](./web).

O retorno de apps reais, os testes em aparelhos e as verificações de layout, teclado e desempenho continuam junto com o desenvolvimento dos componentes. O [índice de entregas](https://github.com/getcortexlabs/mavis-ui/issues/1) registra os limites restantes e as correções concluídas.

## Primeira expansão: seleção e formulários

O próximo lote é Switch → Checkbox → Radio → Select, para NativeScript-Vue e Vue Web. Switch e Checkbox estão implementados no repositório para a próxima alpha, depois da `0.1.0-alpha.3`. Radio e Select continuam planejados; as respectivas issues vão definir a API final e registrar a disponibilidade.

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
- Rótulos e estados de seleção claros, área fácil de acionar e interação de teclado esperada. O movimento nativo usa Jolt; a Web mantém CSS enquanto seu backend está pendente. Ambos respeitam movimento reduzido.
- Demo compartilhada do componente, exemplo em uma tela completa, documentação EN/PT e testes de mudança de valor, interação e limpeza nos dois renderizadores.

O app continua responsável por validação, persistência e envio. Este lote não cria um motor de formulários. Nenhuma dessas quatro issues depende do Jolt Web.

## Inventário para os próximos lotes

Os candidatos abaixo continuam na [issue de inventário #31](https://github.com/getcortexlabs/mavis-ui/issues/31). Eles não têm data de implementação; uma necessidade concreta de app e um contrato definido vão orientar o próximo lote.

| Área | Candidatos e tipo | O que precisa ser definido antes |
| --- | --- | --- |
| Formulários | Seletores de data/hora: integrações de plataforma. | Localidade, fuso horário e comportamento dos seletores nativos e do navegador. |
| Seleção | Controle segmentado: padrão composto de seleção. | Reuso do contrato do Radio e os casos em que segmentos compactos funcionam melhor. |
| Feedback | Progress: primitivo. Alert, Toast e Skeleton: padrões compostos. | Fluxos de carregamento/erro, anúncio e dispensa, além do custo de movimento em placeholders repetidos. |
| Camadas | Dialog: padrão composto. Popover: integração de apresentação ancorada. | Foco, dispensa, posição da âncora, teclado e bordas da janela. |
| Navegação | Tabs: padrão composto de conteúdo. Barra de abas: integração de navegação. | Separar a seleção local de painéis do estado do router, do comportamento de voltar e de links diretos. |
| Conteúdo | Avatar, Badge e Separator: primitivos. Lista/item: padrão composto; coleções virtualizadas: integração de plataforma. | Alternativa para imagens ausentes, semântica de status e necessidades de linhas reutilizáveis; coleções grandes também exigem um contrato de virtualização medido. |

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
