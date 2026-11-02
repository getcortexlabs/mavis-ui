# Native Combobox validation

Use the shared `/checks/combobox` fixture and the component demo inside a scrolling MScreen. Run both iOS and Android with the current normal catalog build; never enable a debug service or endpoint in the library.

1. Focus Search choices. The initial Alpha page appears without a request. The actual native editor remains mounted and shows Alpha; no nested Sheet opens.
2. Type a new query. Check the caret/text while the results change. Tapping Numeric one commits number `1`; String one commits string `'1'`. Unavailable does not commit. Return requests results without selecting the first result.
3. Type `slow`, wait for its request count, then type another query. The later query wins after the slow request eventually completes. The cancellation count increments even though the fixture intentionally ignores cancellation for `slow`.
4. Fail next, then search. Retry restores choices. Search `empty` for the empty message. Search `many` and scroll the owning Screen to verify only 50 results plus the refinement message are rendered. This is bounded rendering, not virtualization.
5. Type another query after choosing. The selected label remains in its caption. Close results restores the selected label and dismisses editing. Clear requests null and empty query. Blur/outside tap closes without selecting; the accepted edit query remains.
6. Toggle acceptance. Rejected queries never start a service request, and value requests leave the original committed ID unchanged. Restore acceptance.
7. Change light/dark themes, use 320-equivalent narrow width where available, and increase system font size. Labels, state messages and controls must remain readable without overlapping. Restore system settings afterward.
8. Use a real composing IME when available. Intermediate marked text must not run searches or select. Completion runs the final query; Return during composition must not select. iOS uses markedTextRange; Android uses composing spans. Inspection occurs after the native text notification so a zero-delay service cannot race span attachment.
9. Search `slow`, then disable/unmount/navigate away. No late page appears; re-entering starts closed. Unload and unmount clear pending debounce/composition/focus timers. Repeat with cached tabs if the integration keeps the view alive.
10. In the combined workflow, repeat inside FormField and an owning Sheet. The form registry focuses the public InputHandle. Search does not submit the form; selecting does not close the owning overlay. Preserve the existing Sheet transformed-ancestor/drag restrictions (#197).

The native view uses platform focus navigation and choice controls. Web's custom Arrow/Enter/Escape navigation is not claimed as a native hardware-keyboard feature. Simulator screenshots do not certify spoken VoiceOver/TalkBack or a third-party IME; report those limits separately from measured results.
