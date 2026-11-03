# Platform motion integration probe

Install the locked dependencies with `npm ci` in the repository root and in `examples/catalog`, then build the Mavis packages. The source checkout pins published Jolt 0.1.0-rc.10. In `examples/catalog`, build each native app with `ns build ios --for-device false --env.platformCheck` or `ns build android --env.platformCheck`. Rebuild the native application after upgrading Jolt so SDK compilation includes its native helpers. The optional `@rafaelaugusto/jolt-native` adapters are not used by these probes.

Run `node scripts/check-native-platforms.mjs ios SIMULATOR_UDID` or `node scripts/check-native-platforms.mjs android EMULATOR_SERIAL`. The script installs the build, starts the opt-in probe and saves its report under `artifacts/platforms`. Use dedicated devices. Restore normal builds without `platformCheck` afterward.

The probe exercises shared Prism, Orbit and Field components, decoded-image readiness, paused/finished/cancelled dissolve, model persistence, optional SF Symbols/liquid, component replacement, native physics pause/impulse, gravity pause/landing/replacement, sensor permission without claiming hardware, reduced motion and route teardown. Physics reads the native presentation transform. Taps are synthetic callbacks on real Mavis controls; this is not a hardware gesture, keyboard, screen-reader or frame-performance audit.

Web counterparts live in `platform-effects.browser.ts`. Nuxt's packed consumer includes SSR/SSG fixtures and `check-nuxt-platforms.mjs` for hydration and KeepAlive. A successful build alone is not proof that those browser checks passed.
