# Native press composition check

Build the catalog with `ns build ios --env.production --env.pressCheck` or the Android equivalent.
Run `node scripts/check-native-press.mjs ios|android DEVICE_ID [capture-name]` with an explicitly
selected simulator/emulator. The runner installs only on that device, starts the check page and
writes measurements and a screenshot under `artifacts/press-scale`. The check route is excluded
from normal builds.

The fixture dispatches touch down/up/cancel and an unloaded notification on real native views.
It measures both NativeScript model values and native presentation (UIKit presentation layer or
Android view scale), with a 0.015 scale tolerance after settling. Three before/after
samples check position jumps on retarget/release. Each records elapsed wall time: tolerance
is 0.025 plus 0.65 scale units/second during the measured bridge interval, bounding the
fixture's base/release motion while the native animator continues; these are
boundary checks, not a frame-performance or velocity-continuity benchmark.

Nineteen checks cover assignments before/after a press, non-uniform axes, app animation while
held, mid-press cleanup, stale cleanup after replacement, cancel, reduced motion and real
MButton disable/theme-refresh/unload hooks. Use Jolt animate/set for application scale changes
while layers are active; direct style/property writes during active layers bypass Jolt's base.
The fixture does not change that upstream ownership contract.

Unit regressions exercise the installed Jolt engine/mixer with a controllable platform clock;
Vue integration tests separately verify lifecycle release/reinstallation. Rebuild without
`--env.pressCheck` before distributing a catalog build. This check does not replace physical
pointer testing, a screen-reader review or physical-device validation.

Jolt rc.5 includes the Android interrupted-release correction. The Mavis neutral-track workaround
has been removed. Additional checks use the declared MButton surface and the same shared
application definition, including replacement, stale handles, unmount cancellation, live reduced
motion and a release while the application base is moving.
