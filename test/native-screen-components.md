# Screen components on native

Build the catalog with `--env.screenComponentsCheck`, then run:

```sh
node scripts/check-native-screen-components.mjs ios SIMULATOR_UDID
node scripts/check-native-screen-components.mjs android EMULATOR_SERIAL
```

The probe invokes native control handlers and edits actual TextField/TextView values.
It first renders a 200/56/40 header at parallax 0.5 and 0, reads native pixels at y=80/112/150, and records the header/artwork/section rectangles after scrolling. Expanded artwork must be red, the collapsed section green and the content below it blue. PNG captures are collected beside the report.

It also checks header retention, guarded refresh/cancellation, composer draft preservation,
action selection, PIN normalization, text replay and finite geometry. Reports are saved
in `artifacts/screen-components/{ios,android}/report.json`.

These probes do not establish OS gesture recognition, SMS autofill or VoiceOver/TalkBack
navigation. Manual references must separately cover pull at the top, keyboard following
in an overlay composer, hardware keyboards and code suggestions on a configured device.
