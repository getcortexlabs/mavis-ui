import Foundation

extension __FIXTURE__ {
    @MainActor final class StoredPanels: PanelStorage {
        private let name = "mavis.conformance.panels." + UUID().uuidString
        private let defaults: UserDefaults
        init() { defaults = UserDefaults(suiteName: name)! }
        deinit { UserDefaults.standard.removePersistentDomain(forName: name) }
        func load() async throws -> PanelSizes? {
            guard defaults.object(forKey: "horizontal") != nil else { return nil }
            return PanelSizes(horizontal: defaults.double(forKey: "horizontal"), vertical: defaults.double(forKey: "vertical"))
        }
        func save(_ sizes: PanelSizes) async throws {
            defaults.set(sizes.horizontal, forKey: "horizontal")
            defaults.set(sizes.vertical, forKey: "vertical")
        }
    }
    @MainActor static func services() -> MavisServices { MavisServices(panelStorage: StoredPanels()) }
}
