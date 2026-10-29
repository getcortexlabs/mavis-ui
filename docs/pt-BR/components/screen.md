---
title: Screen
description: "Screen no Mavis UI. A superfície de uma tela, com tema e rolagem opcional."
---

# Screen

`m-screen` · A superfície de uma tela, com tema e rolagem opcional.

<ComponentPreview component="screen" :height="380" />

## Uso

```vue
<m-screen scroll>
  <m-column padding="lg" gap="md">
    <m-text as="h1" variant="title">Sua tela</m-text>
    <m-card><m-text>Seu conteúdo.</m-text></m-card>
  </m-column>
</m-screen>
```

## API

| Propriedade | Tipo | Padrão | Uso |
| --- | --- | --- | --- |
| `scroll` | boolean | `false` | Habilita rolagem vertical. |

No NativeScript, Screen representa uma Page e precisa de um host de navegação, como RouterView. Use uma Screen por tela; não coloque uma Page dentro de outra. Na Web, ela representa o elemento main, ocupa pelo menos a altura da janela e, com `scroll`, mantém a rolagem dentro dessa área. A prévia acima usa um documento separado.

## Safe areas e teclado

Screen controla a área de uma página. No NativeScript, Page fornece os insets do sistema; a área de rolagem fica dentro deles, inclusive após rotação. Adicione padding para o seu desenho, sem repetir o afastamento da barra de status ou do indicador de início.

Use `scroll` em conteúdo longo e formulários. No iOS, Screen reserva a parte da área de rolagem coberta pelo teclado acoplado e traz o campo nativo focado para a área visível. Ao descarregar a página, restaura os insets originais e remove os observadores. Evite aplicar outro gerenciador de insets de teclado à mesma área de rolagem. Teclados flutuantes e sobreposições próprias não reservam uma faixa de largura total.

No Android, a Activity do app precisa usar `android:windowSoftInputMode="adjustResize"`; o catálogo já faz isso. O Android redimensiona a área disponível e rola até o campo focado. Screen não altera a política da janela do app.

Na Web, uma Screen com rolagem acompanha a área visível quando as barras do navegador ou o teclado mudam sua altura. Ela considera também o deslocamento da página que o Safari pode fazer ao focar um campo e mantém o controle focado visível. O zoom por pinça preserva o tamanho do layout para permitir a exploração do conteúdo ampliado. Use a configuração normal de viewport com largura do dispositivo; um host que escolha `viewport-fit=cover` controla seu espaçamento adicional com os insets CSS de safe area.

`scroll=false` não oferece ajuste ao teclado nem torna acessível um conteúdo nativo maior que a tela. Uma Screen representa uma página: não aninhe Screens nem acrescente outra rolagem vertical ao redor dela.

## Navegação e ciclo de vida

Screen não controla o roteador, o histórico ou o estado do app. O catálogo foca `main` após a navegação Web, inclusive ao abrir uma rota direta; o host nativo controla o foco da página. Uma página nativa guardada no histórico pode continuar montada mesmo descarregada, e a plataforma pode restaurar o foco do campo e o teclado ao voltar ou retomar o app. Screen reaplica seu tratamento da área visível quando é carregada novamente.

Use o ciclo de vida do roteador ou da plataforma para pausar trabalho do app enquanto a página está escondida; o unmount do Vue cuida do descarte. Mantenha em um store ou contexto compartilhado o estado que precisa sobreviver à remontagem de rotas Web. O Mavis libera seus próprios observadores de viewport e efeitos de pressão separadamente do trabalho do seu app.

## Verificações de Screen

A [tela de verificação](https://mavis-ui.getcortexlabs.com/playground/#/checks/screen) usa um campo da plataforma apenas para exercitar Screen; não é uma nova API de input do Mavis. Veja [como reproduzir as verificações nativas](https://github.com/getcortexlabs/mavis-ui/blob/main/test/native-screen.md) de safe areas, teclado real, rotação, navegação e retomada do app. Os testes de navegador também cobrem foco em rotas diretas, redução da área visível e remoção de observadores.

## Exemplo completo

Este arquivo também é executado no catálogo NativeScript e na prévia Web.

<details>
<summary>Ver o código</summary>

<<< @/../examples/catalog/shared/demos/ScreenDemo.vue

</details>

## Em contexto

[Veja os componentes em uma tela completa de controles de veículo](../showcase/vehicle).

[Nomes acessíveis, foco e verificações com leitores de tela](../guide/accessibility).
