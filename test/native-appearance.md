# System appearance checks

The catalog apps register `createMavis({ theme: mavis, darkTheme: midnight })`, so they follow the device appearance until the theme switch pins one. The switch shows the next action: `◐ Escuro` or `◐ Claro` while following the system, `◐ Sistema` while pinned. Build the normal apps (`ns build ios --emulator --no-hmr`, `ns build android --no-hmr`), install them and drive the device appearance from the host.

## iOS simulator

```sh
xcrun simctl ui UDID appearance dark   # catalog turns Midnight; switch reads ◐ Claro
# tap the switch: catalog turns Mavis and stays Mavis after the next line
xcrun simctl ui UDID appearance light
# tap the switch again: ◐ Sistema follows the simulator from now on
xcrun simctl ui UDID appearance dark
xcrun simctl ui UDID appearance light  # restore
```

`idb ui describe-all --udid UDID` lists the switch with `AXLabel` `Trocar tema`; `idb ui tap --udid UDID X Y` taps its frame center with integer coordinates. Capture each step with `xcrun simctl io UDID screenshot`.

## Android

```sh
adb -s SERIAL shell cmd uimode night yes   # catalog turns Midnight
# tap the switch, then
adb -s SERIAL shell cmd uimode night no    # catalog stays Mavis while pinned
# tap the switch again, then toggle night mode and watch the catalog follow
adb -s SERIAL shell cmd uimode night no    # restore the original value
```

`uiautomator dump` exposes the switch through `content-desc="Trocar tema"`; tap the center of its bounds with `adb shell input tap`. The manifest keeps `uiMode` in `configChanges`, so the activity is not recreated; the Android adapter registers its own component callbacks and reads `uiMode` from the configuration, because on an Android 8 phone Core's window cache lagged one change behind. On that phone (ASUS Z017DC, Android 8.0) the system itself skipped one of four configuration deliveries while `dumpsys uimode` flipped within a second, so the adapter also re-reads the configuration on `resume`; give each toggle about ten seconds there and compare with `adb shell dumpsys uimode` before blaming the adapter. Timing evidence from an instrumented build is in `artifacts/appearance/phone-callback-timing.log` (local). Record the initial night mode before changing it and restore it afterwards; a shared emulator may be running other work, so prefer a device dedicated to the check.

## Browser

`test/browser/catalog.browser.ts` emulates `prefers-color-scheme` for both engines and covers the same sequence. The Web adapter reads `matchMedia` only when the plugin installs, so SSR tests keep rendering `theme`.

## Limits

Native launch screens keep the light base. The checks cover the catalog switch, not every consumer composition; physical iOS devices and multi-window scenes were not exercised.
