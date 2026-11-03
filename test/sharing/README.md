# Shared application checks

`node scripts/check-project-creator.mjs both-vite --local-packages --example directory --package-manager npm --keep`
and the corresponding `both-nuxt` command generate the same directory screens from the packed CLI, install packed Mavis, audit the shared imports, typecheck both hosts, and build Web plus Android/iOS JS bundles. Nuxt additionally preserves an SSR output and generates real static routes. CI crosses five host presets, both examples (`welcome` and `directory`), and three managers (`npm`, `pnpm`, `yarn`): 30 packed-consumer jobs. Directory Web jobs also run the browser flow. Reports are isolated under `artifacts/creator/<preset>-<example>-<manager>/result.json`.

Run `npx playwright test --config playwright.sharing.config.ts` for the Vite reference and
`npx playwright test --config playwright.sharing-nuxt.config.ts` for Nuxt SSR + SSG.
`MAVIS_CREATOR_CASE` selects another retained creator result, and `MAVIS_CREATOR_PACKAGE_MANAGER` selects its manager (default `npm`). Each browser starts with isolated storage. Tests cover search/empty state, real link navigation, an injected host storage failure, retained drafts, retry, reload persistence, direct links, responsive layout and keyboard/history navigation. The wide/narrow geometry assertions wait for the documented asynchronous ResizeObserver/frame update.

For native runtime checks, prepare the generated directory mobile host:

```sh
node scripts/prepare-sharing-native.mjs /path/to/generated/apps/mobile
# In that mobile host, with the NativeScript SDK/toolchain installed:
ns build android --env.sharingCheck
ns build ios --emulator --env.sharingCheck
```

Install/launch on a dedicated simulator or emulator. `sharing-check.json` in the app's documents folder must contain ten observations and no failures. The probe uses native editors and gesture observers, routes through the installed app adapter, and checks persistence through ApplicationSettings. These are synthetic input events, not physical gesture/screen-reader tests. It resets only the reference's `mavis:directory` sample storage. The helper preserves the generated entry/config in a backup; restore them afterward:

```sh
node scripts/prepare-sharing-native.mjs /path/to/generated/apps/mobile --restore
# Rebuild and install a normal app without the probe.
```

Local evidence for PR #259 reused already built, unchanged NativeScript SDK binaries with the new generated JS on Android API 35 and iOS 26.2. Both reports are in ignored `artifacts/sharing/native-{android,ios}.json`; this evidence does not claim a new SDK compilation. Normal catalog apps were restored after the checks.
