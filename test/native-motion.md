# Shared motion check

Build the catalog with `ns build ios --env.production --env.motionCheck` or its Android
equivalent. Install on an explicitly selected simulator/emulator. The initial route is
`/checks/motion`; the same screen source runs at `/playground/#/checks/motion` on Web.
Normal builds still open the catalog.

1. Press and release the button, then the interactive card. Use a short press when checking
   the activation count: Android's native tap recognizer can consume a long hold without
   emitting a tap. Each recognized activation increments the count once.
2. Show and hide Reveal; repeat quickly and leave it open. Content must be visible and
   usable at the end, without leaving an invisible control behind.
3. Change theme: Midnight uses a deliberately stronger 0.90 factor; this check uses 0.96 (the product default is 0.97).
   Repeat both holds and Reveal. These are local test themes, not new defaults.
4. Disable feedback and try both surfaces. Their activation count must stay unchanged.
   Enable and confirm they work again.
5. Open Reveal, unmount the surfaces, then mount again. Repeat press and Reveal.
6. Repeat with the device's reduced-motion setting; restore its previous value afterwards.
   Native Jolt can apply final spatial values immediately while retaining opacity timing;
   Web follows the same spatial-settling policy. Do not claim identical
   execution from shared recipes.

Capture native and browser interaction recordings in English when reviewing a visual change,
label the device/runtime accurately, and distinguish native footage from a browser viewport.
Both adapters execute the shared Jolt recipes. The `--env.pressCheck` fixture also validates the
experimental application surface and shared trigger function on real native views.

Run `npm run check`, browser checks, clean package consumers and both native builds.
Physical-device performance and raw native-control focus restoration remain outside this proof.
