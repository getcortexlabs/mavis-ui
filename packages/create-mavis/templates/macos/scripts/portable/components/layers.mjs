// The layer over the window's content that sheets, dialogs, popovers and menus open in on the
// Mac, as the Web's top layer and NativeScript's layer host on MScreen. Nothing here is a window
// of its own: the panels are SwiftUI views over the content, drawn with the theme around the
// place they are written at.

/** Swift helpers the overlay components share; written once, before the first that uses them. */
export const layerRuntime = {
  swiftRuntime: ({
    theme,
  }) => `/// A layer over the window's content: the panel of a sheet or a dialog, a popover, a menu. The
/// place it is written at hands it up, and the window's content draws it (see mavisLayers).
struct MavisLayer: Identifiable {
    let id: Namespace.ID
    /// How deep it is written: 1 in the window's content, 2 in a layer over it, and so on.
    var level = 1
    /// The control a layer opens beside.
    var anchor: Anchor<CGRect>? = nil
    /// The layer, given where its anchor is in the area it fills.
    let content: (CGRect) -> AnyView
}

struct MavisLayerKey: PreferenceKey {
    static let defaultValue: [MavisLayer] = []
    static func reduce(value: inout [MavisLayer], nextValue: () -> [MavisLayer]) {
        value.append(contentsOf: nextValue())
    }
}

/// The deepest level at which a layer that takes the whole window is open; 0 with none.
struct MavisModalKey: PreferenceKey {
    static let defaultValue = 0
    static func reduce(value: inout Int, nextValue: () -> Int) { value = Swift.max(value, nextValue()) }
}

private struct MavisLayerLevelKey: EnvironmentKey {
    static let defaultValue = 1
}

extension EnvironmentValues {
    /// The level of the layers written here: one more inside each layer.
    var mavisLayerLevel: Int {
        get { self[MavisLayerLevelKey.self] }
        set { self[MavisLayerLevelKey.self] = newValue }
    }
}

/// Draws the layers of one level over everything below it: the window's content and the layers
/// of the levels before. Under a modal layer what is below takes no input and assistive
/// technology does not see it, as the page under a modal dialog on the Web.
private struct MavisLayerHost: ViewModifier {
    let level: Int
    @State private var modal = 0

    func body(content: Content) -> some View {
        content
            .disabled(modal >= level)
            // An element of its own: hiding it leaves what the content hides itself hidden.
            .accessibilityElement(children: .contain)
            .accessibilityHidden(modal >= level)
            .onPreferenceChange(MavisModalKey.self) { modal = $0 }
            .overlayPreferenceValue(MavisLayerKey.self) { layers in
                GeometryReader { proxy in
                    ZStack(alignment: .topLeading) {
                        ForEach(layers.filter { $0.level == level }) { layer in
                            layer.content(layer.anchor.map { proxy[$0] } ?? .zero)
                        }
                    }
                    .frame(width: proxy.size.width, height: proxy.size.height, alignment: .topLeading)
                    .environment(\\.mavisLayerLevel, level + 1)
                }
            }
    }
}

extension View {
    /// On the window's content: sheets, dialogs, popovers and menus written in it open over it,
    /// and those written inside one of them over that one, four levels deep.
    func mavisLayers() -> some View {
        modifier(MavisLayerHost(level: 1))
            .modifier(MavisLayerHost(level: 2))
            .modifier(MavisLayerHost(level: 3))
            .modifier(MavisLayerHost(level: 4))
    }
}

/// The window a view is in, asked when motion starts. Jolt's clock follows the displays of the
/// windows on screen: in a window that is not shown a value would never arrive, so a layer
/// settles at once there.
final class MavisWindowBox {
    weak var view: NSView?
    var onScreen: Bool {
        guard let window = view?.window else { return false }
        return window.isVisible && !window.isMiniaturized && window.occlusionState.contains(.visible)
    }
}

private struct MavisWindowReader: NSViewRepresentable {
    let box: MavisWindowBox
    func makeNSView(context: Context) -> NSView {
        let view = NSView()
        box.view = view
        return view
    }
    func updateNSView(_ view: NSView, context: Context) { box.view = view }
}

/// Where a layer is written. It takes no room, none of a stack's spacing either, and hands the
/// layer up while it is presented.
struct MavisLayerSite: View {
    var layers: [MavisLayer] = []
    var modal = false
    var window: MavisWindowBox? = nil
    @Environment(\\.mavisLayerLevel) private var level

    var body: some View {
        Color.clear
            .frame(width: 0, height: 0)
            .background { if let window { MavisWindowReader(box: window) } }
            .preference(key: MavisLayerKey.self, value: layers.map { MavisLayer(id: $0.id, level: level, anchor: $0.anchor, content: $0.content) })
            .preference(key: MavisModalKey.self, value: modal ? level : 0)
            .accessibilityHidden(true)
            .layoutValue(key: MavisAbsentKey.self, value: true)
    }
}

/// How a panel enters and leaves: the theme's enter and exit motion as Jolt's presets, the ones
/// the Web and NativeScript run.
enum MavisLayerMotion {
    static let enter = JoltPreset.fadeInUp.recipe((try? JoltPresetParameters(distance: ${theme.motion.enterOffset}, duration: ${theme.motion.enterDuration})) ?? .none)
    static let leave = JoltPreset.fadeOut.recipe((try? JoltPresetParameters(duration: ${theme.motion.exitDuration})) ?? .none)
    static let fade = (try? JoltTransition.tween(milliseconds: ${theme.motion.enterDuration})) ?? .spring(.smooth)
    static let hidden = (try? JoltPose(opacity: 0)) ?? .identity
}

extension MavisThemeScope {
    /// The same theme with some colors drawn as others, as the Web recolors a destructive action.
    func recolored(_ changes: [MavisToken: MavisToken]) -> MavisThemeScope {
        var argb = palette.argb
        for (token, source) in changes { argb[token] = palette.argb[source] }
        var next = self
        next.palette = MavisPalette(name: palette.name, appearance: palette.appearance, argb: argb)
        return next
    }
}

/// The heights of the parts a panel measures, by name.
struct MavisHeightsKey: PreferenceKey {
    static let defaultValue: [String: CGFloat] = [:]
    static func reduce(value: inout [String: CGFloat], nextValue: () -> [String: CGFloat]) {
        value.merge(nextValue()) { $1 }
    }
}

extension View {
    func mavisMeasured(_ name: String) -> some View {
        background(GeometryReader { proxy in
            Color.clear.preference(key: MavisHeightsKey.self, value: [name: proxy.size.height])
        })
    }
}`,
}
