# Shared configurator verification

Build the catalog with `--env.production --env.configuratorCheck --no-hmr`, then run `node scripts/check-native-configurator.mjs android|ios DEVICE`. Use a dedicated emulator/simulator. The flag opens Forma and includes the opt-in probe; normal builds contain neither the probe nor its report filename.

The probe exercises numeric incomplete drafts and stepping, image decoding and reserved aspect ratio, native Switch updates, Accordion dynamic height/reversal/editor identity/removal, color/radius mappings with application scale 1.1 and press 0.96, and MultiSelect Sheet selection/closing. Reports are under ignored `artifacts/configurator/{android,ios}`. The separate performance protocol covers detach, repeated navigation, observer ownership and idle view counts.

Also inspect Forma in both themes, change quantity with the software keyboard, search/remove extras, and return from a retained page. Capture the screen after image loading and during the selection sheet. Restore a normal build afterward. Simulator checks do not establish physical-device memory, keyboard or screen-reader behavior.
