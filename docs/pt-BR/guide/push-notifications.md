---
title: Notificações push
description: 'Use o Notti da Zeep Labs, parceira oficial do Mavis UI para notificações push, em apps NativeScript no iOS e no Android.'
---

# Notificações push

**A Zeep Labs é a parceira oficial do Mavis UI para notificações push no iOS e no Android.** O plugin `nativescript-notti` conecta um app NativeScript 9 aos SDKs nativos do Notti.

## Experimente o Notti no app mobile

O plugin está em desenvolvimento e aguarda a primeira publicação no npm. Para experimentar agora, use o app de exemplo da Zeep Labs. Copie `demo/app/config.example.ts` para `demo/app/config.local.ts` e preencha o ID do app e a chave de cliente do Notti. O repositório indica como compilar o plugin e executar o exemplo. [Repositório do Notti](https://github.com/zeeplabs/zeep-notti-nativescript#readme) · [Exemplo em NativeScript](https://github.com/zeeplabs/zeep-notti-nativescript/tree/main/demo)

Inicialize o Notti uma vez no ponto de entrada mobile, antes de iniciar o app NativeScript. Chame `enablePush` quando a pessoa escolher ativar as notificações na interface.

```ts
import { Notti } from 'nativescript-notti'
import { NOTTI_APP_ID, NOTTI_CLIENT_KEY } from './config.local'

Notti.initialize(NOTTI_APP_ID, NOTTI_CLIENT_KEY)

export async function enablePush() {
  const granted = await Notti.requestPermission()
  if (granted) Notti.setSubscription(true)
  return granted
}
```

A entrega pelo sistema também depende da configuração de push no app iOS e do Firebase no app Android. A Zeep Labs mantém as orientações de cada plataforma no [README do plugin](https://github.com/zeeplabs/zeep-notti-nativescript#readme).

## Conecte o push à caixa de entrada do Mavis

Use `notificationReceived` para atualizar a caixa de entrada enquanto o app estiver em execução. Para abrir a tela certa após um toque, escute `notificationClicked` enquanto o app estiver aberto e consulte `getInitialNotificationClick()` uma vez na inicialização para recuperar o toque que abriu o app.

Seu app decide quais mensagens guardar e quando marcá-las como lidas. Passe esses registros ao `MNotificationCenter` por meio de `v-model`. [Componente NotificationCenter](../components/notification-center)
