---
title: NumberFlow
---

# NumberFlow

::: info Em desenvolvimento
Novo componente da próxima versão. Ainda não faz parte da versão alpha.11 publicada.
:::

<ComponentPreview component="number-flow" :height="850" />

```vue
<MNumberFlow
  :value="revenue"
  label="Revenue"
  locale="en-US"
  :format="{ style: 'currency', currency: 'USD' }"
/>
```

| Prop                             | Tipo                         | Contrato                                                |
| -------------------------------- | ---------------------------- | ------------------------------------------------------- |
| `value`                          | `number`                     | Valor canônico finito, obrigatório.                     |
| `locale / format`                | `string / NumberFlowFormat`  | en-US; formatação consistente no servidor e no cliente. |
| `formatValue`                    | `(value: number) => string`  | Substitui a formatação por localidade.                  |
| `duration / animated / announce` | `number / boolean / boolean` | 650 / true / false. Anúncios educados são opcionais.    |
| `variant / tone / label`         | Text variant / tone / string | Tipografia e nome acessível. Variante padrão title.     |

O Jolt faz os dígitos rolarem enquanto o valor formatado atual continua disponível para tecnologias assistivas. Moeda, agrupamento, casas decimais e mudanças rápidas usam a mesma apresentação. O primeiro render SSR/cliente já mostra o valor final, sem contar a partir de zero. Redução de movimento assenta imediatamente. Desativar a animação interrompe o efeito. Use `formatValue` para um formatador próprio e mantenha a saída determinística no servidor e no cliente.

<<< @/../examples/catalog/shared/demos/NumberFlowDemo.vue

Na Web, usa `Intl.NumberFormat`; iOS e Android usam os formatadores do sistema. `format` aceita `style` (`decimal`, `currency`, `percent`), `currency`, `currencyDisplay` (`symbol`, `code`), `useGrouping`, `minimumIntegerDigits`, `minimumFractionDigits` e `maximumFractionDigits`. Símbolos e espaçamento seguem a localidade do sistema. Para notação compacta, unidades ou regras próprias, forneça `formatValue`.
