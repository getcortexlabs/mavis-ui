import SwiftUI

@main
struct MavisDesktopApp: App {
    var body: some Scene {
        WindowGroup("__MAVIS_NAME__") {
            ScrollView {
                __MAVIS_ROOT__()
                    .padding(48)
                    .frame(maxWidth: __MAVIS_MAC_WIDTH__, alignment: .leading)
                    .frame(maxWidth: .infinity, alignment: .center)
            }
            .background(MavisTokens.background)
            .tint(MavisTokens.primary)
            .preferredColorScheme(.__MAVIS_APPEARANCE__)
            .frame(minWidth: __MAVIS_MAC_MIN_WIDTH__, minHeight: 640)
        }
        .defaultSize(width: __MAVIS_MAC_DEFAULT_WIDTH__, height: 760)
    }
}
