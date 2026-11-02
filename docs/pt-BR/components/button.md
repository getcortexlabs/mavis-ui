---
title: Button
description: "Button no Mavis UI. Ações com variantes, tamanhos e estados de interação."
---

# Button

`m-button` · Ações com variantes, tamanhos e estados de interação.

<ComponentPreview component="button" :height="420" />

## Uso

```vue
<m-button variant="primary" @click="salvar">Salvar</m-button>
```

Os valores e as funções do trecho pertencem ao seu componente. O exemplo completo abaixo mostra sua inicialização.

## API

| Propriedade | Tipo | Padrão | Uso |
| --- | --- | --- | --- |
| `variant` | primary / secondary / ghost | `primary` | Aparência do botão. |
| `size` | sm / md / lg | `md` | Altura mínima, fonte e espaçamento. |
| `disabled` | boolean | `false` | Bloqueia a ação. |
| `loading` | boolean | `false` | Bloqueia a ação e mostra loadingText. |
| `loadingText` | string | `Loading…` | Texto durante o carregamento. |
| `icon / trailingIcon` | `IconName` | `—` | Ícone Lucide antes ou depois do texto, no tamanho do botão. Um botão só com ícone exige `accessibilityLabel`; sem ele a renderização lança `RangeError`. |
| `text` | string | `—` | Alternativa ao texto no slot. |
| `type` | button / submit / reset | `button` | Somente Web: ação HTML do botão. |
| `name / value / form` | string | não definido | Somente Web: nome/valor do botão de envio e ID do formulário associado. |
| `grow / shrink` | number | `0 / contexto` | Distribuição de espaço na linha ou coluna. |

Ícones usam a fonte Lucide embutida em 16, 20 ou 24 pontos para `sm`, `md` e `lg`, herdam a cor do texto e nunca entram no nome acessível. O evento `click` não tem payload e não é emitido enquanto `disabled` ou `loading` estiver ativo. O slot aceita texto simples ou interpolado. Para um nome acessível diferente do texto visível, passe `accessibilityLabel`. No NativeScript, o Jolt cuida do feedback de toque; na Web, o controle é um `button` com suporte a teclado e foco visível.

## Formulários HTML (Web)

Use `type="submit"` e trate `@submit.prevent` no formulário para receber envios por clique e Enter após a validação do navegador. `name` e `value` identificam o botão de envio; `form` pode apontar para um formulário em outra parte do documento. Concentre o salvamento no formulário, sem repetir a mesma ação no `@click` do botão.

Botões disabled não ativam. Botões em loading preservam o foco, anunciam o estado ocupado e cancelam o envio e o reset. O padrão `type="button"` nunca envia um formulário. Com `type="reset"`, trate `@reset.prevent` no formulário para restaurar os modelos controlados; veja o [exemplo de Input](./input#formularios-html-web). NativeScript mantém a ação comum e ignora as props exclusivas de HTML.

## Exemplo completo

Este arquivo também é executado no catálogo NativeScript e na prévia Web.

<details>
<summary>Ver o código</summary>

<<< @/../examples/catalog/shared/demos/ButtonDemo.vue

</details>

## Em contexto

[Veja os componentes em uma tela completa de controles de veículo](../showcase/vehicle).

Veja [Layout e texto](../guide/layout) para dimensões flexíveis, fontes ampliadas e direção RTL.

[Nomes acessíveis, foco e verificações com leitores de tela](../guide/accessibility).

## Personalização

O tema oferece padrões por componente e variáveis CSS para a Web. Veja [Tipografia e personalização](../guide/typography) para os tokens, pontos de ajuste e precedência.

A próxima alpha adiciona `motionSurface` experimental ao Button. [Veja a animação compartilhada e seu ciclo de vida](../guide/motion).

## Conteúdo nas laterais

Os slots `leading` e `trailing` aceitam conteúdo decorativo, como uma marca, ícone ou badge. Cada slot prevalece sobre a prop de ícone do mesmo lado. O slot padrão continua sendo o texto do botão; `text` tem precedência sobre ele. Durante `loading`, apenas o rótulo é substituído por `loadingText`; os adornos permanecem para evitar mudanças inesperadas de largura.

```vue
<m-button @click="continueWithStudio">
  Continuar com Studio
  <template #leading><m-icon name="sparkles" /></template>
  <template #trailing><m-badge text="Novo" tone="accent" /></template>
</m-button>
```

Os adornos não entram no nome acessível e não recebem interação. Se um badge acrescentar informação necessária, inclua-a no texto ou em `accessibilityLabel`. Não coloque controles, links, campos ou handlers de interação nos slots; os controles reconhecidos são rejeitados. Componentes personalizados também devem renderizar somente conteúdo decorativo. Use primitivas Mavis ou imagens compatíveis com cada plataforma; SVG/HTML do navegador não vira conteúdo nativo automaticamente.

No NativeScript, botões com esses slots usam uma superfície de layout com uma única ação acessível e feedback Jolt. O rótulo quebra linhas e acompanha a fonte do sistema; adornos reservam sua largura. Na Web, permanece um `button` HTML com submit/reset e Enter/Espaço. [Morrow](../showcase/morrow) demonstra uma marca composta pelas mesmas primitivas nos dois ambientes.
