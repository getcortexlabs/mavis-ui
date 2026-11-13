import SwiftUI
import AppKit

@MainActor final class StartupProbe: ObservableObject {
    @Published var revision = 0
    var appearances = 0
}

@MainActor final class CountingDirectoryStorage: DirectoryStorage {
    var loads = 0
    func load() async throws -> DirectorySnapshot {
        loads += 1
        return DirectorySnapshot(entries: DirectoryStoreModule.directorySeed, revision: 0, loadError: false)
    }
    func rename(_ id: String, _ name: String) async throws -> DirectorySnapshot {
        throw MavisFailure(message: "The startup check does not edit entries")
    }
}

struct StartupProbeRoot: View {
    @ObservedObject var probe: StartupProbe
    let storage: CountingDirectoryStorage
    var body: some View {
        MavisEntry(services: MavisServices(directoryStorage: storage))
            .mavisLayers()
            .mavisFeedbackLayer()
            .padding(CGFloat(probe.revision % 2))
            .onAppear { probe.appearances += 1 }
    }
}

@main struct DirectoryStartupCheck {
    @MainActor static func main() {
        let app = NSApplication.shared
        app.setActivationPolicy(.prohibited)
        let storage = CountingDirectoryStorage()
        let first = StartupProbe()
        let host = NSHostingView(rootView: StartupProbeRoot(probe: first, storage: storage))
        host.frame = CGRect(x: 0, y: 0, width: 900, height: 760)
        let window = NSWindow(contentRect: host.frame, styleMask: [.titled], backing: .buffered, defer: true)
        window.contentView = host
        func settle(_ seconds: TimeInterval = 0.15) {
            host.layoutSubtreeIfNeeded()
            RunLoop.current.run(until: Date().addingTimeInterval(seconds))
        }
        func check(_ condition: @autoclosure () -> Bool, _ message: String) {
            guard condition() else { print("FAILED Directory startup: \(message)"); exit(1) }
        }
        settle()
        check(first.appearances == 1 && storage.loads == 1, "first appearance must start restore once")
        first.revision += 1
        settle()
        check(storage.loads == 1, "body updates must retain the startup guard")
        window.contentView = nil
        settle()
        window.contentView = host
        settle()
        check(first.appearances >= 2, "the check must observe an actual second appearance")
        check(storage.loads == 1, "appearing again with the same identity must not restore again")
        let second = StartupProbe()
        let secondHost = NSHostingView(rootView: StartupProbeRoot(probe: second, storage: storage))
        secondHost.frame = host.frame
        let secondWindow = NSWindow(contentRect: host.frame, styleMask: [.titled], backing: .buffered, defer: true)
        secondWindow.contentView = secondHost
        secondHost.layoutSubtreeIfNeeded()
        settle()
        check(second.appearances == 1 && storage.loads == 2, "another entry identity owns its own restore")
        window.contentView = nil
        secondWindow.contentView = nil
        print("passed Directory startup: first appearance, body update, reappearance and separate entry identity")
    }
}
