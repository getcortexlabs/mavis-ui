# Accordion and SegmentedControl on native

Run the normal catalog from `examples/catalog` with the locally built packages. The same demos and Help Center screen run in the Web catalog. No check flag is required.

## Accordion

1. Open Accordion from the catalog. The first section starts open. Open the theme question: the first body leaves and the second appears. Close the second: no section remains open.
2. Enable **Várias seções abertas** and open two sections. Both bodies remain available. Turn multiple off: the demo keeps only the first expanded value.
3. **O que vem depois?** is unavailable. Enabling **Bloquear cabeçalhos** prevents header activation while preserving the open body and its actions.
4. Activate **Foi útil**, close and reopen its section. The acknowledgement survives because the demo owns that state.
5. Check long titles, descriptions, body text and icons with larger system text. Scroll to the bottom and back; no body remains in measurement after its exit. Check both themes.

## SegmentedControl

1. Open Segmented Control. Week starts selected and shows 280 minutes. Choose Day (45), then Month (1,240). Tap a selected segment again: it stays selected.
2. Watch the marker follow the segment. Rotate or resize the viewport: equal-width segments and marker should realign. Increase system text: labels wrap and the marker follows the measured height.
3. Enable **Bloquear seleção**. Tapping another segment leaves both the value and marker unchanged. The selected native accessibility state must remain `checked`; NativeScript accepts one state token, not a comma-separated string. The option's native `isEnabled` property controls interaction separately.
4. The workspace example keeps Team unavailable. Its selected Personal option remains visible.
5. Background/foreground the app, navigate back and reopen the page. The indicator should reconnect without stale offsets or delayed movement. Reduced-motion handling and listener/timer cleanup also have deterministic coverage in `segmented-motion.spec.ts`.

## Help Center composition

Open Showcase → **Explorar ajuda**. Select Plans, expand an answer and mark it helpful. Switch to Account, then back to Plans: both the expanded answer and its feedback persist. Change the theme and repeat. The contact action shows a local notice; it never sends a message.

Navigate from the profile answer to Profile and back to exercise retained native pages. Web unmounts a route when leaving; native routing can retain it. The state guarantee here applies to topic/theme changes while this screen is mounted.

## Evidence and limits

Keep screenshots and fresh native accessibility dumps in ignored `artifacts/disclosure/`. Capture again after scrolling settles; a tap during deceleration can stop the scroll without activating a control. Remove an old Android hierarchy file before dumping, so a failed UIAutomator query cannot reuse stale evidence.

Automated Web checks cover controlled request rejection, numeric/string IDs, missing/reordered options, focus restoration, LTR/RTL marker geometry, disabled behavior, doubled text, both themes and 320/390/1440 px layouts. Native unit tests cover marker resizing, cancellation, background/reduced motion and disposal. Simulator checks do not replace physical-device, screen-reader or hardware-keyboard audits.

On iOS/Core 9.1.3, the selected trait survives disabling, but the hierarchy can still report an unavailable choice as enabled. Tap blocking is verified; composing the unavailable trait and checking actual VoiceOver speech is tracked in #112.
