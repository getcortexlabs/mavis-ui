import {
  motionSurfaceComposable,
  motionSurfaceTypes,
  motionSurfaceReference,
  motionSurfaceRuntime,
} from './motion-surface.mjs'
import { motionRuntime } from './motion.mjs'
import { flexRuntime } from './flex.mjs'
import { accessibility, background, boxProps, flexItem, padding } from './shared.mjs'

// What the Mavis motion API does on a box; the Mac does not have it yet.
const motion = (name) => (source) =>
  source.fail(
    source.attribute,
    `${name} needs the Mavis motion API, which the Mac does not have yet. Leave it out of a shared MBox for now.`,
  )

// A layer that fills the box in both directions is placed the same way everywhere.
const fills = (dimension) => !dimension || ('lit' in dimension && dimension.lit === '100%')

// motionBoxContract: layers in one area, the last drawn on top. The Web lays them out in one
// grid cell and NativeScript in one GridLayout cell: each layer fills the box, and without a
// height the box is as tall as its tallest layer.
export const MBox = {
  props: {
    ...boxProps,
    motionSurface: motionSurfaceReference,
    motionRegion: motion('motionRegion'),
    perspective: motion('perspective'),
  },
  children: 'elements',
  uses: [flexRuntime, motionRuntime, motionSurfaceRuntime],
  composable: motionSurfaceComposable,
  types: () => motionSurfaceTypes,
  declaration:
    'declare function MBox(props: MavisBox & { motionSurface?: unknown; motionRegion?: unknown; perspective?: number; children?: unknown }): JSX.Element',
  checkChildren({ element, tag, fail }) {
    // The Web puts a layer of its own size at the top left of the grid cell; NativeScript
    // centres it in the GridLayout cell.
    if (
      element.children.some(
        (child) =>
          child.v === 'element' && !(fills(child.props.width) && fills(child.props.height)),
      )
    )
      fail(
        tag,
        'A layer of MBox with its own width or height sits at the top left on the Web and in the middle on NativeScript. Make the layer an MColumn or MRow that fills the box, and place the sized content in it with align and justify.',
      )
  },
  swift(node, context) {
    const { emit, indent, tokens } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const body =
      node.children.map((childNode) => emit.view(childNode, indent + 4, tokens)).join('\n') ||
      `${pad}    EmptyView()`
    return [
      `${pad}MavisLayers {`,
      body,
      `${pad}}`,
      ...padding(props, context),
      ...background(props, context),
      ...accessibility(props, context, { container: true }),
      ...flexItem(props, context),
      ...(props.motionSurface
        ? [`${pad}    .mavisMotionSurface(self.${props.motionSurface.ref})`]
        : []),
    ].join('\n')
  },
  vue: {
    attribute: (name, value) =>
      name === 'motionSurface' ? `:motionSurface="${value.ref}"` : undefined,
  },
  swiftRuntime:
    () => `/// MBox: layers in one area, the last drawn on top. Each layer is offered the whole area and
/// placed at its top leading corner, so a layer that fills it covers it, as in the Web's grid
/// cell and NativeScript's GridLayout cell. The box takes the size it is offered, and without one
/// the width of its widest layer and the height of its tallest.
struct MavisLayers: Layout {
    private func offered(_ value: CGFloat?) -> CGFloat? {
        guard let value, value.isFinite else { return nil }
        return max(0, value)
    }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = offered(proposal.width)
        let sizes = subviews.map { $0.sizeThatFits(ProposedViewSize(width: width, height: nil)) }
        return CGSize(
            width: width ?? sizes.map(\\.width).max() ?? 0,
            height: offered(proposal.height) ?? sizes.map(\\.height).max() ?? 0
        )
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        for subview in subviews {
            subview.place(at: bounds.origin, anchor: .topLeading, proposal: ProposedViewSize(bounds.size))
        }
    }
}`,
}
