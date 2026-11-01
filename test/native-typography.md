# Typography and scoped themes on devices

Build the catalog with `--env.inputCheck=studio --env.typographyCheck`. The second flag is an optional measurement probe; normal builds omit it. Use an isolated simulator/emulator and restore its font scale after the check.

1. Open Atelier at the normal font scale. Confirm the serif headline, italic rose second phrase, sans-serif body, Input padding and Card shadow. Ghost buttons must have no shadow outline.
2. Switch the edition to dark and back. The outer catalog toolbar stays on its application theme; the nested quotation card stays dark. Open the Sheet and check its title, inline phrase, body and action use the edition theme.
3. Enter an email, open the confirmation Dialog, confirm and read the Toast. Check fonts as well as surface colors. The form is a local demonstration and sends no request.
4. Increase system text size (Android `font_scale=2`; iOS accessibility-extra-extra-extra-large), restart, scroll through both editions and repeat the Sheet. Text must wrap rather than clip, including inside MSpan; individual runs must not shrink to a fixed pixel size.
5. Read `Documents/typography-check.json` from the iOS data container or `files/typography-check.json` through Android `run-as com.getcortexlabs.mavis.catalog`. The probe writes 20 samples after launch. iOS records the regular/italic UIFont names and point sizes; Android records scaled TextView size and the count of AbsoluteSizeSpan runs (expected zero). Compare normal and large text runs. Save hierarchy/screenshot evidence alongside the samples.
6. Return to normal font scale. Build without either flag; verify the optional probe is absent from the bundle.

The renderer maps shared `lineHeight` to Core additional leading, and shadows to device-independent units. Native font metrics differ from browser metrics. These checks establish simulator/emulator behavior, not physical-device or assistive-technology certification.
