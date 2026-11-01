# Dialog native review

Issue: [#87](https://github.com/getcortexlabs/mavis-ui/issues/87).

Use a dedicated iOS simulator and Android emulator. Build packages first, then build the catalog with `ns build ios --env.production --env.dialogCheck` or `ns build android --env.production --env.dialogCheck` from `examples/catalog`. The flag starts `/checks/dialog`; normal builds start the component catalog.

1. Open **normal**. Check the centered surface, safe margins, full content scrim and two actions. Cancel closes without confirming. Tap the backdrop to dismiss. Android back must close the modal before navigating.
2. Open **locked**. Backdrop, Escape and Android back must leave it open; Cancel still closes it.
3. Open **reject**. The parent refuses close requests. Cancel must leave a usable dialog; Confirm must still work.
4. Confirm with one tap. Both actions must become disabled, including when switching from the initially focused action on Android. Backdrop and back must not close it while busy. The fixture fails after 1.8 seconds, restores the actions and lets the user retry. Inspect the confirmation count after closing; each deliberate tap contributes once.
5. Open **long** with normal and enlarged system text. The body scrolls independently; the actions remain reachable. Rotate Android and check both actions again. Restore orientation and font size afterward.
6. Send the app to Home while open, then resume. The dialog remains open and usable. **navigate** pushes another route after 1.8 seconds; returning must not resurrect the dialog. **program** closes from the parent; **reopen** closes and reopens during the leave transition.
7. Open **toast**. The notice waits behind the dialog and becomes available after it closes.
8. Rebuild without `--env.dialogCheck`. From the catalog, open Dialog and exercise Publish/Delete in Mavis and Midnight. In Profile, change a field, choose Discard, then test both Continue editing and Discard.

The native focus helper preserves Android button touch behavior: only the busy panel becomes focusable in touch mode. Making both buttons touch-focusable would consume the first tap on the other action merely to move focus. Android keyboard Tab/Shift-Tab and Escape are handled within the modal; Screen removes covered content from the accessibility tree. Use a compressed UIAutomator dump when inspecting that tree: the uncompressed dump also includes non-important background nodes.

Local validation uses iOS 26.2 and Android API 36. Simulator/emulator checks do not substitute for a physical-device or full VoiceOver/TalkBack audit. Stacked modals, custom forms, floating keyboards and iOS hardware-keyboard navigation are outside this verification.
