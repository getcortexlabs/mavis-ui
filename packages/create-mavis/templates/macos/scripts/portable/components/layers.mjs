// The layer over the window's content that sheets, dialogs, popovers and menus open in on the
// Mac, as the Web's top layer and NativeScript's layer host on MScreen. Nothing here is a window
// of its own: the panels are SwiftUI views over the content, drawn with the theme around the
// place they are written at.

/** Swift helpers the overlay components share; written once, before the first that uses them. */
export const layerRuntime = {
  swiftRuntime:
    () => `/// A layer over the window's content: the panel of a sheet or a dialog, a popover, a menu. The
/// place it is written at hands it up, and the content it lies over draws it (see mavisLayers).
struct MavisLayer: Identifiable {
    let id: Namespace.ID
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

/// Whether a layer that takes the whole window is open.
struct MavisModalKey: PreferenceKey {
    static let defaultValue = false
    static func reduce(value: inout Bool, nextValue: () -> Bool) { value = value || nextValue() }
}

/// Draws the layers its content hands up over that content, each filling it. Under a modal layer
/// the content takes no input and assistive technology does not see it, as the page under a modal
/// dialog on the Web. A layer draws the layers written inside it the same way.
private struct MavisLayerHost: ViewModifier {
    @State private var modal = false

    func body(content: Content) -> some View {
        content
            .disabled(modal)
            // An element of its own: hiding it leaves what the content hides itself hidden.
            .accessibilityElement(children: .contain)
            .accessibilityHidden(modal)
            .onPreferenceChange(MavisModalKey.self) { modal = $0 }
            .overlayPreferenceValue(MavisLayerKey.self) { layers in
                GeometryReader { proxy in
                    ZStack(alignment: .topLeading) {
                        ForEach(layers) { layer in
                            layer.content(layer.anchor.map { proxy[$0] } ?? .zero)
                                .modifier(MavisLayerHost())
                        }
                    }
                    .frame(width: proxy.size.width, height: proxy.size.height, alignment: .topLeading)
                }
            }
    }
}

extension View {
    /// On the window's content: sheets, dialogs, popovers and menus written in it open over it.
    func mavisLayers() -> some View { modifier(MavisLayerHost()) }
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

    var body: some View {
        Color.clear
            .frame(width: 0, height: 0)
            .background { if let window { MavisWindowReader(box: window) } }
            .preference(key: MavisLayerKey.self, value: layers)
            .preference(key: MavisModalKey.self, value: modal)
            .accessibilityHidden(true)
            .layoutValue(key: MavisAbsentKey.self, value: true)
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
