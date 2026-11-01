---
title: Movimento
description: Como o Mavis compartilha definições de press e Reveal entre NativeScript e Web, incluindo tempos, composição e movimento reduzido.
---

# Movimento

Press e Reveal agora leem seus estados e tempos do mesmo módulo do core. O NativeScript executa essas definições com Jolt. A Web converte os valores suportados em CSS enquanto a [integração Jolt Web](https://github.com/getcortexlabs/mavis-ui/issues/32) está pendente. Essa refatoração está no repositório para a próxima alpha; não faz parte da `0.1.0-alpha.3`.

Props, eventos e telas compartilhadas continuam iguais. Uma definição compartilhada não torna CSS e Jolt motores de animação equivalentes.

## Pressão

`theme.motion.pressScale` é o multiplicador durante a pressão, um número finito maior que `0` e no máximo `1`. O padrão é `0.97`; `1` mantém a escala atual. Trocar o tema atualiza componentes montados. Os tempos são fixos do Mavis e não viraram uma nova opção de tema.

| Estado | Jolt no NativeScript | CSS temporário na Web |
| --- | --- | --- |
| Pressionar | Mola, 200 ms, bounce 0 | 120 ms, ease-out |
| Soltar ou cancelar | Mola, 450 ms, bounce 0.35 | 120 ms, ease-out |
| Contribuição neutra | Multiplicador 1 | Remover a regra de escala ativa |

Button e Card/ListItem interativos usam esse feedback. Os rótulos do Switch nativo também usam a definição de pressão; o thumb mantém o comportamento da plataforma. Na Web, o Switch preserva seu feedback CSS de track/thumb.

Em views nativas, a pressão possui uma camada multiplicativa separada. Base `1.1` do app com fator `0.96` exibe `1.056`. Desabilitar, descarregar ou substituir o feedback remove somente essa camada. Mudanças simultâneas na escala do app devem usar `animate`/`set` do Jolt; veja a [composição nativa](./component-contract#pressao-nativa-e-animacoes-do-app).

O CSS temporário usa a propriedade independente `scale` e `:active`. Ele não fornece composição em camadas Jolt, interrupção de molas ou composição com animações do app. A ativação pelo teclado continua disponível, mas o feedback `:active` do navegador não é um reconhecedor compartilhado de gestos e teclado.

## Reveal

| Fase | Valores compartilhados | Curva na Web |
| --- | --- | --- |
| Entrada | Opacidade 0 → 1; deslocamento vertical 8 → 0; 180 ms | ease-out |
| Saída | Opacidade → 0; 120 ms | ease-in |

O nativo usa `JoltTransition`; a Web usa Vue Transition e CSS. O deslocamento usa DIPs no nativo e pixels CSS na Web. A altura do layout não é interpolada. O conteúdo permanece montado durante a saída e é removido ao terminar. Foco e acessibilidade continuam nos adaptadores de cada plataforma.

## Movimento reduzido

Os dois adaptadores respeitam a preferência do seu ambiente. O nativo herda a configuração do Jolt, cujo padrão é `user`; o Mavis não altera as configurações globais do Jolt. No motor atual, mudanças espaciais chegam imediatamente ao destino, enquanto a opacidade pode manter seu tempo. Assim, uma pressão com movimento reduzido ainda pode aplicar a escala final.

A Web segue `prefers-reduced-motion`: remove a escala de pressão e o deslocamento do Reveal, além de desativar essas transições CSS. São diferenças de execução já existentes, sem promessa de paridade completa. Mudanças de preferência durante todas as interações nativas continuam na [auditoria de ciclo de vida](https://github.com/getcortexlabs/mavis-ui/issues/33).

## Uma definição, adaptadores separados

As definições são helpers internos de integração em `packages/core/src/motion.ts`. Não acessam views, reconhecem eventos, importam frameworks nem implementam timers ou física de molas. O adaptador nativo conecta gestos e gerencia camadas Jolt; o Web produz variáveis CSS e deixa `:active` e classes de transição com o navegador.

<details>
<summary>Ler as definições compartilhadas</summary>

<<< @/../packages/core/src/motion.ts

</details>

O tempo CSS existente aparece como uma alternativa explícita na definição compartilhada. A execução completa com Jolt na Web pertence à [#32](https://github.com/getcortexlabs/mavis-ui/issues/32). Uma animação escrita pelo app e executada nas duas plataformas, com referência experimental à superfície do componente, pertence à [#102](https://github.com/getcortexlabs/mavis-ui/issues/102).

## Gravações das interações

A mesma tela de verificação roda nos três destinos abaixo. As gravações mostram movimento normal, os dois temas, controles desabilitados e desmontagem/remontagem. O tema de teste usa 0.90 para facilitar a observação da mudança; o padrão do produto continua 0.97. São capturas de simulador/emulador e navegador, não de aparelhos físicos.

**NativeScript-Vue · iPhone 17 · simulador iOS 26.2**

<video controls playsinline preload="none" aria-label="NativeScript-Vue · iPhone 17 · simulador iOS 26.2" src="/media/motion-ios.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>

**NativeScript-Vue · Pixel 7 · emulador Android API 36**

<video controls playsinline preload="none" aria-label="NativeScript-Vue · Pixel 7 · emulador Android API 36" src="/media/motion-android.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>

**Vue Web · Chromium 156 · 390 × 844 pixels CSS**

<video controls playsinline preload="none" aria-label="Vue Web · Chromium 156 · 390 × 844 pixels CSS" src="/media/motion-web.mp4" style="width:100%;max-width:402px;border-radius:16px"></video>
