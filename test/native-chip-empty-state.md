# Chip and EmptyState native smoke

Build the normal catalog with `ns build ios --env.production` and `ns build android --env.production` from `examples/catalog`. Install on a dedicated simulator/emulator; keep existing devices untouched. No probe or runtime patch is required.

1. Open Chip from the catalog surface. Design starts selected, Código unselected. Toggle Código and verify the count and both check marks. Tap the disabled Em breve chip; selection/count must remain unchanged.
2. Remove Vue with its separate removal button. NativeScript/Web tags remain and topic selection is unchanged. Restore tags; switch themes without resetting selection.
3. Increase system text (iOS `accessibility-large`, Android `font_scale 2`). Labels and actions must remain readable, with wrapping and growing heights. Restore `large`/`1` afterwards.
4. Open Empty State. Verify the default illustration, compact example, and custom illustration. The small accent circle must be fully visible. Create the collection, verify the replacement content, then restart. Repeat in the other theme and with larger text; scroll to reach actions.
5. Open Showcase → Biblioteca. Toggle topic chips and verify results. Search for an unmatched word, dismiss the keyboard, and use Limpar filtros. It must clear search and restore all three topics. Open Salvos, remove its only reading, and use Explorar leituras. Saved/search/topic state remains owned by the page.
6. Leave a component and return, and background/foreground the app. Press feedback must still work without leaving a scaled surface. Native pages can be retained by the router; a full app restart resets demo state.

Capture screenshots plus fresh accessibility hierarchies. On Android, discard UIAutomator `null root` failures instead of reusing an earlier dump; wait for boot/route/scroll completion before tapping. On iOS, a route animation may still expose the previous hierarchy briefly. Record that as an automation retry, not as a component result.

The shared contract tests cover rejected model updates, disabled callbacks and independent removal on both renderers. `test/browser/chip-empty-state.browser.ts` adds keyboard behavior, long labels, constrained widths, themes, reduced motion and Library recovery. Native smoke is not a physical-device, hardware-keyboard, screen-reader speech or performance audit.
