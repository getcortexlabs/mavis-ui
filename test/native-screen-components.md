# Screen components on native

Build the catalog with `--env.screenComponentsCheck`, then run:

```sh
node scripts/check-native-screen-components.mjs ios SIMULATOR_UDID
node scripts/check-native-screen-components.mjs android EMULATOR_SERIAL
```

The probe invokes native control handlers and edits actual TextField/TextView values.
It checks header retention, guarded refresh/cancellation, composer draft preservation,
action selection, PIN normalization, text replay and finite geometry. Reports are saved
in `artifacts/screen-components/{ios,android}/report.json`.

These probes do not establish OS gesture recognition, SMS autofill or VoiceOver/TalkBack
navigation. Manual references must separately cover pull at the top, keyboard following
in an overlay composer, hardware keyboards and code suggestions on a configured device.
