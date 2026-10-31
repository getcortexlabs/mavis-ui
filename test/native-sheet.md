# Sheet checks

Build the packages with `npm run build`, then build the catalog from `examples/catalog` with `ns build ios --emulator --no-hmr`. Open Sheet from the catalog. Its component page uses a scrolling Screen. Repeat these checks in both themes:

1. Open the content-height sheet. The scrim must cover the status-bar area, and the panel surface must reach the bottom of the window. Content and actions must clear the home indicator.
2. Rotate with the sheet open. The scrim and panel must cover both lateral safe areas. The panel's content must clear the notch, and its bottom padding must follow the new inset. Rotate back without closing.
3. Focus Search and type. The editor and actions must remain reachable above the software keyboard. Apply must close the sheet and dismiss the keyboard.
4. Open Full screen. The panel header must remain below the status bar, while the surface reaches the bottom edge. Scroll its content and close it.
5. Close and reopen with the close button, scrim and drag handle. After dismissal, the page must scroll inside its original safe areas. Repeat with `scroll=false` on the containing Screen, using a short page if necessary.

For geometry checks, compare the layer host and scrim's bounds in window coordinates with the window bounds. With the keyboard hidden and the animation settled, the panel's bottom must equal the window's bottom. Inspect the actual native frame: Jolt's presentation transform is not reflected in the NativeScript `translateY` property. Read iOS safe-area values from `page.ios.view.safeAreaInsets`; `page.ios` is the controller.

The #71 regression was reproduced on an iPhone 17 Pro simulator with iOS 26.2. In portrait, the old layer host was y=62, height=778 inside a 402×874 window. The corrected host is 402×874 at (0,0); the content-height panel ends at y=874 with 34 pt of bottom padding. In landscape, the host covers 874×402 and content uses 62 pt side insets and a 20 pt bottom inset. Captures and geometry from the local run are in the ignored `artifacts/sheet-71` directory.

Also run `npm run check` and the Sheet browser tests. Unit tests cover the controller/view boundary, late insets and rotation; browser tests do not validate iOS safe areas. Physical devices, floating keyboards and nested scrolling remain outside this simulator check.
