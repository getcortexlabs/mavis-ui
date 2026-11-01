---
title: Tipografia e personalização
description: Famílias de fonte, ritmo das linhas, tokens por componente e elevação no NativeScript e na Web.
---

# Tipografia e personalização

Cada variante tem `fontFamily`, `fontSize`, `fontWeight`, `lineHeight` e `letterSpacing`. O tema reúne as decisões visuais. O [Atelier](../showcase/studio) demonstra duas famílias e ajustes locais de Input, Button e Card.

```ts
const brand = defineTheme({
  name: 'brand',
  typography: {
    title: {
      fontFamily: { web: 'Georgia, serif', ios: 'Georgia', android: 'serif' },
      fontSize: 36,
      fontWeight: 'normal',
      lineHeight: 1.2,
      letterSpacing: -0.02,
    },
    body: { fontFamily: 'system', lineHeight: 1.5 },
  },
  components: {
    button: { fontWeight: '600', paddingY: 14, radius: 'full' },
    input: { fontSize: 18, paddingX: 20, paddingY: 16 },
    card: { padding: 'lg', radius: 'lg', elevation: 'md' },
  },
  elevation: { md: { x: 0, y: 8, blur: 24, spread: 0, color: 'rgba(37, 30, 50, 0.14)' } },
})
```

## Carregamento de fontes e unidades

`fontFamily: 'system'` seleciona a fonte do sistema. Outra string identifica uma família instalada ou incluída no app. O objeto permite uma lista CSS na Web, o nome da família/PostScript no iOS e a família ou nome do arquivo sem extensão no Android. Nomes `ios`/`android` vazios pedem a fonte do sistema. O Mavis não baixa fontes: hospede as fontes Web com `@font-face` e alternativas; inclua arquivos nativos na pasta fonts do app e confira seus nomes internos. Consulte [a documentação de fontes do NativeScript](https://docs.nativescript.org/guide/styling). O exemplo usa fontes das plataformas, sem download.

Tamanhos usam pixels CSS na Web e unidades nativas independentes de densidade antes da escala de texto do sistema. Pesos aceitam `normal`, `bold` e strings de `100` a `900`; a fonte precisa oferecer ou sintetizar esse peso. A prop `weight` do MText altera o peso sem mudar o tamanho da variante.

`lineHeight` é um ritmo sem unidade, de no mínimo 1. Na Web vira `line-height` CSS. No Core 9.1.3, o `lineHeight` nativo representa **espaço adicional entre linhas**: o Mavis converte para `fontSize × (lineHeight − 1)`. Métricas da fonte e escala do sistema continuam determinando a altura final; não há promessa de geometria idêntica em pixels. `letterSpacing` é uma fração de em: a Web acrescenta `em`, e o NativeScript recebe o número. Não passe unidades CSS em tokens numéricos compartilhados.

SSR emite a lista configurada sem carregar ou medir a fonte. Reserve espaço adequado para o carregamento. Use o mesmo tema e aparência no servidor e cliente, conforme [Temas](./themes#renderizacao-no-servidor).

## Padrões por componente

| Grupo | Tokens |
| --- | --- |
| `components.button` | `fontFamily` opcional (senão body), `fontWeight`, `lineHeight`, `paddingY`, `radius`, `elevation` |
| `components.input` | `fontFamily`/`fontSize` opcionais (senão body), `fontWeight`, `lineHeight`, `paddingX`, `paddingY`, `radius` |
| `components.card` | `padding`, `radius`, `elevation` |

O tamanho do Button continua usando `control.sm/md/lg` para altura mínima, tamanho de fonte e padding horizontal. Os tokens do Input atingem o editor; rótulo e mensagem continuam separados. Ícones e ações reservam seu espaço além do padding configurado. Um [MThemeProvider](./themes#tema-em-uma-regiao) aplica esses padrões localmente.

Os níveis `none`, `sm`, `md` e `lg` de elevação contêm `x`, `y`, `blur`, `spread` e `color`. A Web renderiza uma sombra CSS; o Core nativo renderiza a sombra em unidades independentes de densidade. Elevação é decorativa, não altera empilhamento nem reserva espaço no layout. Deixe espaço ao redor e evite ancestrais que recortam conteúdo. A prop `elevation` do Card escolhe o nível; o padrão vem de `components.card.elevation` (`none` em Mavis/Midnight).

## Ajustes na Web

Variáveis públicas permitem CSS local sem `!important`:

| Componente | Variáveis |
| --- | --- |
| Text | `--m-text-font-family`, `--m-text-font-size`, `--m-text-font-weight`, `--m-text-line-height`, `--m-text-letter-spacing` |
| Button | `--m-button-font-family`, `--m-button-font-size`, `--m-button-font-weight`, `--m-button-line-height`, `--m-button-padding-x`, `--m-button-padding-y`, `--m-button-radius`, `--m-button-shadow` |
| Editor do Input | `--m-input-font-family`, `--m-input-font-size`, `--m-input-font-weight`, `--m-input-line-height`, `--m-input-padding-x`, `--m-input-padding-y`, `--m-input-radius` |
| Card | `--m-card-padding`, `--m-card-radius`, `--m-card-shadow` |

O tema fornece os valores de fallback. As variáveis substituem esse fallback; props explícitas como `weight` do Text e `padding`/`paddingX`/`paddingY`/`radius` do Card prevalecem nas propriedades correspondentes. `:style` explícito da raiz é aplicado por último. No Input, o estilo da raiz pertence ao contêiner; personalize o editor pelos tokens ou variáveis próprios. Cores de estado, foco, disabled e loading continuam sob responsabilidade do componente, exceto quando a aplicação sobrescreve seus estilos deliberadamente. Propriedades CSS comuns não vencem os fallbacks inline; use as variáveis documentadas.

As variáveis são exclusivas da Web e usam unidades CSS (`18px`, `0.02em`) quando necessário. Temas compartilhados seguem o contrato numérico/nativo. Isso não cria um sistema de classes utilitárias.
