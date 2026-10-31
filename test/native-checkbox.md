# Native Checkbox checks

Build the catalog with `npm run build` at the root, then `ns build ios --emulator --no-hmr` or `ns build android --no-hmr` from `examples/catalog`. Use dedicated devices when other projects are under test. Open Components → Checkbox.

1. Design starts checked; Development and Product unchecked; All topics is mixed. Activate All topics from its label or supporting text. All three become checked and the counter advances once. The native accessibility tree must drop the partial-selection description as well as update the checked state.
2. Activate Development from its mark. Only Development becomes unchecked, All topics becomes mixed, and the counter advances once. Drag vertically from a mark and from a label: the Screen scrolls without changing selection or the counter.
3. Tap the three disabled examples (checked, unchecked, mixed), including their labels. Neither state nor counter changes. Reset restores Design alone without increasing the counter.
4. Switch Mavis/Midnight without losing state. Inspect the mark, supporting text, disabled controls and full-row touch target. Increase system text size and inspect wrapping and scrolling; restore the setting afterward.
5. On Android, navigate with Tab/D-pad and activate with Space or Enter. The enabled row has a visible theme-colored focus outline. Inspect the native checkbox role/checked state. On iOS, inspect the selected trait and partial-selection value; exercise Full Keyboard Access and VoiceOver on a physical device when available.
6. Leave and reopen the page, including after a press or scroll cancellation. The control must return at its normal scale and remain interactive. Unit tests cover stopping Jolt on disable/unload; the shared contract tests cover parent rejection, mixed-plus-checked activation and external writes. `/checks/checkbox` is a dedicated controlled-state fixture in both catalogs.
7. In Showcase → Library, activate All topics to show all three cards, then again to show the empty state. Show all recovers the results. Toggle an individual filter and confirm only its corresponding card disappears. Theme changes preserve the selection; leaving this demo resets its local state.
8. Enable Remove animations/Reduce Motion and repeat a selection and navigation. Jolt follows the application's motion preference; Web has a separate CSS reduced-motion check. Restore the setting after testing.

Record runtime/device, settings, screenshots and untested items in the PR. Emulator checks do not establish physical-device, older-Android or complete assistive-technology coverage. iOS exposes checkbox semantics through its button/selected traits; Android uses a checkbox role and, on API 30+, a state description for the mixed state.
