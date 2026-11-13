import SwiftUI
extension __FIXTURE__ {
    @MainActor final class NativeToastProbe: ToastProbe {
        private func pause() async {
            await withCheckedContinuation { continuation in
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { continuation.resume() }
            }
        }
        func run() async throws -> String {
            var checks = 0
            func check(_ passed: Bool) throws {
                if !passed { throw MavisFailure(message: "Toast check \(checks + 1)") }
                checks += 1
            }
            let local = MavisToastQueue()
            let host = UUID()
            let first = local.show(message: "First", duration: 0)
            try check(first != nil && !local.visible)
            local.activate(host)
            try check(local.visible && local.message?.message == "First")
            let removed = local.show(message: "Remove", duration: 0)
            local.show(message: "Next", duration: 0)
            local.dismiss(removed); local.dismiss(first); await pause()
            try check(local.message?.message == "Next")
            local.deactivate(host)
            try check(local.show(message: "Too late") == nil && !local.visible)
            local.dispose(); local.activate(host)
            try check(local.show(message: "Disposed") == nil)

            let app = MavisToastQueue(persistent: true)
            app.show(message: "Saved", duration: 0)
            let firstHost = UUID(), secondHost = UUID()
            app.activate(firstHost)
            app.show(message: "Queued", duration: 0)
            app.deactivate(firstHost)
            let hidden = app.show(message: "While hidden", duration: 0)
            app.activate(secondHost)
            try check(hidden != nil && app.visible && app.message?.message == "Saved")
            app.deactivate(firstHost)
            try check(app.visible && app.message?.message == "Saved")
            app.clear(); await pause()
            try check(app.message == nil)
            app.dispose()
            try check(app.show(message: "Disposed app") == nil)

            let leaving = MavisToastQueue(persistent: true)
            let a = leaving.show(message: "Leaving", duration: 0)
            leaving.show(message: "Kept", duration: 0)
            let old = UUID(), replacement = UUID()
            leaving.activate(old); leaving.dismiss(a); leaving.deactivate(old)
            leaving.activate(replacement); await pause()
            try check(leaving.message?.message == "Kept" && leaving.visible)
            leaving.dispose()
            return "\(checks) toast checks passed"
        }
    }
    @MainActor static func services() -> MavisServices { MavisServices(toastProbe: NativeToastProbe()) }
}
