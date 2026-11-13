import SwiftUI
extension __FIXTURE__ {
    @MainActor final class NativeCities: CityService {
        private var failed = false
        func search(_ query: String, _ limit: Double) async throws -> [SearchOption] {
            await withCheckedContinuation { continuation in
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.03) { continuation.resume() }
            }
            if query == "fail" && !failed { failed = true; throw MavisFailure(message: "Offline") }
            let options = query == "fail"
                ? [SearchOption(value: "recovered", label: "Recovered", disabled: nil, helperText: nil)]
                : [SearchOption(value: "london", label: "London", disabled: nil, helperText: nil), SearchOption(value: "lisbon", label: "Lisbon", disabled: nil, helperText: nil)].filter { $0.label.lowercased().contains(query.lowercased()) }
            return Array(options.prefix(Int(limit)))
        }
    }
    @MainActor static func services() -> MavisServices { MavisServices(cityService: NativeCities()) }
}
