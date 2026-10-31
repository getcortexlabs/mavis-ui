---
title: Icon
description: Ícones Mavis com a fonte Lucide embutida. Um conjunto consistente no NativeScript e no Vue Web, com tamanhos, tons do tema e rótulos acessíveis.
---

# Icon

`m-icon` · Um símbolo do conjunto Lucide que segue o tema. Renderiza a fonte de ícones embutida no iOS, no Android e na Web.

<ComponentPreview component="icon" :height="460" />

## Uso

```vue
<m-row gap="sm" align="center">
  <m-icon name="search" tone="muted" />
  <m-text>Buscar</m-text>
</m-row>
<m-icon name="circle-check" tone="success" label="Concluído" />
```

Registre os componentes seguindo o [guia de instalação da alpha](../guide/foundation). A API continua experimental.

## Instale a fonte

O NativeScript carrega fontes personalizadas da pasta `fonts` do app. Copie o arquivo embutido uma vez (use `src/fonts/` quando `appPath` for `src`):

```sh
cp node_modules/@getcortexlabs/mavis/fonts/lucide.ttf app/fonts/
```

Apps com webpack podem copiar na build, como o catálogo faz:

```js
webpack.Utils.addCopyRule({
  from: 'lucide.ttf',
  to: 'fonts',
  context: 'node_modules/@getcortexlabs/mavis/fonts',
})
```

A folha de estilos Web declara o `@font-face` e carrega `lucide.woff2` do pacote; importar `@getcortexlabs/mavis-web/style.css` basta.

## API

| Propriedade | Tipo | Padrão | Uso |
| --- | --- | --- | --- |
| `name` | `IconName` | obrigatório | Nome do ícone Lucide, como `search` ou `circle-check`. Nomes desconhecidos lançam `RangeError`. |
| `size` | sm \| md \| lg \| number | `md` | 16, 20 ou 24 pontos, ou qualquer número positivo. |
| `tone` | cor da paleta | `text` | Cor do tema, como `primary`, `muted` ou `danger`. |
| `label` | string | nenhum | Nome acessível. Sem ele o ícone é decorativo e fica oculto para tecnologias assistivas. |
| `id` | string | nenhum | Identifica o ícone renderizado. |

`class`, `style` e atributos não declarados aplicam-se ao glifo renderizado. Nenhum slot padrão é consumido. O tipo `IconName` de `@getcortexlabs/mavis-core` lista os 1998 nomes canônicos do Lucide 1.65.0; apelidos não estão incluídos. Explore o conjunto em [lucide.dev/icons](https://lucide.dev/icons/).

## Acessibilidade e alinhamento

Ícones são decorativos por padrão: leitores de tela os pulam, então combine-os com um texto que carregue o significado. Dê `label` apenas a ícones que ficam sozinhos, como uma marca de estado; ele vira o nome da imagem nas duas plataformas. Ícones mantêm o tamanho dentro de Rows (`shrink` é 0) e centralizam verticalmente ao lado do texto. Button e Input ainda não aceitam ícones; componha uma Row com ícone e Text, ou um Card `interactive`, para ações com ícone.

## Pacote e licença

O pacote nativo inclui `fonts/lucide.ttf` (0,97 MB) e o pacote Web `src/fonts/lucide.woff2` (309 KB), ambos com o conjunto completo e a licença ISC ao lado. Reduzir a fonte aos ícones usados por um app é trabalho futuro.

## Exemplo completo

Este arquivo também é executado no catálogo NativeScript e na prévia Web.

<details>
<summary>Ver código</summary>

<<< @/../examples/catalog/shared/demos/IconDemo.vue

</details>

## Em contexto

[Veja os componentes em uma tela completa de controles de veículo](../showcase/vehicle).
