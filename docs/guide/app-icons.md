---
title: App icons
description: "App icons: NativeScript, iOS, Android."
---

# App icons

The optional `@getcortexlabs/mavis/app-icons` integration switches the launcher icon among alternatives **bundled in the binary**. Selecting one needs no new build; adding a new icon asset requires an application update.

```ts
import { createAppIcons } from '@getcortexlabs/mavis/app-icons'
const icons = createAppIcons({
  primary: 'mavis',
  icons: [
    { id: 'mavis', label: 'Mavis', iosName: null, androidAlias: 'com.example.app.MavisPrimary' },
    { id: 'midnight', label: 'Midnight', iosName: 'Midnight', androidAlias: 'com.example.app.MavisMidnight' },
  ],
})
if (icons.supported()) await icons.select('midnight')
const current = icons.current()
await icons.reset()
```

`choices` is immutable. `select()` serializes requests and permits retry after failure. `current()` reads system state, including after relaunch; no local preference competes with it. `AppIconError.code` distinguishes unsupported, configuration, unknown-icon and platform. Use an explicit user action and handle rejection in your UI.

On iOS, configure primary and alternate asset catalogs in the build. `iosName` must match `CFBundleAlternateIcons`; the primary uses null. The Mavis catalog demonstrates `ASSETCATALOG_COMPILER_ALTERNATE_APPICON_NAMES` and iPhone/iPad assets. It calls the public UIApplication API; system confirmation presentation belongs to iOS. [Apple reference](https://developer.apple.com/documentation/uikit/uiapplication/setalternateiconname(_:completionhandler:)).

On Android, declare an `activity-alias` per alternative, targeting the same Activity, with its own icon and MAIN/LAUNCHER filter. Only the primary alias starts enabled. Remove the original Activity's launcher filter to avoid a duplicate entry. Pass fully qualified alias names. Android 13+ updates aliases together; earlier versions enable the new alias before disabling others and attempt rollback on failure. [PackageManager](https://developer.android.com/reference/android/content/pm/PackageManager#setComponentEnabledSettings(java.util.List)).

Launchers may cache icons or reposition shortcuts. Neither platform promises an immediate visual update. Do not rename/remove existing aliases or alternatives without planning upgrades from installed versions. Physical-device and launcher coverage remains tracked in #23.

Web shows Identity as unavailable. Favicon/PWA behavior is a different contract; this API does not simulate a native launcher. Importing Mavis components never changes the application's manifest or icons.

## Upgrades and launchers

Keep alias class names stable across upgrades. Keep VIEW/deep-link filters on the actual Activity; only the MAIN/LAUNCHER entry belongs to each icon alias. An icon choice changes bundled launcher artwork, not application identity or runtime branding assets. Validate reboot, upgrade, shortcuts and each supported launcher on physical devices before relying on the feature in production. Issue #55 remains open for that device matrix.
