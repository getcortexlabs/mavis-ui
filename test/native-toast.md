# Native Toast checks

Use a dedicated iOS simulator/Android emulator. `ns run ios --env.toastCheck` or `ns run android --env.toastCheck` opens `/checks/toast`; omit the flag for the final catalog build. Record OS/device and actual coverage separately from this protocol.

- Open the Toast demo. Exercise success, error, warning and info in Mavis/Midnight. Verify icon/color, title and message, manual close and automatic dismissal. No scrim or forced focus change.
- Queue three messages: one visible at a time, in order, each with its own duration after entry. Dismiss one and clear a waiting queue; no stale item returns. Repeat identical messages.
- Open a persistent notice. Background action still increments its counter. Focus the editor and submit a notice without explicitly blurring: keyboard and typed text remain intact. Scroll the underlying page; the toast stays inside the Screen's top safe area.
- Open a Sheet while a timed notice is visible; its timer waits and the notice is hidden behind the modal. Queue a notice inside the Sheet and close it; the notice becomes available afterward. Android back belongs to the Sheet/router, not Toast.
- Send a timed notice, background the app before expiry and resume. Remaining time continues. Navigate away with visible/queued notices, then return: no old notices, layer, timer or handler remains. Also exercise native unload with a retained page.
- Review narrow width, long copy, large system text and rotation. The close action remains reachable; long copy can scroll within the card. Restore text/motion settings afterward.
- With a native screen reader enabled at entry, the notice is announced without stealing focus and waits for manual dismissal. Record whether this check actually ran; no comprehensive audit is implied.
- Profile: invalid data keeps inline errors; valid Save shows the success Toast. Input, Switch and Select state still saves/discards together. No persistence or server call is implied by the demo.

Core fake-clock tests cover queue ordering, exact remaining time, multiple pause reasons, stale callbacks, duplicate hosts and disposal. Chromium/WebKit cover Web focus, hovering, document hiding, modal priority and navigation. Native platforms need their own interaction evidence.
