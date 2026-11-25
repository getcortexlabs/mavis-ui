---
title: Push notifications
description: 'Use Notti by Zeep Labs, Mavis UI’s official push notification partner, in a NativeScript app on iOS and Android.'
---

# Push notifications

**Zeep Labs is Mavis UI’s official partner for push notifications on iOS and Android.** Its `nativescript-notti` plugin connects a NativeScript 9 app to the native Notti SDKs.

## Try Notti in the mobile app

The plugin is in development and its first npm release is pending. To try it now, use the demo in the partner repository. Copy `demo/app/config.example.ts` to `demo/app/config.local.ts` and fill in your Notti app ID and client key. Follow the partner’s instructions for building the plugin and running the demo. [Notti repository](https://github.com/zeeplabs/zeep-notti-nativescript#readme) · [NativeScript demo](https://github.com/zeeplabs/zeep-notti-nativescript/tree/main/demo)

Initialize Notti once in the mobile entry point, before starting the NativeScript app. Call `enablePush` when someone chooses to enable notifications in your UI.

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

System delivery also requires push capabilities for the iOS app and Firebase configuration for the Android app. Zeep Labs tracks those platform setup instructions in the [plugin README](https://github.com/zeeplabs/zeep-notti-nativescript#readme).

## Connect push to the Mavis inbox

Use `notificationReceived` to refresh your app’s inbox while it is running. To open the right screen after a tap, listen for `notificationClicked` while the app is open and check `getInitialNotificationClick()` once at startup for the tap that launched it.

Your app decides which messages to keep and when to mark them as read. Pass those records to `MNotificationCenter` through `v-model`. [NotificationCenter component](../components/notification-center)
