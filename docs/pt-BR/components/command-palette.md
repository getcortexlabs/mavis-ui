---
title: CommandPalette
---

# CommandPalette

::: info Ainda não publicado
Disponível no código de desenvolvimento para Vue + Vite, Nuxt e NativeScript iOS/Android. Ainda não publicado no npm.
:::

<ComponentPreview component="command-palette" :height="1000" />

```vue
<MCommandPalette v-model:open="open" :items="commands" label="Commands" @select="run" />
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `readonly CommandItem[]` | required | Comandos com value, label, description, group, keywords, icon, disabled e atalho apenas visual. |
| `open / query` | `boolean / string` | false / local | Apresentação controlada e busca opcionalmente controlada. Busca local é limpa ao fechar. |
| `shortcut / loading / disabled` | `boolean` | false | Cmd/Ctrl+K opcional na Web; loading bloqueia seleção enquanto o app busca. |
| `label / searchLabel / placeholder / emptyLabel / loadingLabel / closeLabel` | `string` | see source | Título, busca e mensagens localizáveis. |
| `returnFocus` | `SheetReturnFocus` | captured opener | Destino de foco Web ao fechar: ID do elemento (sem `#`), callback ou `false`, herdado de MSheet. |

A busca ignora acentos e combina todos os termos com rótulos, descrições, grupos e palavras-chave. Setas percorrem ações disponíveis; Home/End funcionam nos resultados, Enter seleciona e Escape fecha. O atalho Web é opcional, ignora editores, composição e outros diálogos, e é removido ao desmontar. No nativo, uma Sheet apresenta busca e ações explícitas. O aplicativo executa comandos e controla requisições; selecionar fecha a paleta. Atalhos dos itens são dicas visuais.

Eventos: `update:open(boolean)`, `update:query(string)`, `select(ChoiceValue, CommandItem)`.

<<< @/../examples/catalog/shared/demos/CommandPaletteDemo.vue
