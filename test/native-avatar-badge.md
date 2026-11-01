# Avatar and Badge native review

Use a dedicated iOS simulator and Android emulator. Build the normal catalog for navigation;
`--env.identityCheck=avatar` or `badge` starts directly on a demo for focused visual review.
A direct initial demo has no previous catalog route in the native router history.

1. Open Avatar. Confirm the bundled illustration is centered and clipped to the circle.
   Switch Image → Initials → Unavailable image → Image. Both missing and invalid sources
   must show MC, including iOS decoders that resolve an empty ImageSource instead of rejecting.
2. Review sm/md/lg/xl, square corners and the unnamed icon. Switch theme. Initials and icon
   stay inside their fixed geometry when system text is enlarged; the adjacent name scales.
3. Go back to the catalog and open Badge. Review all six tones. New idea increments the
   counter; Mark as read displays zero. Capture the accessibility tree with the contextual
   count label. The badge itself has no action, focus target or live announcement.
4. Enlarge system text (iOS accessibility category / Android font_scale 2). Scroll through
   the demo: badges must grow vertically, wrap long labels and remain within the content.
   Restore normal text settings after the check.
5. Open Showcase → Profile. Confirm Avatar, category and form status fit the profile card.
   Edit the name; initials and editing status follow it. Discard restores saved values.
6. Navigate away and return; confirm normal rendering and no crash. Build the final catalog
   without review flags. Shut down only the dedicated test devices.

Web tests cover image/error/recovery, narrow layouts/themes, text enlargement, counts and
Profile state. Native unit tests cover overlapping image requests, failed decoding and late
completion after unmount. No claim of network cancellation or image downsampling: Core requests
already in flight may finish. Real network conditions, physical devices and a full VoiceOver/
TalkBack audit remain separate validation work.
