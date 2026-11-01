# ListItem and Separator native review

Use dedicated iOS and Android test devices and the normal catalog build.

1. Open ListItem. Tap the leading avatar of Marina: the selection text must change.
   Tap the library row and then the disabled archive; the archive must not change selection.
   The favorite button in the informational row changes independently of row selection.
2. Review both themes and enlarged system text. Titles and descriptions wrap, row height
   follows content, and compact side content stays inside the card. Restore text settings.
3. Open Separator. Check that the horizontal line respects Card padding plus its inset.
   The automatic vertical line fills the 72-DIP Row minus two 8-DIP insets (56 DIP).
   Toggle the explicit line twice: 80×1 → 1×80 → 80×1, with no leftover dimension.
   Lines must not appear as individual elements in the accessibility tree.
4. Open Showcase → Team. Tap a member, favorite the contact and close the Sheet. The row
   and favorite count update. Switch to Available: Lucas disappears and favorites persist.
   Open the same contact again, remove the favorite and return to All.
5. Navigate away and return. Confirm that rows and separators render normally; Team data
   is local and resets when the screen is left. Shut down only the dedicated test devices.

Unit tests cover props, activation, semantic updates, decorative lines, dimensions and native
press cleanup. Browser tests cover keyboard activation, focus restoration, both themes,
320/390/1440 widths and enlarged text. This protocol does not claim physical-device or full
VoiceOver/TalkBack coverage. ListItem does not virtualize collections; test a collection solution
separately before using thousands of rows.
