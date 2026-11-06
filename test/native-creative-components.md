# Creative components on native

Build the catalog with `--env.creativeCheck`, then run:

```sh
node scripts/check-native-creative.mjs ios SIMULATOR_UDID
node scripts/check-native-creative.mjs android EMULATOR_SERIAL
```

The probe edits actual native text fields, invokes native control handlers and reads
native presentation values. It checks valid/invalid color drafts, deck decision/undo,
gauge semantics, Tour target navigation and retained content, transfer selection and
disabled items, intermediate Marquee translation and static content, and finite geometry.
Reports are saved in `artifacts/creative/{ios,android}/report.json`.

These probes do not establish real OS swipe recognition, screen-reader navigation,
physical-device performance or all keyboard/KeepAlive combinations. Browser tests
separately exercise drag, focus restoration, hover pause, responsive geometry,
reduced motion, accessibility and Nuxt SSR/SSG hydration.
