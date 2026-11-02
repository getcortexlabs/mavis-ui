# Continuous motion

The current root/example dependencies and renderer peers require Jolt **0.1.0-rc.9**.
Run `npm ci` at the root and in `examples/catalog`, then rebuild native apps.
The first validation used a pinned main candidate; the final checks use the
published RC through normal registry installs and clean packed consumers.

Build with `ns build ios --env.production --env.motionCheck=probe --for-device=false`
or `ns build android --env.production --env.motionCheck=probe`. Run
`node scripts/check-native-continuous.mjs ios|android DEVICE NAME` against an
explicitly selected simulator/emulator. The runner installs the built app and
saves the 32 measurements, failures and screenshot under `artifacts/continuous/NAME`.

The probe uses real native Jolt bindings and presentation values. It dispatches
touch and application lifecycle notifications inside the app; these are synthetic
inputs, not evidence of OS gesture recognition. It checks continuous retargeting
under press, release, pause/resume, background/latest input, live reduced motion,
source disposal, replacement generations and removal of native touch/pan observers.
It also reads real scroll offsets and presentation for bounded mappings, press,
partial interruption, live reduced motion, short content and source removal.
Scale tolerance is 0.015; the immediate retarget boundary allows 0.035. Boolean and
resource checks are exact. This is not a physical-device performance benchmark.

Build again with `--env.motionCheck=kinetic` for actual OS input and recordings:

1. Drag Field notes left/right and release at each stop. Catch a moving snap.
2. Tap the card once: only genuine taps increment the activation counter.
3. Choose Retarget while held, then hold the card for two seconds. Its scale changes
   while press stays independent. Release retains the new base.
4. Pause, retarget and resume. Remove while moving, then mount and move again.
5. Disable during input, background/resume the app and repeat with reduced motion.
6. Open notes. Exercise native Sheet drag, dismissal button and focused input.

Record in English and inspect the footage at original speed. Web uses the same
`shared/kinetic-motion.ts` and `shared/pages/Kinetic.vue`; its one-pointer gesture
driver and native recognizers differ. Bounds are CSS pixels/Web and DIPs/native.
The proof does not cover pinch, transformed ancestors, nested-scroll handoff on
Web, physical devices or equal velocity curves across operating systems.

Normal builds omit the native probe route and its result writer. Restore the
normal catalog or shut down only the temporary devices created for this review.

Build `--env.motionCheck=field` for Field Guide. Scroll with native input, hold the card, change text/type and confirm its pivot follows layout. Scroll back to the top, remove/mount the scene and detach/attach the scroll source. The same recipe is `shared/field-motion.ts`.
