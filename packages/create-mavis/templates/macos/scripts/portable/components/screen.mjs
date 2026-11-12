import { flexRuntime } from './flex.mjs'
import { accessibility, viewProps } from './shared.mjs'

// Motion regions and scroll sources come from the Mavis motion API, which has no Mac side yet.
const motion = (name) => (source) =>
  source.fail(
    source.attribute,
    `${name} needs the Mavis motion API, which the Mac does not have yet. Leave it out of a shared MScreen for now.`,
  )

// screenProps: the window's content, a column on the theme background. Web and NativeScript
// make it the page (a <main>, a Page), so a screen is the root of its component's view and its
// component is opened by the app, never shown inside another one. The overlay sits over the
// content and does not scroll; on the Web it lets the pointer through, so it shows content only.
export const MScreen = {
  props: {
    ...viewProps,
    scroll: 'boolean',
    // There is no on-screen keyboard to put away on the Mac.
    dismissKeyboard: 'boolean',
    motionRegion: motion('motionRegion'),
    motionScroll: motion('motionScroll'),
  },
  children: 'elements',
  slots: ['overlay'],
  screen: true,
  uses: [flexRuntime],
  checkChildren({ element, tag, reader, ctx }) {
    const overlay = element.slots?.find((slot) => slot.name === 'overlay')
    if (overlay)
      reader.withoutControls(
        overlay.body,
        ctx.component,
        tag,
        "MScreen's overlay shows content only: the Web and the Mac let the pointer through it, so a button or field there could not be used. Keep controls in the screen's content.",
      )
  },
  declaration:
    'declare function MScreen(props: MavisView & { scroll?: boolean; dismissKeyboard?: boolean; motionRegion?: unknown; motionScroll?: unknown; slotOverlay?: JSX.Element; children?: unknown }): JSX.Element',
  swift(node, context) {
    const { emit, indent, tokens } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const views = (nodes) =>
      nodes.map((childNode) => emit.view(childNode, indent + 4, tokens)).join('\n') ||
      `${pad}    EmptyView()`
    const overlay = node.slots?.find((slot) => slot.name === 'overlay')
    return [
      `${pad}MavisScreen${props.scroll ? `(scroll: ${emit.value(props.scroll)})` : ''} {`,
      views(node.children),
      ...(overlay ? [`${pad}} overlay: {`, views(overlay.body)] : []),
      `${pad}}`,
      ...accessibility(props, context, { container: true }),
    ].join('\n')
  },
  swiftRuntime:
    () => `/// MScreen: the window's content, a column on the theme background that fills the window
/// inside its title bar and toolbar. With scroll the column scrolls vertically and keeps its
/// position while the window shows it. The overlay lies over the content without scrolling and
/// lets the pointer through, as on the Web.
struct MavisScreen<Content: View, Overlay: View>: View {
    var scroll: Bool
    @ViewBuilder var content: () -> Content
    @ViewBuilder var overlay: () -> Overlay

    init(scroll: Bool = false, @ViewBuilder content: @escaping () -> Content, @ViewBuilder overlay: @escaping () -> Overlay) {
        self.scroll = scroll
        self.content = content
        self.overlay = overlay
    }

    var body: some View {
        ZStack(alignment: .topLeading) {
            Group {
                if scroll {
                    ScrollView(.vertical) {
                        MavisColumn { content() }
                            .frame(maxWidth: .infinity, alignment: .topLeading)
                    }
                } else {
                    MavisColumn { content() }
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            // Read before the overlay, as on the Web and NativeScript, wherever the overlay sits.
            .accessibilitySortPriority(1)
            ZStack(alignment: .topLeading) { overlay() }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                .allowsHitTesting(false)
        }
        .background(MavisTokens.background)
    }
}

extension MavisScreen where Overlay == EmptyView {
    init(scroll: Bool = false, @ViewBuilder content: @escaping () -> Content) {
        self.init(scroll: scroll, content: content, overlay: { EmptyView() })
    }
}`,
}
