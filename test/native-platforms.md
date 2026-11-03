# Platform motion integration probe

Install the pinned Jolt candidate in the root and catalog with `node scripts/prepare-jolt-candidate.mjs` and `node scripts/prepare-jolt-candidate.mjs --native`, then build the Mavis packages. In `examples/catalog`, build each native app with `ns build ios --for-device false --env.platformCheck` or `ns build android --env.platformCheck`. SDK compilation must include the candidate's native sources.

Run `node scripts/check-native-platforms.mjs ios SIMULATOR_UDID` or `node scripts/check-native-platforms.mjs android EMULATOR_SERIAL`. The script installs the build, starts the opt-in probe and saves its report under `artifacts/platforms`. Use dedicated devices. Restore normal builds without `platformCheck` afterward.

The probe exercises shared Prism and Orbit components, decoded-image readiness, paused/finished/cancelled dissolve, model persistence, optional SF Symbols/liquid, component replacement, native physics pause/impulse, reduced motion and route teardown. Physics reads the native presentation transform. Taps are synthetic callbacks on real Mavis controls; this is not a hardware gesture, keyboard, screen-reader or frame-performance audit.

Web counterparts live in `platform-effects.browser.ts`. Nuxt's packed consumer includes SSR/SSG fixtures and `check-nuxt-platforms.mjs` for hydration and KeepAlive. A successful build alone is not proof that those browser checks passed.
