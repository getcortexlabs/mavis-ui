# Native press composition check

Build the catalog with `ns build ios --env.production --env.pressCheck` or the Android equivalent.
Run `node scripts/check-native-press.mjs ios|android DEVICE_ID [capture-name]` with an explicitly
selected simulator/emulator. The runner installs only on that device, starts the check page and
writes measurements and a screenshot under `artifacts/press-scale`. The check route is excluded
from normal builds.

The fixture dispatches touch down/up/cancel and an unloaded notification on real native views.
It measures both NativeScript model values and native presentation (UIKit presentation layer or
Android view scale), with a 0.015 scale tolerance after settling. Two immediate before/after
samples check for position jumps on app retarget and release, with tolerance 0.025; these are
boundary checks, not a frame-performance or velocity-continuity benchmark.

Fourteen checks cover assignments before/after a press, non-uniform axes, app animation while
held, mid-press cleanup, stale cleanup after replacement, cancel, reduced motion and real
MButton disable/theme-refresh/unload hooks. Use Jolt animate/set for application scale changes
while layers are active; direct style/property writes during active layers bypass Jolt's base.
The fixture does not change that upstream ownership contract.

Unit regressions exercise the installed Jolt engine/mixer with a controllable platform clock;
Vue integration tests separately verify lifecycle release/reinstallation. Rebuild without
`--env.pressCheck` before distributing a catalog build. This check does not replace physical
pointer testing, a screen-reader review or physical-device validation.

Android's interrupted-release regression is tracked upstream in
[Jolt #286](https://github.com/rafaelaugustos/jolt/issues/286). Mavis commits a flat neutral
track on its own layer before removing it; this keeps the native presentation aligned when
Core skips an unchanged model assignment. The track is stopped synchronously. The unit
regression models that unchanged-value behavior and asserts no pending tracks/timers, while
base-animation checks confirm that the application's motion continues.
