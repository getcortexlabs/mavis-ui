# Input actions, choice labels and Sheet names

Run `npm run build`, then from `examples/catalog` build with `ns build ios --emulator --no-hmr --env.inputCheck=consumer` or `ns build android --no-hmr --env.inputCheck=consumer`. Install only on the selected test device. The flag opens the shared `/checks/consumer` fixture; Web uses `/playground/#/checks/consumer`.

## Input actions (#122)

1. Start with `mavis-password`. Tap Show while the field is unfocused: it reveals the value without focusing the editor. Focus the field, move to the end and two positions left, then Hide **before typing the first character**. Insert `X`, reveal again and verify both the state line and actual native editor contain `mavis-passwoXrd`, with focus retained. This catches both Core's first-secure-edit handling and UIKit's pending buffer clearing; checking only the Vue model misses the second failure.
2. Repeat the reverse direction: focus a secure field, position the caret, reveal, then type. Toggle repeatedly while editing and verify subsequent characters are inserted at the retained caret. On Web, also select a range, toggle and replace it. The action must not submit its enclosing form; Tab/Enter/Space must keep keyboard focus on the action.
3. Toggle each of input disabled, input readonly and action disabled. Its action is disabled and tapping it cannot toggle visibility or increment the counter. Restore each state before the next case.
4. Clear the multiline note through its named action. It becomes empty while its error and label remain. Check that the 48-unit action target stays within the field, has reserved text padding and does not cover the message rows. Repeat in both themes and with larger system text.
5. Screen uses its default keyboard dismissal here. An action belonging to the active input preserves focus; tapping outside the input still dismisses editing. No global gesture or TextField monkeypatch is used.

The iOS TextField subclass reinserts the existing secure value with its delegate temporarily detached when changing visibility during an active edit, restores selection, and clears Core 9.1.3's first-edit flag for that continuing edit. Android restores selection and typeface after Core changes input type. Unit tests cover delegate restoration and inactive-field ownership; installed simulator checks remain necessary for UIKit/Android behavior. Hardware password managers, physical keyboards and third-party IMEs are separate device coverage.

## Choice labels (#123)

Inspect “Minha conta” with its “Noite” Switch: its natural-width label and track must both be visible. The parent Row wraps and the Switch uses `shrink=0`. Increase system text, switch themes and repeat. The deliberately constrained 100-unit column exercises Switch, Checkbox, Radio and Select, including long labels. Native controls may still break words below their readable minimum (in particular the native Switch track and Select insets); that explicit-width stress case is not a promise of CSS-identical wrapping. Do not force the realistic header into that narrow width.

Browser checks cover the 100px short labels, 320px viewport, doubled text with sufficient width, long translations, unbroken tokens and RTL without horizontal overflow. Native intrinsic sizing must not drop the label from an auto-width control or overlap its indicator. Long native text uses the platform's normal wrapping.

## Sheet names (#130)

Open the Sheet with a whitespace-only title and the fallback `Account actions`. No blank heading is rendered. Add the heading and verify `Updated heading`; switch back to the label and verify `Updated label` without a heading. Close and reopen. Core validation, both renderers' setup/render/update paths and Web SSR reject blank effective names even while closed. Direct/global type fixtures reject omitted naming props; dynamic strings still require runtime validation.

Keep device captures under ignored `artifacts/consumer-native`. Build without the flag afterwards. This protocol does not establish physical-device or screen-reader coverage.
