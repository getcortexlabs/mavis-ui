---
title: Date Picker
description: Edição de datas civis gregorianas e calendário temático em Vue Web e NativeScript.
---

# Date Picker

`MDatePicker` combina um editor de texto com rótulo visível e um calendário temático em [Sheet](./sheet). O valor é uma **data civil** gregoriana, como `2026-11-12`, independente de horário, instante ou fuso.

<ComponentPreview component="date-picker" :height="760" />

## Uso

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { CivilDate, InputHandle } from '@getcortexlabs/mavis-core'
const date = ref<CivilDate | null>(null)
const field = ref<InputHandle>()
</script>

<template>
  <MScreen scroll>
    <MDatePicker ref="field" v-model="date" label="Dia do encontro"
      locale="pt-BR" initialMonth="2026-11"
      min="2026-11-01" max="2026-12-31"
      :unavailableDates="['2026-11-15']"
      helperText="Digite AAAA-MM-DD ou escolha um dia no calendário." />
  </MScreen>
</template>
```

Importe de `@getcortexlabs/mavis-web` ou `@getcortexlabs/mavis/vue`, ou use os nomes registrados pelo plugin. O consumidor não precisa de layouts nativos crus nem de tags `DatePicker`.

## Valor e rascunho

`CivilDate` descreve `YYYY-MM-DD`; a validação em runtime aceita somente datas gregorianas reais entre os anos `0001` e `9999`. `civilDate(string)` valida e lança erro se a data for inválida; `isCivilDate(value)` é o predicado. O tipo TypeScript sozinho não garante que fevereiro tenha determinado dia.

`null` significa vazio. Limpar o editor ou usar a ação de limpeza propõe `null`. Digitar uma data válida e disponível propõe aquela string exata. `update:draft` informa cada edição como string, inclusive vazia, incompleta ou inválida. Uma proposta válida é controlada: se o pai a rejeitar, o editor volta ao valor do pai. Rascunhos incompletos, malformados ou indisponíveis continuam visíveis e não substituem o modelo. Uma mudança externa do modelo substitui o rascunho; mudanças dos limites o preservam.

A ordem padrão é ISO: ano, mês e dia. `02/03/2026`, espaços, mês/dia sem dois dígitos, data com horário e objetos `Date` são rejeitados. Mudar apenas locale não altera a gramática padrão; a opção dateFormat abaixo permite escolher outra gramática numérica. Nenhuma operação do picker constrói `Date`, consulta o dia atual ou converte por UTC. Guarde a string. Associá-la a um horário, fuso IANA ou instante é uma operação explícita e separada do app.

`validityChange` emite `{ valid, complete, reason }` quando a validade muda. Vazio é válido, mas incompleto; obrigatoriedade pertence ao app. Motivos inválidos: `incomplete`, `invalid`, `before-min`, `after-max` e `unavailable`. Uma data completa pode estar indisponível. O erro interno aparece para rascunho completo inválido/indisponível ou depois de perder foco; `error` tem precedência. Valide o rascunho antes de enviar: o último modelo aceito pode representar uma edição anterior.

## API

| Prop | Tipo | Padrão | Significado |
| --- | --- | --- | --- |
| `modelValue / v-model` | `CivilDate \| null` | `null` | Data civil controlada. |
| `label` | string | obrigatório | Rótulo visível e título do calendário; não pode ser branco. |
| `helperText / error` | string | `''` | Ajuda e mensagem de validação do app. |
| `min / max` | `CivilDate` | ausente | Limites inclusivos. Limite inválido ou `min > max` lança erro. |
| `unavailableDates` | `readonly CivilDate[]` | `[]` | Datas exatas indisponíveis; sem callback ou regra implícita de dias da semana. |
| `dateFormat` | `iso / locale / yyyy-MM-dd / dd/MM/yyyy / MM/dd/yyyy` | `iso` | Formato numérico no código em desenvolvimento; modelos continuam ISO. |
| `locale` | `'en-US' \| 'pt-BR'` | `'en-US'` | Rótulos e mensagens gregorianas incorporadas. |
| `firstDayOfWeek` | inteiro `0`–`6` | padrão do locale (`0`) | Domingo é `0`; segunda é `1`. |
| `initialMonth` | string `YYYY-MM` | `'2000-01'` | Mês inicial determinístico; nunca inferido do relógio. |
| `disabled / readonly` | boolean | `false` | Bloqueiam edição, limpeza e calendário; fecham o calendário aberto. |
| `clearable` | boolean | `true` | Exibe ação de limpeza. |
| `calendarLabel / clearLabel / closeLabel` | string | traduzido | Nomes das ações. O nome do calendário inclui o rótulo do campo. |
| `name` | string | ausente | Nome HTML do editor Web; ignorado no nativo. |
| `id / width / grow / shrink / accessibilityHidden` | props compartilhadas | padrão compartilhado | Identidade do editor, layout e visibilidade. |

Eventos: `update:modelValue(CivilDate | null)`, `update:draft(string)`, `validityChange(DateValidation)`, `focus()` e `blur()`. Abrir, cancelar e navegar no calendário não propõem modelo. Escolher uma data fecha o calendário. Os métodos `focus()` e `blur()` seguem `InputHandle` de [Input](./input), inclusive em refs inferidas.

Alterar limites ou datas indisponíveis nunca limita automaticamente o modelo nem escolhe outra data. Erro e dias disponíveis atualizam; o cursor do calendário respeita os novos limites. Eventos anteriores conferem as restrições atuais. Um modelo externo bem formado fora dos limites permanece visível com erro; uma string de modelo inválida falha imediatamente.

## Calendário e teclado

O calendário abre no rascunho válido, ou em `min`, ou em `initialMonth`, respeitando min/max. Na Web, esse dia recebe foco. Setas movem por dia ou semana; Home/End alcançam as bordas da semana; Page Up/Down movem um mês; Shift + Page Up/Down movem um ano. Mudanças de mês/ano preservam o dia quando possível e respeitam o fim do mês e os limites. Esquerda/direita acompanham RTL. Navegar não confirma. Enter/Espaço ou clique escolhem um dia disponível. Dias indisponíveis continuam navegáveis para leitura, com `aria-disabled`, mas não confirmam. O cabeçalho anuncia o mês; abreviações têm nomes completos dos dias. Tab permanece no Sheet; Escape, fundo e Fechar cancelam e devolvem o foco ao botão de abertura.

NativeScript usa teclado de texto capaz de digitar números e hífens, além de botões de calendário nativos com o tema Mavis. Abrir encerra edição; fechar devolve o foco ao botão sem reabrir deliberadamente o teclado. Navegação por teclado físico segue o foco dos botões da plataforma. O calendário nativo pode rolar horizontalmente: sete colunas mantêm alvos de toque e crescem com fonte ampliada. O Sheet rola verticalmente. A Web também permite rolagem horizontal em telas estreitas. Não usamos rodas ou calendário do sistema; isso mantém o tema, as restrições e a semântica civil nas duas plataformas. Rótulos nativos incluem data completa e valor selecionado, sem prometer leitura idêntica em todo dispositivo.

No nativo, declare dentro de `MScreen`, dono da camada do Sheet. Valem os [limites de hospedagem e ancestrais transformados do Sheet](./sheet). Unload/unmount fecha o calendário. Para intervalos, use [Date Range Picker](./date-range-picker).

## SSR, hidratação e formulários

Servidor e cliente devem receber o mesmo `locale`, `firstDayOfWeek`, modelo e mês inicial. Nomes incorporados e aritmética gregoriana pura produzem SSR/SSG estável sem locale, relógio ou fuso do host. O calendário inicial está fechado. Edições Web anteriores à hidratação são adotadas pelo contrato de Input, inclusive rascunhos incompletos; uma edição válida ainda é uma proposta controlada.

Os nomes HTML enviam o **rascunho visível**, inclusive se inválido. Não são campos ocultos de valor canônico. Valide no app antes do envio. O envio nativo pertence ao app. Reset HTML segue o contrato controlado de Input: altere modelos explicitamente no handler de reset.

<details>
<summary>Ver código</summary>

<<< @/../examples/catalog/shared/demos/DatePickerDemo.vue

</details>

## Restaurar uma edição incompleta

`draft` controla o texto visível separadamente do `modelValue` válido. Use `v-model:draft` com string no DatePicker ou `{ start: string, end: string }` no DateRangePicker. Um texto como `2026-11-` pode ser salvo e restaurado sem inventar uma data válida. Seleção no calendário e limpeza propõem atualizações do rascunho e do modelo; conecte os dois quando o app controlar ambos. Se a atualização de draft for rejeitada, o editor volta ao valor fornecido na próxima renderização. Omitir `draft` mantém a edição interna existente.

```vue
<m-date-picker v-model="date" v-model:draft="draft" label="Data" />
```

O SSR Web entrega o editor textual imediatamente e desabilita calendário/limpeza até montar. A hidratação habilita essas ações. O gatilho recebe foco no mousedown principal antes da abertura, permitindo devolver o foco ao fechar também no Safari. O consumidor não precisa de diretiva DOM nem de esconder o botão até montar.

## Edição localizada e formatação de instantes

**Em desenvolvimento; não incluído na alpha.8.** A ação do calendário fica dentro do campo, centralizada no editor independentemente de rótulo, ajuda e erro. Os dois pickers aceitam `dateFormat`: `iso` (padrão), `locale` (DD/MM/AAAA em pt-BR e MM/DD/AAAA em en-US), `yyyy-MM-dd`, `dd/MM/yyyy` ou `MM/dd/yyyy`. São padrões numéricos exatos e limitados; não são tokens arbitrários de formatação. Exigem zeros à esquerda e ano com quatro dígitos. O comportamento ISO existente é preservado.

```vue
<MDatePicker v-model="date" v-model:draft="draft" label="Data"
  locale="pt-BR" dateFormat="locale" />
```

O campo mostra `03/11/2026`; o modelo continua `2026-11-03`. Rascunhos e campos nomeados de formulários HTML contêm o texto exibido. Validação, limites e seleção no calendário usam datas civis canônicas. Trocar formato/locale reformata rascunhos completos não controlados e preserva os incompletos. Rascunhos controlados continuam pertencendo ao aplicativo; atualize-os explicitamente ao mudar o formato. Servidor e cliente precisam do mesmo formato e locale.

Para instantes, use o helper separado:

```ts
import { formatDateTime, dateTimeToCivilDate } from '@getcortexlabs/mavis-web/date-format'
// NativeScript: '@getcortexlabs/mavis/date-format'

const instant = new Date('2026-11-03T01:30:00Z')
formatDateTime(instant, {
  locale: 'pt-BR', timeZone: 'America/Sao_Paulo', dateStyle: 'short',
}) // em São Paulo: 02/11/2026 (pontuação e largura do ano podem variar no nativo)
dateTimeToCivilDate(instant, { timeZone: 'America/Sao_Paulo' }) // '2026-11-02'
```

O helper aceita Date válido ou milissegundos desde a época Unix e exige `timeZone` IANA explícito ou `UTC`. Strings ambíguas e fusos desconhecidos são rejeitados. O locale padrão é en-US. `dateStyle` e `timeStyle` aceitam short, medium, long e full; sem ambos, usa data medium e hora short. Informar apenas um mostra somente essa parte. Web/SSR usa Intl.DateTimeFormat, iOS NSDateFormatter e Android DateFormat com calendário gregoriano. Os dados do sistema determinam pontuação e horário de verão; o texto exibido não é formato de armazenamento e não precisa ser idêntico entre plataformas. Nenhuma dependência ou base de fusos é empacotada.

`dateTimeToCivilDate` converte explicitamente um instante para o dia naquele fuso. O valor do picker já é um dia: não recebe timeZone nem muda por conversão UTC. Não há conversão implícita de data/hora local para um instante.
