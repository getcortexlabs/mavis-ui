---
title: NotificationCenter
---

# NotificationCenter

::: info RC.12.1
Incluído na RC.12.1 para Vue + Vite, Nuxt e NativeScript.
:::

<ComponentPreview component="notification-center" :height="1100" />

```vue
<MNotificationCenter
  v-model="notifications"
  v-model:filter="filter"
  label="Inbox"
  @action="openNotification"
/>
```

| Prop                  | Type                         | Default             | Contract                                                                                           |
| --------------------- | ---------------------------- | ------------------- | -------------------------------------------------------------------------------------------------- |
| `modelValue`          | readonly MavisNotification[] | required            | ID/title únicos, description/group/time/read/disabled/dismissible/actionLabel opcionais. Até 1000. |
| `filter`              | all \| unread                | all                 | Filtro controlado; notificações ocultas permanecem no modelo.                                      |
| `animated / disabled` | boolean                      | true / false        | Layout Jolt da coleção e bloqueio de edição.                                                       |
| `label / id`          | string                       | required / optional | Nome acessível do componente e ID estável opcional.                                                |

Mensagens agrupadas, contagem de não lidas, leitura, marcar todas como lidas, dispensa e ação da aplicação compartilham um modelo controlado. Metadados desconhecidos são preservados. Entradas desabilitadas ficam intactas; dismissible=false impede remoção. Quando uma ação remove a mensagem em foco, o foco volta ao filtro. Títulos, descrições e horários opcionais são texto, nunca HTML. Rótulos da barra e ações são traduzíveis. A aplicação cuida do transporte, autorização, persistência e ações; o componente não solicita permissões de push do sistema, não assina serviços nem busca notificações.

`update:modelValue` → `MavisNotification[]`; `update:filter` → `all | unread`; `action` → notification ID.

O movimento usa Jolt e respeita movimento reduzido. Use `:animated="false"` para apresentação estática.

<<< @/../examples/catalog/shared/demos/NotificationCenterDemo.vue
