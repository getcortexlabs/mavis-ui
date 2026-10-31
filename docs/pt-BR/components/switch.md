---
title: Switch
description: Uma preferência de ligar e desligar com rótulo visível, texto de apoio e valor booleano controlado no NativeScript-Vue e na Web.
---

# Switch

`MSwitch` · Uma preferência que muda ao ligar ou desligar.

::: info Próxima alpha
Switch está disponível no repositório. Ainda não faz parte da `0.1.0-alpha.3`.
:::

<ComponentPreview component="switch" :height="650" />

## Uso

```vue
<script setup lang="ts">
import { ref } from 'vue'
const notifications = ref(true)
</script>

<template>
  <MSwitch
    v-model="notifications"
    label="Notificações"
    helperText="Novidades das pessoas que você acompanha."
  />
</template>
```

## API

| Prop | Tipo | Padrão | Finalidade |
| --- | --- | --- | --- |
| `modelValue / v-model` | boolean | `false` | Valor controlado de ligado ou desligado. |
| `label` | string | obrigatório | Rótulo visível e nome acessível. |
| `helperText` | string | `''` | Explicação opcional abaixo do rótulo. |
| `disabled` | boolean | `false` | Impede ativação pelo rótulo e pelo controle. |
| `width` | número, percentual ou `auto` | `auto` | Largura da linha completa. |
| `grow / shrink` | number | `0` / contexto do layout | Distribuição de espaço no layout pai. |

`id` identifica o controle. `accessibilityHidden` segue o [contrato compartilhado](../guide/component-contract).

`update:modelValue` emite um booleano por ativação do usuário. Mudanças externas não emitem. Aceite o valor no handler ou use `v-model`; se o pai mantiver o valor anterior, o controle volta a ele. Não há evento `change` adicional, persistência interna ou atualização otimista de rede.

## Interação e aparência

Ative pelo rótulo visível ou pelo controle. Rótulo e ajuda quebram linha conforme a largura e o tamanho do texto. Use texto simples; links e outros controles ficam fora do Switch. Na Web, Tab foca a linha e Espaço ou Enter alternam o valor. Switches desabilitados não podem ser ativados nem recebem foco por Tab.

No NativeScript, o switch da plataforma fornece estado, teclado, gestos do indicador e animação do sistema, com as cores do tema Mavis. O rótulo recebe feedback de pressão do Jolt, liberado ao desabilitar, descarregar ou desmontar. A Web usa trilho e indicador com transição CSS e foco de teclado visível. As preferências de movimento reduzido se aplicam ao feedback Mavis; a transição do switch nativo segue o sistema operacional. Os controles compartilham comportamento e tokens, com geometria própria em cada plataforma. Arrastos verticais não alternam a preferência. O indicador nativo mantém o arrasto horizontal do sistema; no iOS, inicie a rolagem pelo rótulo ou pelo espaço ao redor, pois o indicador pode reter o gesto.

Use Switch para uma preferência booleana. Checkbox atenderá seleções independentes e estados indeterminados no [próximo lote](../guide/roadmap).

## Exemplo completo

O mesmo arquivo roda no catálogo NativeScript e na prévia Web.

<details>
<summary>Ver código</summary>

<<< @/../examples/catalog/shared/demos/SwitchDemo.vue

</details>

## Em contexto

[Perfil](../showcase/profile) combina campos de texto e preferências de notificação. Salvar e Descartar pertencem à tela; sair dela reinicia a demonstração local.
