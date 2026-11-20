import {
  motionRegionComposable,
  motionRegionTypes,
  motionRegionRuntime,
  motionRegionReference,
  whenMotionComposable,
} from './motion-region.mjs'
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

// motionBoxContract: layers in one area, the last drawn on top. The Web lays them out in one
// grid cell and NativeScript in one GridLayout cell: each layer fills the box, and without a
// height the box is as tall as its tallest layer.
export const MBox = {
  macos: { rejectedProps: ['perspective'] },
  props: {
    ...boxProps,
    motionSurface: motionSurfaceReference,
    motionRegion: motionRegionReference,
    perspective: motion('perspective'),
  },
  children: 'elements',
  uses: [flexRuntime, motionRuntime, motionSurfaceRuntime, motionRegionRuntime],
  composable: motionSurfaceComposable,
  composables: [motionRegionComposable, whenMotionComposable],
  types: () => motionSurfaceTypes + motionRegionTypes,
  declaration:
    'declare function MBox(props: MavisBox & { motionSurface?: unknown; motionRegion?: unknown; perspective?: number; children?: unknown }): JSX.Element',
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
      `${pad}    .environment(\\.mavisInFlex, true)`,
      ...padding(props, context),
      ...background(props, context),
      ...accessibility(props, context, { container: true }),
      ...flexItem(props, context),
      ...(props.motionRegion
        ? [`${pad}    .mavisMotionRegion(self.${props.motionRegion.ref})`]
        : []),
      ...(props.motionSurface
        ? [`${pad}    .mavisMotionSurface(self.${props.motionSurface.ref})`]
        : []),
    ].join('\n')
  },
  vue: {
    attribute: (name, value) =>
      ['motionSurface', 'motionRegion'].includes(name) ? `:${name}="${value.ref}"` : undefined,
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
        let height = offered(proposal.height)
        let sizes = subviews.map { subview in
            let item = subview[MavisFlexItemKey.self]
            return subview.sizeThatFits(ProposedViewSize(
                width: item.width.resolved(in: width) ?? width,
                height: item.height.resolved(in: height)
            ))
        }
        return CGSize(
            width: width ?? sizes.map(\\.width).max() ?? 0,
            height: height ?? sizes.map(\\.height).max() ?? 0
        )
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        for subview in subviews {
            let item = subview[MavisFlexItemKey.self]
            subview.place(at: bounds.origin, anchor: .topLeading, proposal: ProposedViewSize(
                width: item.width.resolved(in: bounds.width) ?? bounds.width,
                height: item.height.resolved(in: bounds.height) ?? bounds.height
            ))
        }
    }
}`,
}
