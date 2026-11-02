# Native composition and orchestration

Build the catalog with `--env.compositionCheck`. The opt-in probe opens the shared composition screen, exercises Reveal and text scaling, selects Midnight/Azure launcher icons, restores the previous icon and opens Tempo. It dispatches component/gesture events and reads actual native presentation; it does not substitute for real touch or physical-device testing. iOS requires acknowledging its three system icon-change confirmations.

Read `composition-check.json` from Android app-private `files/` or iOS application `Documents/`. The normal bundle excludes both probe modules.

2026-11-02 validation, Jolt candidate `3b8649f`:

- Android API36 emulator and iOS26.0 simulator: Reveal retention, reversal, dynamic auto height and final removal passed. Android font scale 2 reports a 73.5 px label instead of 42 px at scale 1; Android nonlinear scaling is respected. Restore system settings after testing.
- Both: bundled icon selection Midnight → Azure → original passed. iOS26.2 returned a UIKit resource-unavailable error for icon switching; the report is retained. #55 remains open for physical devices, reboot, upgrades and alternate launchers.
- Both: scalar keyframes/progress, additive layer removal, press composition, timeline pause/resume and projected decay passed.
- Both: paused native target replacement fails to resume to the requested y=-14. This is tracked as Jolt #338, with a native unit reproduction. The Web flow passes; do not treat the native replacement contract as release-ready until the upstream fix is tested.

Reports live in ignored `artifacts/composition`. They include actual/expected/tolerance for each motion measurement. No hardware performance claim is made. The published CLI still pins alpha.5/RC.7 and does not expose unreleased orchestration.

Follow-up with Jolt candidate `9043166` (PR #339): use `--env.compositionCheck=orchestration` to run only Tempo, skipping icon dialogs. Android API36 and iOS26.2 each passed all 14 checks, including paused replacement remaining stationary and reaching y=-14 after resume. The previous #338 failure is resolved in this candidate. Evidence: `artifacts/orchestration/jolt339/{android,ios}.json`. Normal builds exclude the opt-in probe.
