import SwiftUI
import Foundation

extension __FIXTURE__ {
    @MainActor final class HostScheduler: Scheduler {
        private var task: Task<Void, Never>?
        private var pending: CheckedContinuation<Bool, Never>?
        func cancel() {
            task?.cancel()
            task = nil
            let completion = pending
            pending = nil
            completion?.resume(returning: false)
        }
        func wait(_ milliseconds: Double) async throws -> Bool {
            cancel()
            guard milliseconds.isFinite, milliseconds >= 0, milliseconds <= 2147483647 else {
                throw MavisFailure(message: "Timer delay must fit the host scheduler.")
            }
            return await withCheckedContinuation { completion in
                pending = completion
                task = Task { @MainActor [weak self] in
                    do { try await Task.sleep(nanoseconds: UInt64(milliseconds.rounded(.towardZero)) * 1_000_000) }
                    catch { return }
                    guard let self else { return }
                    let finished = self.pending
                    self.pending = nil
                    self.task = nil
                    finished?.resume(returning: true)
                }
            }
        }
    }
    // Recording adapters intentionally do not write to NSPasteboard or launch another app.
    @MainActor final class HostPlatformTools: PlatformTools {
        private var clipboard = ""
        private var opened: [String] = []
        func formatNumber(_ value: Double) async throws -> String {
            guard value.isFinite else { throw MavisFailure(message: "Invalid number") }
            let format = NumberFormatter()
            format.locale = Locale(identifier: "pt_BR")
            format.numberStyle = .decimal
            format.usesGroupingSeparator = false
            format.maximumFractionDigits = 16
            guard let text = format.string(from: NSNumber(value: value)) else { throw MavisFailure(message: "Invalid number") }
            return text
        }
        func formatTime(_ milliseconds: Double, _ timeZone: String) async throws -> String {
            guard milliseconds.isFinite, abs(milliseconds) <= 8640000000000000, let zone = TimeZone(identifier: timeZone) else {
                throw MavisFailure(message: "Invalid instant or zone")
            }
            let format = DateFormatter()
            format.locale = Locale(identifier: "en_GB")
            format.calendar = Calendar(identifier: .gregorian)
            format.timeZone = zone
            format.dateStyle = .none
            format.timeStyle = .short
            return format.string(from: Date(timeIntervalSince1970: milliseconds.rounded(.towardZero) / 1000))
        }
        func copy(_ text: String) async throws -> Bool { clipboard = text; return clipboard == text }
        func open(_ url: String) async throws -> Bool {
            guard url.hasPrefix("https://") else { return false }
            opened.append(url)
            return true
        }
    }
    @MainActor static func services() -> MavisServices {
        MavisServices(platformTools: HostPlatformTools(), scheduler: HostScheduler())
    }
}
