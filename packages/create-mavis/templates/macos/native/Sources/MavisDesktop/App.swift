import SwiftUI

@main
struct MavisDesktopApp: App {
    var body: some Scene {
        WindowGroup("__MAVIS_NAME__") {
            ScrollView {
                Welcome()
                    .padding(48)
                    .frame(maxWidth: 820, alignment: .leading)
                    .frame(maxWidth: .infinity, alignment: .center)
            }
            .background(MavisTokens.background)
            .tint(MavisTokens.primary)
            .preferredColorScheme(.__MAVIS_APPEARANCE__)
            .frame(minWidth: 640, minHeight: 640)
        }
        .defaultSize(width: 860, height: 760)
    }
}
