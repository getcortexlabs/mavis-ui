// The Swift every generated Mac app carries for navigation: what screens and links call, the
// window's stacks behind them and the views that show a route table. The table itself is
// generated per project (see swift.mjs).

export const navigationRuntime = ({ font }) => `/// What shared screens ask of the app: useMavisNavigation() and every link go through it. The
/// window's navigation puts it in the environment; without one nothing moves.
struct MavisNavigation {
    var push: (String) -> Void = { _ in }
    var replace: (String) -> Void = { _ in }
    var back: () -> Void = {}
    /// Takes "back" before the stack does while the claim owns it; returns what releases it.
    var claimBack: (MavisBackClaim) -> () -> Void = { _ in {} }

    /// What a link does with its destination: a screen of the app is pushed, any other address
    /// opens outside the app.
    @MainActor func follow(_ href: String) {
        let destination = href.trimmingCharacters(in: .whitespacesAndNewlines)
        guard mavisCanFollow(destination) else { return }
        if mavisIsAppDestination(destination) {
            push(destination)
        } else if let url = URL(string: destination) {
            MavisExternalLinks.open(url)
        }
    }
}

private struct MavisNavigationKey: EnvironmentKey {
    static let defaultValue = MavisNavigation()
}

extension EnvironmentValues {
    var mavisNavigation: MavisNavigation {
        get { self[MavisNavigationKey.self] }
        set { self[MavisNavigationKey.self] = newValue }
    }
}

/// Addresses outside the app go to the system. A test run replaces the opener.
@MainActor enum MavisExternalLinks {
    static var open: (URL) -> Void = { NSWorkspace.shared.open($0) }
}

/// Deep links that reach the app some other way than its URL scheme, which onOpenURL hears:
/// every window opens what is sent here.
@MainActor enum MavisDeepLinks {
    static let opened = PassthroughSubject<URL, Never>()
}

/// Something that takes "back" before the stack does, such as an open sheet: the last one that
/// owns it gets the press. The same contract as claimSystemBack on NativeScript.
struct MavisBackClaim {
    let owns: () -> Bool
    let back: () -> Void
}

private struct MavisBackClaimModifier: ViewModifier {
    let active: Bool
    let back: () -> Void
    @Environment(\\.mavisNavigation) private var navigation
    @State private var release: (() -> Void)?

    func body(content: Content) -> some View {
        content
            .onAppear { claim(active) }
            .onChange(of: active) { _, next in claim(next) }
            .onDisappear { claim(false) }
    }

    private func claim(_ wanted: Bool) {
        release?()
        release = wanted ? navigation.claimBack(MavisBackClaim(owns: { true }, back: back)) : nil
    }
}

extension View {
    /// While active, "back" in this window runs the closure instead of leaving the screen:
    /// the toolbar's back button, Command-[ and navigation.back() all ask here first.
    func mavisClaimsBack(_ active: Bool, back: @escaping () -> Void) -> some View {
        modifier(MavisBackClaimModifier(active: active, back: back))
    }
}

/// Whether an href names a screen of the app, as isAppDestination of the Mavis core decides.
func mavisIsAppDestination(_ href: String) -> Bool {
    if href.contains("\\\\") || href.hasPrefix("//") { return false }
    guard let colon = href.firstIndex(of: ":") else { return true }
    let scheme = href[..<colon]
    guard let first = scheme.first, first.isASCII, first.isLetter else { return true }
    return !scheme.allSatisfy { $0.isASCII && ($0.isLetter || $0.isNumber || "+.-".contains($0)) }
}

/// What the links of every target refuse: nothing, control characters and addresses that run script.
func mavisCanFollow(_ href: String) -> Bool {
    guard !href.isEmpty, !href.unicodeScalars.contains(where: { $0.value < 0x20 || $0.value == 0x7F }) else { return false }
    let lower = href.lowercased()
    return !["javascript:", "data:", "vbscript:"].contains { lower.hasPrefix($0) }
}

/// The href a custom-scheme address names: app://places/garden and app:/places/garden are both
/// /places/garden, with the query string kept.
func mavisHref(_ url: URL) -> String {
    let components = URLComponents(url: url, resolvingAgainstBaseURL: false)
    let host = components?.encodedHost ?? ""
    var href = (host.isEmpty ? "" : "/" + host) + (components?.percentEncodedPath ?? "")
    if href.isEmpty { href = "/" }
    if let query = components?.percentEncodedQuery, !query.isEmpty { href += "?" + query }
    return href
}

/// An href taken apart: the segments of its path and its query string, decoded.
struct MavisLocation {
    /// Nil for a path no route can have: one that is not absolute, or has an empty segment.
    let segments: [String]?
    let query: [String: String]
    let href: String

    init(_ href: String) {
        let written = href.trimmingCharacters(in: .whitespacesAndNewlines)
        self.href = written
        let address = written.split(separator: "#", maxSplits: 1, omittingEmptySubsequences: false).first.map(String.init) ?? ""
        let parts = address.split(separator: "?", maxSplits: 1, omittingEmptySubsequences: false).map(String.init)
        var query: [String: String] = [:]
        if parts.count > 1 {
            for pair in parts[1].split(separator: "&") {
                let sides = pair.split(separator: "=", maxSplits: 1, omittingEmptySubsequences: false).map(String.init)
                let name = MavisLocation.decode(sides[0], plus: true)
                if query[name] == nil { query[name] = MavisLocation.decode(sides.count > 1 ? sides[1] : "", plus: true) }
            }
        }
        self.query = query
        let path = parts.first ?? ""
        guard path.hasPrefix("/") else {
            segments = nil
            return
        }
        var pieces = path.dropFirst().split(separator: "/", omittingEmptySubsequences: false).map(String.init)
        if pieces.last == "" { pieces.removeLast() }
        segments = pieces.contains("") ? nil : pieces.map { MavisLocation.decode($0, plus: false) }
    }

    private static func decode(_ text: String, plus: Bool) -> String {
        let spaced = plus ? text.replacingOccurrences(of: "+", with: " ") : text
        return spaced.removingPercentEncoding ?? spaced
    }

    private static let unreserved = CharacterSet(charactersIn: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~")

    private static func encode(_ text: String) -> String {
        text.addingPercentEncoding(withAllowedCharacters: unreserved) ?? text
    }

    /// The href of a path and of the query values that are there.
    static func href(_ segments: [String], _ query: [(String, String?)] = []) -> String {
        let path = "/" + segments.map(encode).joined(separator: "/")
        let pairs = query.compactMap { name, value in value.map { encode(name) + "=" + encode($0) } }
        return pairs.isEmpty ? path : path + "?" + pairs.joined(separator: "&")
    }
}

/// The app's route table, as the generated MavisRoute writes it: the route an href opens, the
/// href that names it again and the screen it shows.
protocol MavisRouting: Hashable {
    associatedtype Screen: View
    init(href: String)
    var href: String { get }
    @MainActor @ViewBuilder var screen: Screen { get }
}

/// A top-level place of the app, with a stack of screens of its own.
struct MavisDestination: Identifiable, Equatable {
    let id: String
    let label: String
    let href: String
}

/// How the window offers its destinations: a sidebar, or a selection in the toolbar.
enum MavisDestinationStyle {
    case sidebar, toolbar
}

/// The stacks of one window, by href: one stack, or one for each destination with the selected
/// one in front. Back keeps what it leaves so Forward can return to it, like a browser. Each
/// host owns its router; this is the Mac's.
@MainActor final class MavisNavigator: ObservableObject {
    private struct Stack: Codable, Equatable {
        var entries: [String]
        var forward: [String] = []
    }

    private struct Stored: Codable {
        var selected: String
        var stacks: [String: Stack]
    }

    let destinations: [MavisDestination]
    @Published private(set) var selected: String
    @Published private var stacks: [String: Stack]
    private let canonical: (String) -> String
    private var claims: [(id: Int, claim: MavisBackClaim)] = []
    private var serial = 0

    /// stored is what an earlier window left in its store; canonical turns an href into the one
    /// its route writes.
    init(destinations: [MavisDestination] = [], restoring stored: String = "", canonical: @escaping (String) -> String) {
        self.destinations = destinations
        self.canonical = canonical
        let ids = destinations.isEmpty ? [""] : destinations.map(\\.id)
        var stacks: [String: Stack] = [:]
        for id in ids {
            stacks[id] = Stack(entries: [canonical(destinations.first { $0.id == id }?.href ?? "/")])
        }
        var selected = ids[0]
        if let data = stored.data(using: .utf8), let saved = try? JSONDecoder().decode(Stored.self, from: data) {
            for id in ids {
                guard let stack = saved.stacks[id], !stack.entries.isEmpty else { continue }
                stacks[id] = Stack(entries: stack.entries.map(canonical), forward: stack.forward.map(canonical))
            }
            if ids.contains(saved.selected) { selected = saved.selected }
        }
        self.stacks = stacks
        self.selected = selected
    }

    private var stack: Stack {
        get { stacks[selected] ?? Stack(entries: [canonical("/")]) }
        set { stacks[selected] = newValue }
    }

    /// The screen under the selected stack, and the screens pushed over it.
    var root: String { stack.entries[0] }
    var path: [String] { Array(stack.entries.dropFirst()) }
    var current: String { stack.entries[stack.entries.count - 1] }
    var canGoBack: Bool { stack.entries.count > 1 }
    var canGoForward: Bool { !stack.forward.isEmpty }

    /// What restores this window: every stack and the destination in front.
    var stored: String {
        let encoder = JSONEncoder()
        encoder.outputFormatting = .sortedKeys
        guard let data = try? encoder.encode(Stored(selected: selected, stacks: stacks)) else { return "" }
        return String(data: data, encoding: .utf8) ?? ""
    }

    /// What screens and links in this window call.
    var api: MavisNavigation {
        MavisNavigation(
            push: { [weak self] href in self?.push(href) },
            replace: { [weak self] href in self?.replace(href) },
            back: { [weak self] in self?.back() },
            claimBack: { [weak self] claim in self?.claimBack(claim) ?? {} }
        )
    }

    private func destination(at href: String) -> MavisDestination? {
        destinations.first { canonical($0.href) == href }
    }

    /// A new screen over the current one. The href of a destination selects it instead, as it
    /// was left; when it is already in front it goes back to its first screen.
    func push(_ href: String) {
        let target = canonical(href)
        if let destination = destination(at: target) {
            if destination.id == selected { home() } else { selected = destination.id }
            return
        }
        stack.entries.append(target)
        stack.forward = []
    }

    /// The current screen gives way to another one. The href of a destination selects it.
    func replace(_ href: String) {
        let target = canonical(href)
        if let destination = destination(at: target) {
            if destination.id == selected { home() } else { selected = destination.id }
            return
        }
        stack.entries[stack.entries.count - 1] = target
    }

    /// Back: whatever claims it first, then the screen below.
    func back() {
        if yieldsBack() { return }
        guard canGoBack else { return }
        stack.forward.append(stack.entries.removeLast())
    }

    func forward() {
        guard let next = stack.forward.popLast() else { return }
        stack.entries.append(next)
    }

    /// Puts a destination in front, with its stack as it was left.
    func select(_ id: String) {
        if stacks[id] != nil, id != selected { selected = id }
    }

    private func home() {
        guard canGoBack else { return }
        stack.forward.append(contentsOf: stack.entries.dropFirst().reversed())
        stack.entries = [stack.entries[0]]
    }

    /// What the stack's own back button leaves: the path SwiftUI now shows.
    func sync(_ path: [String]) {
        let entries = [root] + path
        guard entries != stack.entries else { return }
        if entries.count < stack.entries.count, Array(stack.entries.prefix(entries.count)) == entries {
            if yieldsBack() {
                objectWillChange.send()
                return
            }
            stack.forward.append(contentsOf: stack.entries.dropFirst(entries.count).reversed())
        } else {
            stack.forward = []
        }
        stack.entries = entries
    }

    /// A deep link: the screen its address names over the first screen of the stack in front,
    /// or the destination it is.
    func open(_ url: URL) {
        let target = canonical(mavisHref(url))
        if let destination = destination(at: target) {
            selected = destination.id
            stack = Stack(entries: [stack.entries[0]])
            return
        }
        let first = canonical(destinations.first { $0.id == selected }?.href ?? "/")
        stack = Stack(entries: target == first ? [first] : [first, target])
    }

    /// The one place the stack asks whether something else owns back.
    private func yieldsBack() -> Bool {
        guard let claim = claims.last(where: { $0.claim.owns() })?.claim else { return false }
        claim.back()
        return true
    }

    func claimBack(_ claim: MavisBackClaim) -> () -> Void {
        serial += 1
        let id = serial
        claims.append((id, claim))
        return { [weak self] in self?.claims.removeAll { $0.id == id } }
    }
}

/// Where a window keeps its route between launches.
struct MavisNavigationStore {
    let read: () -> String
    let write: (String) -> Void
}

@MainActor private enum MavisLaunch {
    private static var restored = false

    /// What the last window left, for the first window of this launch only.
    static func first(_ value: String) -> String {
        defer { restored = true }
        return restored ? "" : value
    }
}

/// A window's own store: its scene's storage, which macOS restores with the window, and for
/// the first window after a launch what the last one left.
private struct MavisSceneStore<Content: View>: View {
    @SceneStorage("mavisNavigation") private var scene = ""
    @AppStorage("mavisNavigationLast") private var last = ""
    @ViewBuilder var content: (MavisNavigationStore) -> Content

    var body: some View {
        let stored = scene.isEmpty ? MavisLaunch.first(last) : scene
        content(MavisNavigationStore(read: { stored }, write: { next in
            scene = next
            last = next
        }))
    }
}

struct MavisScreenTitleKey: PreferenceKey {
    static var defaultValue: String? { nil }
    static func reduce(value: inout String?, nextValue: () -> String?) { value = value ?? nextValue() }
}

extension View {
    /// The screen's title: its first level-one heading names the window.
    func mavisScreenTitle(_ title: String) -> some View {
        preference(key: MavisScreenTitleKey.self, value: title)
    }
}

/// The app's name, for a screen without a title of its own.
let mavisAppName = Bundle.main.object(forInfoDictionaryKey: "CFBundleName") as? String ?? ProcessInfo.processInfo.processName

/// A screen of the stack: its title names the window.
private struct MavisRouteScreen<Content: View>: View {
    @ViewBuilder var content: () -> Content
    @State private var title: String?

    var body: some View {
        content()
            .onPreferenceChange(MavisScreenTitleKey.self) { next in title = next }
            .navigationTitle(title ?? mavisAppName)
    }
}

/// The window's navigation: a stack of the route table's screens with the toolbar's back
/// button, or with top-level destinations one stack each behind a sidebar or a toolbar
/// selection. Without a store the window keeps its route in its scene.
struct MavisNavigationView<Route: MavisRouting>: View {
    var store: MavisNavigationStore? = nil
    var destinations: [MavisDestination] = []
    var style: MavisDestinationStyle = .sidebar

    var body: some View {
        if let store {
            MavisNavigationWindow<Route>(store: store, destinations: destinations, style: style)
        } else {
            MavisSceneStore { store in
                MavisNavigationWindow<Route>(store: store, destinations: destinations, style: style)
            }
        }
    }
}

@MainActor private struct MavisNavigationWindow<Route: MavisRouting>: View {
    @StateObject private var navigator: MavisNavigator
    @Environment(\\.accessibilityReduceMotion) private var reduceMotion
    private let store: MavisNavigationStore
    private let style: MavisDestinationStyle

    init(store: MavisNavigationStore, destinations: [MavisDestination], style: MavisDestinationStyle) {
        self.store = store
        self.style = style
        _navigator = StateObject(wrappedValue: MavisNavigator(destinations: destinations, restoring: store.read(), canonical: { Route(href: $0).href }))
    }

    var body: some View {
        content
            .environment(\\.mavisNavigation, navigator.api)
            .focusedSceneObject(navigator)
            .onOpenURL { url in navigator.open(url) }
            .onReceive(MavisDeepLinks.opened) { url in navigator.open(url) }
            .onChange(of: navigator.stored) { _, next in store.write(next) }
    }

    private var selection: Binding<String> {
        Binding(get: { navigator.selected }, set: { navigator.select($0) })
    }

    @ViewBuilder private var content: some View {
        if navigator.destinations.isEmpty {
            stack
        } else if style == .toolbar {
            stack.toolbar {
                ToolbarItem(placement: .principal) {
                    Picker("", selection: selection) {
                        ForEach(navigator.destinations) { destination in
                            Text(verbatim: destination.label).tag(destination.id)
                        }
                    }
                    .pickerStyle(.segmented)
                    .labelsHidden()
                }
            }
        } else {
            NavigationSplitView {
                List(selection: Binding<String?>(get: { navigator.selected }, set: { id in if let id { navigator.select(id) } })) {
                    ForEach(navigator.destinations) { destination in
                        Text(verbatim: destination.label)
                            .tag(destination.id)
                            .accessibilityIdentifier("mavis-destination:" + destination.id)
                    }
                }
                .navigationSplitViewColumnWidth(min: 180, ideal: 220)
            } detail: {
                stack
            }
        }
    }

    // The typed path of the stack in front. A plain transition; none under Reduce Motion.
    private var stack: some View {
        NavigationStack(path: Binding(get: { navigator.path.map(Route.init(href:)) }, set: { path in navigator.sync(path.map(\\.href)) })) {
            MavisRouteScreen { Route(href: navigator.root).screen }
                .id(navigator.root)
                .navigationDestination(for: Route.self) { route in
                    MavisRouteScreen { route.screen }
                }
        }
        .id(navigator.selected)
        .transaction { transaction in
            if reduceMotion { transaction.disablesAnimations = true }
        }
    }
}

/// The Go menu: Back and Forward with Command-[ and Command-], and the top-level destinations
/// with Command-1 to Command-9. It acts on the window in front.
struct MavisNavigationCommands: Commands {
    @FocusedObject private var navigator: MavisNavigator?

    var body: some Commands {
        CommandMenu("Go") {
            Button("Back") { navigator?.back() }
                .keyboardShortcut("[", modifiers: .command)
                .disabled(!(navigator?.canGoBack ?? false))
            Button("Forward") { navigator?.forward() }
                .keyboardShortcut("]", modifiers: .command)
                .disabled(!(navigator?.canGoForward ?? false))
            if let navigator, !navigator.destinations.isEmpty {
                Divider()
                ForEach(Array(navigator.destinations.enumerated()), id: \\.element.id) { index, destination in
                    Button(destination.label) { navigator.select(destination.id) }
                        .keyboardShortcut(index < 9 ? KeyboardShortcut(KeyEquivalent(Character(String(index + 1))), modifiers: .command) : nil)
                }
            }
        }
    }
}

private struct MavisLinkPointer: ViewModifier {
    func body(content: Content) -> some View {
        if #available(macOS 15.0, *) {
            content.pointerStyle(.link)
        } else {
            content
        }
    }
}

/// MLink: the theme's primary color and an underline, as tall as a control unless inline. A
/// column stretches it and keeps its text in the middle, as on the Web.
struct MavisLinkStyle: ButtonStyle {
    var inline: Bool = false
    @Environment(\\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(${font('body')})
            .foregroundStyle(MavisTokens.primary)
            .multilineTextAlignment(.center)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, minHeight: inline ? nil : 44)
            .contentShape(Rectangle())
            .opacity(isEnabled ? 1 : 0.45)
            .modifier(MavisLinkPointer())
    }
}

/// MLink: text that goes somewhere, read as a link.
struct MavisLink: View {
    let text: String
    var inline: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: action) { Text(verbatim: text).underline() }
            .buttonStyle(MavisLinkStyle(inline: inline))
            .mavisLinkRole()
    }
}

extension View {
    /// A control with an href is a link to assistive technology, as it is on the Web.
    func mavisLinkRole() -> some View {
        accessibilityRemoveTraits(.isButton).accessibilityAddTraits(.isLink)
    }
}`
