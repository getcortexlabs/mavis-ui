# Native Radio checks

Build the packages at the root with `npm run build`, then the catalog with `ns build ios --emulator --no-hmr` or `ns build android --no-hmr` from `examples/catalog`. Use dedicated devices when other apps are under test. Open Components → Radio.

1. Reading rhythm starts empty. Tap Slow on its label/help, then tap its circle again. It stays selected and the counter is one. Activate Daily from its circle: only Daily is selected and the counter becomes two.
2. Drag vertically starting from an option. The Screen must scroll without selecting it. Tap the disabled real-time option and disabled team preferences; their states and the change counter stay unchanged.
3. Clear selection externally. Neither enabled option stays marked, and the counter does not increase. Choose again, switch Mavis/Midnight and verify that the selection persists and the dot, ring, focus and disabled colors remain legible.
4. Increase system text size. Long labels and helper text wrap beside a fixed-size circle; the full row remains usable and scrollable. Restore the setting after checking. Inspect narrow portrait and landscape when available.
5. Use Android Tab/D-pad to focus a native RadioButton, check the visible theme-colored outline, and activate it with Space/Enter. iOS exposes button/selected traits. Verify names and selected states in the native tree; physical Full Keyboard Access and a complete screen-reader audit are separate checks.
6. Leave and reopen the demo after a press or scroll gesture. Marks return to normal scale and controls still respond. Checkbox uses the same internal native surface; smoke its checked/mixed states too. Unit tests cover motion cleanup on disable/unload and unchanged Checkbox behavior.
7. In Showcase → Focus, select Rain, adjust duration, open details and prepare the session. The summary uses the label, while the selection uses a stable value. The group disables during preparation and works again afterward. Changing ambience clears the ready message.
8. `/checks/radio` is a dedicated fixture for external removal, disabling, reordering, absent values, numeric/string values and a parent rejecting updates. Unit/SSR/browser tests cover these contracts, including no automatic selection. Exercise the fixture on native when a device-specific change is suspected.
9. With Remove animations/Reduce Motion enabled, repeat selection and navigation. Jolt follows the application's motion preference and stops mark feedback on disabled/unload/unmount. Restore the device preference afterward.

Record runtime, device, settings and untested steps in the PR. Web group arrow keys are implemented in the Web renderer; native keyboard movement follows platform focus navigation. Emulator validation does not establish physical-device, older-OS or comprehensive assistive-technology coverage.
