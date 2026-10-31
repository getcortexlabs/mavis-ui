# Native Switch checks

Build the catalog with `npm run build` at the root, then `ns build ios --emulator --no-hmr` or `ns build android --no-hmr` from `examples/catalog`. Open Components → Switch. Use a dedicated simulator/emulator if other apps are under test.

1. Notifications starts on, weekly digest off. Tap the Notifications label, then its thumb: the boolean toggles once and the counter advances once per activation.
2. Toggle Digest, then Reset. Both values return to their initial state without increasing the change counter. Disabled Security alerts stays on and Early access stays off when tapping either their labels or thumbs.
3. Drag vertically beginning on a label and beginning on a thumb. Dragging on the label scrolls the Screen without changing the counter. A vertical thumb drag must not change the counter; iOS may keep that gesture on the control rather than scroll the parent. On the thumb, horizontal dragging follows the native switch's gesture behavior.
4. Switch between Mavis and Midnight. Values remain unchanged; inspect track, thumb, disabled colors and label wrapping. Increase system text size and inspect again in portrait and landscape. Labels may wrap and the screen must remain scrollable.
5. Leave and reopen the component several times, including after a rapid toggle. Retained pages must have the parent value on load, and press feedback must remain functional. The Vue contract tests separately cover a parent rejecting a change and unload before its scheduled restoration.
6. With Android keyboard/D-pad navigation, focus an enabled native switch and activate it. Verify the checked state in the UI tree; disabled switches must not change. On iOS, inspect the native switch name/value and exercise Full Keyboard Access if available.
7. In Showcase → Profile, change notification preferences, discard and save. Save/Discard affect the same local state as the text fields. A switch tap while editing should still reach the control as Screen dismisses the keyboard.
8. Enable the operating system's Reduce Motion/Remove animations. Check interaction, label press feedback and navigation; restore the setting afterward. Platform switch animation is owned by the OS. Mavis uses Jolt only for the label press and releases it on disabled/unloaded/unmount.

Record device/runtime, settings, screenshots and any unchecked steps in the PR. This checklist does not claim physical-device or comprehensive assistive-technology coverage.
