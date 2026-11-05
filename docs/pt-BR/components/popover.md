---
title: Popover
---

# Popover

::: info Alpha.10
Disponível no Mavis alpha.11 para Vue Web e NativeScript. Mantenha core e renderizadores na mesma versão.
:::

<ComponentPreview component="popover" :height="800" />

```vue
<MPopover v-model:open="open" label="Filters" triggerLabel="Filters">…</MPopover>
```

| Propriedade            | Tipo                                              | Padrão         | Descrição                                               |
| ---------------------- | ------------------------------------------------- | -------------- | ------------------------------------------------------- |
| `open / v-model:open`  | `boolean`                                         | `false`        | Visibilidade controlada pelo app.                       |
| `label / triggerLabel` | `string`                                          | `required`     | Nome do painel e texto do acionador.                    |
| `placement`            | `bottom-start / bottom-end / top-start / top-end` | `bottom-start` | Alinhamento preferido; inverte e limita à área visível. |
| `width`                | `number`                                          | `280`          | Largura preferida em px/DIP.                            |
| `padding`              | `token / number`                                  | `md`           | Espaçamento interno.                                    |
| `disabled`             | `boolean`                                         | `false`        | Bloqueia abertura e solicita fechamento.                |

Superfície ancorada para filtros e formulários pequenos. O componente cuida do acionador, posicionamento e retorno de foco. O slot padrão recebe `close()`. `update:open` solicita a mudança de visibilidade; `close(reason)` informa acionador, toque externo, Escape, voltar do Android, seleção ou programa. `opened` ocorre depois da apresentação. Na Web acompanha tamanho, rolagem, viewport e RTL; no nativo fecha ao rolar um ancestral. Escape/toque externo fecham; voltar do Android participa do adaptador de navegação instalado. No nativo exige um ancestral `MScreen`. O painel respeita a área segura; para fluxos longos use Sheet. Na Web é não modal, e Tab pode sair do painel; no nativo a camada delimita a navegação de acessibilidade. No SSR a apresentação aguarda montagem no cliente. Tema e injeções continuam sendo os da declaração.

<<< @/../examples/catalog/shared/demos/PopoverDemo.vue
