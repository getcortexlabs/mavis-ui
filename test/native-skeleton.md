# Skeleton native review

Issue: [#91](https://github.com/getcortexlabs/mavis-ui/issues/91).

Build packages, then run `ns build ios --env.production --env.skeletonCheck` or `ns build android --env.production --env.skeletonCheck` from `examples/catalog`. The flag opens the shared Skeleton demo. Use dedicated devices, and rebuild without the flag before completing the review.

1. Scroll to the placeholders. Check the 48 × 48 circle, proportional bars and large block. The pulse changes opacity without moving or resizing the layout. Switch Mavis/Midnight and repeat.
2. Turn **Animar placeholders** off. Blocks stay visible at full opacity. Turn it on again and check the pulse. For screenshot comparisons, crop to the shapes; the switch, scroll indicator and status bar animate independently.
3. Choose **Mostrar conteúdo**, then **Carregar novamente**. Repeat: content and placeholders replace one another, with one loading message for the region and no hidden real controls inside the blocks.
4. With placeholders visible, send the app Home and resume. Confirm that the demo is still loading and the pulse resumes. Navigate to the catalog and return; the demo remains usable. Check loading state before comparing frames, since content is intentionally static.
5. Enable system reduced motion and return to the app. Placeholders must be static. Restore the setting and return; animated placeholders pulse again. Automated lifecycle tests also exercise preference changes while unloaded, disabled and suspended.
6. In a normal build, open Showcase → Library and choose **Atualizar coleção**. A 1.5-second simulated wait replaces only the reading cards. Filters, saved items and the active tab survive. Navigate away during loading and return without a stale timer affecting the new page.

Local validation uses iOS 26.2 and Android API 36. The component is decorative and excluded from focus/assistive output. This is not a full screen-reader or physical-device audit. Fixed placeholder dimensions do not scale with text; size them for the expected content. Scrolling a block offscreen does not stop its animation. Large-list virtualization and performance benchmarks are outside this delivery.
