import AppKit
import SwiftUI

extension __FIXTURE__ {
    @MainActor final class NativeScrollProbe: ScrollProbe {
        private func pause() async {
            await withCheckedContinuation { continuation in
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.04) { continuation.resume() }
            }
        }

        private func check(_ value: Bool, _ message: String) throws {
            if !value {
                print("Scroll history probe: \(message)")
                throw MavisFailure(message: message)
            }
        }

        func run() async throws -> String {
            let navigator = MavisNavigator(canonical: { $0 })
            let first = navigator.currentEntry
            navigator.recordScroll(120, for: first.id)
            navigator.push("/")
            let second = navigator.currentEntry
            try check(first.id != second.id && first.href == second.href, "Equal URLs need separate identities")
            navigator.recordScroll(240, for: second.id)
            navigator.back()
            try check(navigator.currentEntry == first && navigator.scrollRestoration(for: first).read() == 120, "Back lost the first offset")
            navigator.recordScroll(999, for: second.id)
            try check(navigator.scrollRestoration(for: second).read() == 240, "An inactive view changed its offset")
            navigator.forward()
            try check(navigator.currentEntry == second && navigator.scrollRestoration(for: second).read() == 240, "Forward lost the second offset")
            navigator.replace("/")
            let replacement = navigator.currentEntry
            try check(replacement.id != second.id && navigator.scrollRestoration(for: replacement).read() == 0, "Replace reused a visit")
            try check(navigator.scrollRestoration(for: second).read() == 0, "Discarded visit kept its offset")
            navigator.recordScroll(360, for: replacement.id)
            let relaunched = MavisNavigator(restoring: navigator.stored, canonical: { $0 })
            try check(relaunched.currentEntry == replacement && relaunched.scrollRestoration(for: replacement).read() == 360, "Relaunch lost visit identity/offset")
            let anotherWindow = MavisNavigator(canonical: { $0 })
            try check(anotherWindow.currentEntry.id != first.id && anotherWindow.scrollRestoration(for: anotherWindow.currentEntry).read() == 0, "New window inherited another window's offset")
            navigator.recordScroll(.nan, for: replacement.id)
            navigator.recordScroll(-1, for: replacement.id)
            try check(navigator.scrollRestoration(for: replacement).read() == 360, "Invalid offsets reached persistence")
            var claimed = 0
            let release = navigator.claimBack(MavisBackClaim(owns: { true }, back: { claimed += 1 }))
            navigator.sync([])
            try check(claimed == 1 && navigator.currentEntry == replacement, "A sheet claim lost route identity")
            release()
            navigator.sync([])
            try check(navigator.currentEntry == first && navigator.scrollRestoration(for: first).read() == 120, "Native stack pop lost offset")
            navigator.forward()
            try check(navigator.currentEntry == replacement, "Native stack pop lost forward identity")

            let places = [MavisRouteDestination(id: "a", label: "A", href: "/a"), MavisRouteDestination(id: "b", label: "B", href: "/b")]
            let tabs = MavisNavigator(destinations: places, canonical: { $0 })
            let aRoot = tabs.currentEntry
            tabs.recordScroll(100, for: aRoot.id)
            tabs.push("/detail")
            let aDetail = tabs.currentEntry
            tabs.recordScroll(200, for: aDetail.id)
            tabs.select("b")
            tabs.push("/detail")
            let bDetail = tabs.currentEntry
            tabs.recordScroll(400, for: bDetail.id)
            tabs.select("a")
            try check(tabs.currentEntry == aDetail && tabs.scrollRestoration(for: aDetail).read() == 200, "Destination switch lost its stack")
            tabs.push("/a")
            try check(tabs.currentEntry == aRoot && tabs.scrollRestoration(for: aRoot).read() == 100, "Destination home lost its root offset")
            tabs.forward()
            tabs.select("b")
            try check(tabs.currentEntry == bDetail && tabs.scrollRestoration(for: bDetail).read() == 400, "Equal URL in another destination collided")
            let tabsAgain = MavisNavigator(destinations: places, restoring: tabs.stored, canonical: { $0 })
            tabsAgain.select("a")
            try check(tabsAgain.currentEntry == aDetail && tabsAgain.scrollRestoration(for: aDetail).read() == 200, "Relaunch lost an inactive destination")
            tabsAgain.open(URL(string: "studio://detail")!)
            try check(tabsAgain.currentEntry.id != aDetail.id && tabsAgain.scrollRestoration(for: tabsAgain.currentEntry).read() == 0, "A fresh deep link reused an old visit")
            let legacy = #"{"selected":"","stacks":{"":{"entries":["/","/detail"],"forward":["/next"]}}}"#
            let upgraded = MavisNavigator(restoring: legacy, canonical: { $0 })
            try check(upgraded.current == "/detail" && upgraded.canGoForward && upgraded.pathEntries[0].id != upgraded.rootEntry.id, "Legacy route snapshots did not migrate")
            upgraded.forward()
            try check(upgraded.current == "/next", "Legacy forward history was lost")

            try await checkScrollView()
            return "Navigation and scroll checks passed"
        }

        private func checkScrollView() async throws {
            let navigator = MavisNavigator(canonical: { $0 })
            let first = navigator.currentEntry
            navigator.recordScroll(320, for: first.id)
            let host = NSHostingView(rootView: AnyView(EmptyView()))
            let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 320, height: 200), styleMask: [.borderless], backing: .buffered, defer: false)
            window.isReleasedWhenClosed = false
            window.contentView = host
            defer { window.close() }

            func show(_ entry: MavisHistoryEntry, height: Double = 2000) {
                host.rootView = AnyView(MavisScreen(scroll: true) {
                    Color.clear.frame(height: height)
                }.environment(\.mavisScrollRestoration, navigator.scrollRestoration(for: entry)).id(entry.id))
                host.layoutSubtreeIfNeeded()
            }
            func findScroll(_ view: NSView) -> NSScrollView? {
                if let scroll = view as? NSScrollView { return scroll }
                return view.subviews.lazy.compactMap(findScroll).first
            }
            func position(_ scroll: NSScrollView) -> Double {
                guard let document = scroll.documentView else { return -1 }
                let extent = max(0, document.bounds.height - scroll.contentView.bounds.height)
                let y = scroll.contentView.bounds.minY - document.bounds.minY
                return document.isFlipped ? y : extent - y
            }
            func move(_ scroll: NSScrollView, to offset: Double) {
                guard let document = scroll.documentView else { return }
                let extent = max(0, document.bounds.height - scroll.contentView.bounds.height)
                let y = document.bounds.minY + (document.isFlipped ? offset : extent - offset)
                scroll.contentView.scroll(to: NSPoint(x: 0, y: y))
                scroll.reflectScrolledClipView(scroll.contentView)
            }

            show(first)
            for _ in 0..<20 {
                await pause(); host.layoutSubtreeIfNeeded()
                if let scroll = findScroll(host), abs(position(scroll) - 320) < 1 { break }
            }
            guard let initialScroll = findScroll(host) else { throw MavisFailure(message: "MScreen made no NSScrollView") }
            try check(abs(position(initialScroll) - 320) < 1, "MScreen restore: expected 320, got \(position(initialScroll))")
            move(initialScroll, to: 480)
            await pause()
            try check(abs(navigator.scrollRestoration(for: first).read() - 480) < 1, "MScreen observe: expected 480, got \(navigator.scrollRestoration(for: first).read())")
            navigator.push("/")
            let second = navigator.currentEntry
            show(second)
            await pause(); host.layoutSubtreeIfNeeded(); await pause()
            guard let nextScroll = findScroll(host) else { throw MavisFailure(message: "New visit made no scroll view") }
            try check(abs(position(nextScroll)) < 1, "New visit: expected 0, got \(position(nextScroll))")
            move(nextScroll, to: 800)
            await pause()
            navigator.back()
            show(first)
            await pause(); host.layoutSubtreeIfNeeded(); await pause()
            guard let returned = findScroll(host) else { throw MavisFailure(message: "Back made no scroll view") }
            try check(abs(position(returned) - 480) < 1, "Back restore: expected 480, got \(position(returned))")
            navigator.forward()
            show(second, height: 400)
            await pause(); host.layoutSubtreeIfNeeded(); await pause()
            guard let shorter = findScroll(host), let document = shorter.documentView else { throw MavisFailure(message: "Forward made no document") }
            let extent = max(0, document.bounds.height - shorter.contentView.bounds.height)
            try check(extent > 0 && extent < 800 && abs(position(shorter) - extent) < 1, "Clamp: extent \(extent), got \(position(shorter))")
            try check(abs(navigator.scrollRestoration(for: second).read() - extent) < 1, "Clamped position was not persisted")
        }
    }

    @MainActor static func services() -> MavisServices { MavisServices(scrollProbe: NativeScrollProbe()) }
}
