---
title: SegmentedControl
description: Opções de largura igual, seleção controlada e marcador animado no NativeScript e na Web.
---

# Segmented Control

`MSegmentedControl` escolhe um valor em um conjunto compacto, como período, categoria ou modo de visualização. O app decide o que muda com a seleção.

::: info Próxima alpha
Disponível no repositório para a próxima alpha; não está em `0.1.0-alpha.3`.
:::

<ComponentPreview component="segmented-control" :height="1000" />

## Uso

```vue
<m-segmented-control v-model="period" label="Período de foco" :options="[
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' }
]" />
```

Declare `period` como `ref<ChoiceValue | null>('week')` no componente. Importe o tipo de `@getcortexlabs/mavis-core`.

## Propriedades

| Propriedade | Tipo | Padrão | Comportamento |
| --- | --- | --- | --- |
| `options` | `readonly SegmentedOption[]` | obrigatório | `value` único, `label` não vazio e `disabled` opcional. |
| `modelValue` | `ChoiceValue \| null` | `null` | String ou número finito selecionado. |
| `label` | `string` | obrigatório | Nome acessível não vazio do grupo, sem rótulo visual automático. |
| `disabled` | `boolean` | `false` | Bloqueia o grupo. |
| `width / grow / shrink` | dimensão / number / number | `auto / 0 / contexto` | Participação no layout. |
| `id / accessibilityHidden` | string / boolean | — / false | Identificação e exclusão da acessibilidade. |

`update:modelValue` pede um valor habilitado diferente do atual. A seleção continua controlada mesmo se o app rejeitar o pedido. `null`, opções vazias ou valor ausente deixam o grupo sem seleção; o componente não escolhe uma alternativa nem limpa o estado sozinho. Números e strings permanecem distintos. Valores duplicados lançam `RangeError`; valores inválidos e nomes vazios lançam `TypeError`.

## Layout e movimento

Prefira duas a quatro opções com rótulos curtos. Os segmentos dividem a largura igualmente e o texto quebra sem altura fixa. Listas extensas combinam com [Select](./select) ou [Radio](./radio). O controle não possui painéis, rolagem, opções apenas com ícones, seleção múltipla ou integração com rotas. Use [Tabs](./tabs) para painéis locais.

O marcador acompanha a seleção com Jolt no nativo e CSS na Web. Mudanças de medição nativa reposicionam o marcador diretamente; a animação pendente para ao ir ao fundo ou descarregar a página. Ambos respeitam movimento reduzido. Somente o marcador privado é animado, preservando transformações do app no controle.

## Interação

Na Web, o grupo de rádios tem uma parada de Tab. Setas, Home e End focam e pedem seleção, pulando desabilitados. As setas horizontais acompanham a direção do texto. Enter/Espaço ativam o segmento focado. Desabilitar a opção selecionada mantém seu valor até o app escolher outro.

No nativo, as opções expõem semântica de rádio, o nome do grupo como dica e os estados marcado/desabilitado. Android suporta Esquerda/Direita e Home/End; os demais movimentos de teclado seguem a plataforma. A escala de fonte UIKit/Android pode aumentar a altura. Tipografia e layout podem diferir em pixels entre plataformas.

No iOS com Core 9.1.3, opções desabilitadas bloqueiam o toque, mas a árvore acessível pode omitir o estado indisponível. A seleção continua exposta; o ajuste desse estado está em [#112](https://github.com/getcortexlabs/mavis-ui/issues/112).

A [Central de ajuda](../showcase/help) usa o valor para escolher o assunto e preserva as perguntas abertas em cada categoria.

## Exemplo completo

<details>
<summary>Ver código</summary>

<<< @/../examples/catalog/shared/demos/SegmentedDemo.vue

</details>
