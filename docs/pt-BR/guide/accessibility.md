---
title: Acessibilidade
description: 'Nomes acessíveis, teclado, leitores de tela e foco nos componentes experimentais do Mavis.'
---

# Acessibilidade

O Mavis usa acessibilidade nativa no Android e no iOS, e HTML semântico na Web. Os componentes iniciais têm verificações específicas com leitores e teclado. Isso não certifica toda interface construída com eles: nomes, ordem do conteúdo, cores personalizadas e navegação ainda precisam de revisão no app consumidor.

## Nomes e agrupamento

Use texto visível e direto no Button. Informe `accessibilityLabel` quando a ação precisar de contexto adicional e preserve as palavras visíveis nesse nome. Escolha um `loadingText` informativo, como “Salvando alterações…”. O carregamento impede outra ativação. Na Web, mantém o botão focado na ordem do teclado com `aria-disabled` e `aria-busy`; `disabled` usa o estado desabilitado nativo do HTML.

Slider exige `label`. Seus limites e valor acessíveis usam os números da aplicação, inclusive passos fracionários. Incrementar e decrementar percorre um valor permitido por vez, incluindo o último intervalo quando ele é menor. No intervalo `0…1`, com `step=0.3`, decrementar a partir de `1` chega a `0.9`.

Um Card interativo representa uma ação. Defina `accessibilityLabel` e mantenha botões, links e campos fora dele. Seus descendentes Mavis são decorativos para essa ação nomeada. Um Card comum preserva a semântica de cada filho. Views específicas da plataforma continuam sob responsabilidade da aplicação.

Use `as="h1"` até `as="h6"` no Text para títulos com significado. `variant` muda a tipografia de forma independente. Row, Column e Box organizam o conteúdo; não substituem títulos nem controles acionáveis. `accessibilityHidden` serve para decoração. Na Web, também torna a subárvore inerte; não use essa propriedade para esconder uma ação necessária.

## Foco e navegação

Buttons e Cards interativos da Web aceitam ativação pelo teclado e exibem foco visível. Sliders aceitam setas, Home e End. Uma Screen com rolagem pode receber foco mesmo contendo somente texto, permitindo alcançar o restante com Page Down.

Reveal não move o foco ao abrir. Se o foco estiver dentro do conteúdo ao fechar, ele retorna ao elemento que tinha foco na abertura, desde que esse elemento continue disponível. O conteúdo em saída fica excluído da acessibilidade durante a animação. Abrir Reveal sem um acionador focado não define um destino de restauração.

Screen fornece o limite de uma página; o router do app controla as rotas, páginas retidas e seu estado. Confira o foco inicial e o retorno de cada destino. Uma página restaurada e uma página recém-aberta podem começar em elementos diferentes. Não acrescente uma segunda Screen dentro da página para forçar o comportamento de foco.

A restauração nativa acompanha elementos Mavis. Controles específicos da plataforma inseridos diretamente precisam de sua própria integração de foco.

## Texto, cores e alvos

Text e Button acompanham a ampliação de texto nativa; os rótulos de Button podem quebrar linha. Evite alturas fixas que cortem conteúdo importante em tamanhos maiores. Confira sua composição com as maiores fontes suportadas e uma viewport estreita.

No iOS, Text, Button e Input seguem a curva de Dynamic Type de um estilo de texto do sistema equivalente: `display` segue Large Title, `title` Title 1, `heading` Title 3, `body`, botões e campos Body, `caption` Footnote e `overline` Caption 2. No menor tamanho de texto, o corpo fica com cerca de 82% do padrão e os títulos encolhem menos, como nos outros apps do iOS. O `iosAccessibilityAdjustsFontSize` do próprio NativeScript usa outra tabela, que corta o texto pela metade no menor tamanho e o multiplica por até quatro no maior; labels do Core na mesma tela continuam com essa tabela, então prefira Text ou limite-os com `iosAccessibilityMinFontScale` e `iosAccessibilityMaxFontScale`.

Buttons e Sliders padrão reservam ao menos 48 DIPs no Android e 44 pontos no iOS; na Web, os controles reservam 44 pixels CSS. O alvo de um Card interativo depende do conteúdo e do padding. Estilos do consumidor podem sobrescrever essas dimensões: inspecione o resultado final.

Os temas Mavis e Midnight verificam pares de texto normal em 4,5:1 e cores de controles/foco contra suas superfícies padrão em 3:1. A trilha do Slider usa `muted` para permanecer distinguível nessas superfícies. Temas personalizados, outros fundos e estados desabilitados precisam de revisão própria.

## Reproduzir as verificações

A tela compartilhada fica em `/playground/#/checks/accessibility`. Ela reúne os nove componentes iniciais, navegação, carregamento, decoração e ações desabilitadas. A suíte Web audita cada demo nos dois temas com axe e verifica foco pelo teclado e rolagem em Chromium e WebKit.

Os testes com leitores nativos, ambientes suportados e comandos estão no [guia de acessibilidade do repositório](https://github.com/getcortexlabs/mavis-ui/blob/main/test/native-accessibility.md). Resultados de simuladores não substituem a [matriz de aparelhos físicos](https://github.com/getcortexlabs/mavis-ui/issues/23). Movimento e redução de animações também fazem parte da [revisão de ciclo de vida das animações](https://github.com/getcortexlabs/mavis-ui/issues/33).

A regressão com o leitor no iOS inclui carregamentos repetidos na mesma página, além das verificações independentes por tema. A [#53](https://github.com/getcortexlabs/mavis-ui/issues/53) registra a correção do ciclo de vida do texto removido e a matriz de aparelhos. Há um caso separado na [#54](https://github.com/getcortexlabs/mavis-ui/issues/54): o VoiceOver pode pular um status inserido fora da área visível no primeiro ciclo, ainda permitindo chegar aos controles seguintes. Esse caso é uma limitação conhecida da alpha; a verificação da repetição não o cobre.
