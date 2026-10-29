---
title: Layout e texto
description: Combine linhas, colunas e camadas do Mavis com dimensões flexíveis, quebra de linha, texto ampliado e direção de leitura explícita.
---

# Layout e texto

Use Row para grupos horizontais, Column para o fluxo vertical e Box para camadas. Os filhos continuam sendo views nativas no NativeScript e elementos HTML na Web. As propriedades compartilhadas descrevem a composição; métricas de fonte e arredondamento de pixels podem variar.

## Dividir a largura disponível

`grow` distribui o espaço restante depois de medir o conteúdo. Por isso, dois filhos com `grow=1` podem ter larguras diferentes. Para dar a mesma largura a cards com padding igual, comece ambos em zero:

```vue
<m-row gap="md" align="stretch">
  <m-card :width="0" :grow="1" padding="md">
    <m-text>Silêncio</m-text>
    <m-text>Um tempo para se concentrar.</m-text>
  </m-card>
  <m-card :width="0" :grow="1" padding="md">
    <m-text>Chuva</m-text>
    <m-text>Uma descrição maior pode quebrar a linha naturalmente.</m-text>
  </m-card>
</m-row>
```

Porcentagens são dimensões iniciais, não uma grade com espaçamento automático. Em uma Row sem quebra de linha, dois filhos com `width="50%"` precisam encolher para acomodar o `gap`. Filhos Mavis usam `shrink=1` por padrão em uma Row. Definir `shrink=0` preserva a largura solicitada e pode causar transbordamento. O Flexbox nativo e o CSS distribuem a redução de itens desiguais de maneiras diferentes; não dependa de uma redução proporcional idêntica.

Use `wrap` quando itens inteiros devem passar para outra linha. A quebra é decidida antes do crescimento; dois itens de 50% mais um gap precisam de duas linhas. Alturas percentuais e crescimento vertical precisam de um pai com altura delimitada. Em uma Column com rolagem, prefira a altura natural.

## Deixar o texto definir a altura

Text quebra linhas por padrão. Os rótulos de Button nativo também quebram linhas e preservam uma altura mínima de toque. No iOS, ambos acompanham o Dynamic Type; no Android, a escala de fonte do sistema. Uma pessoa pode precisar de muito mais espaço que o tema padrão sugere.

Evite alturas fixas em descrições, títulos traduzidos e ações. Use padding e gaps para dar espaço ao conteúdo e uma Screen com rolagem quando ele puder exceder a tela. `wrap=false` mantém o texto em uma linha por escolha; isso não garante que qualquer rótulo caiba.

Box coloca os filhos na mesma célula, desenhando os últimos sobre os anteriores. Coloque uma Column dentro dele quando o conteúdo precisar seguir um fluxo vertical.

## Direção e alinhamento

Os renderizadores atuais aceitam `style.direction` explícito como estilo de plataforma. Isso não é uma propriedade própria de direção do Mavis e não seleciona um idioma:

```vue
<m-row :style="{ direction: 'rtl' }" gap="sm" justify="start">
  <m-text align="right">إعدادات الجلسة</m-text>
  <m-button>حفظ</m-button>
</m-row>
```

Em uma Row RTL, o primeiro filho fica à direita e `justify="start"` começa desse lado. Em uma Column, `justify` continua vertical; `align="start"` acompanha a direção horizontal. `center` continua centralizado. `left` e `right` de Text são alinhamentos físicos; escolha-os explicitamente conforme o conteúdo. Espelhar o visual, por si só, não estabelece uma ordem de leitura acessível completa.

## Verificação

A [tela compartilhada de validação](https://mavis-ui.getcortexlabs.com/playground/#/checks/layout) exercita porcentagens com gaps, crescimento a partir de largura zero, Row/Column/Box aninhados, quebra de linha, irmãos com largura fixa, textos longos e RTL. As verificações comparam os limites reais antes da expansão, com conteúdo longo e depois da contração. Os testes de navegador incluem 320 px, celular, paisagem e tablet, além de texto dobrado. As verificações nativas usam builds instalados em simuladores e incluem fonte ampliada pelo sistema.

Veja [como reproduzir no repositório](https://github.com/getcortexlabs/mavis-ui/blob/main/test/native-layout.md). Veja [Screen](../components/screen#safe-areas-e-teclado) para a responsabilidade sobre safe areas e teclado. Estas verificações não cobrem aparelhos físicos nem uma auditoria de leitores de tela.
