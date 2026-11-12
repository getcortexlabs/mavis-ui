import SwiftUI

@main
struct MavisDesktopApp: App {
    var body: some Scene {
        WindowGroup("__MAVIS_NAME__") {
            // portability.entry of mavis.config.json, in Generated/MavisEntry.swift.
            MavisEntry()
                // Sheets, dialogs, popovers and menus open over the window's content.
                .mavisLayers()
                // Tooltips and toasts show over the window's whole content.
                .mavisFeedbackLayer()
                .tint(MavisTokens.primary)
                .preferredColorScheme(.__MAVIS_APPEARANCE__)
                .frame(minWidth: __MAVIS_MAC_MIN_WIDTH__, minHeight: 640)
        }
        .defaultSize(width: __MAVIS_MAC_DEFAULT_WIDTH__, height: 760)
    }
}

/// The page around a screen without an MScreen of its own: it scrolls on the theme background.
/// A screen with one fills the window itself.
struct MavisPage<Content: View>: View {
    @ViewBuilder var content: () -> Content

    var body: some View {
        ScrollView {
            content()
                .padding(48)
                .frame(maxWidth: __MAVIS_MAC_WIDTH__, alignment: .leading)
                .frame(maxWidth: .infinity, alignment: .center)
        }
        .background(MavisTokens.background)
    }
}
