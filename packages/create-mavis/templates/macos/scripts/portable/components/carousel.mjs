// MCarousel: one slide at a time, chosen with the arrows, the numbered indicators, the keyboard
// or a drag. The Web and NativeScript build it from the same parts (createCarousel in the core).
import { flexRuntime } from './flex.mjs'
import { swiftGlyph } from './icon.mjs'

// items: records the carousel keys by one of their fields.
function items({ attribute, value, ctx, expr, fail }) {
  const list = expr(value, ctx)
  if (list.type.k !== 'array' || list.type.of.k !== 'record')
    fail(attribute, 'MCarousel takes a list of records, such as { id: string; title: string }[].')
  return { expr: list, record: list.type.of.name }
}

// The key is a field of every item, written out: the active slide is the one with that key.
function itemKey({ attribute, value, fail, ts }) {
  if (!ts.isStringLiteral(value))
    fail(attribute, 'itemKey names a field of the items, written out: itemKey="id".')
  return { lit: value.text }
}

const keyField = (props, fields) =>
  fields(props.items.record).find((field) => field.name === (props.itemKey?.lit ?? 'id'))

const labels = ['previousLabel', 'nextLabel', 'slideLabel']

// carouselProps. value and onChange are the contract's modelValue: the key of the slide in view.
export const MCarousel = {
  props: {
    id: 'string',
    label: 'string',
    items,
    itemKey,
    value: 'optional-string',
    onChange: 'string-handler',
    disabled: 'boolean',
    loop: 'boolean',
    previousLabel: 'string',
    nextLabel: 'string',
    slideLabel: 'string',
    emptyLabel: 'string',
  },
  required: ['label', 'items', 'value', 'onChange'],
  slots: ['default', 'empty'],
  scoped: {
    default: (props, { T }) => [
      { name: 'item', type: T.record(props.items.record) },
      { name: 'index', type: T.number },
      { name: 'itemKey', type: T.string },
    ],
  },
  uses: [flexRuntime],
  declaration:
    'declare function MCarousel<T>(props: { id?: string; label: string; items: readonly T[]; itemKey?: Extract<keyof T, string>; value: string | undefined; onChange: (value: string) => void; disabled?: boolean; loop?: boolean; previousLabel?: string; nextLabel?: string; slideLabel?: string; emptyLabel?: string; slotEmpty?: JSX.Element; children?: (props: { item: T; index: number; itemKey: string }) => JSX.Element }): JSX.Element',
  check({ tag, props, attrs, fail, fields }) {
    const key = keyField(props, fields)
    // value and onChange carry the key, and they are text on the Mac.
    if (!key || key.type.k !== 'string')
      fail(
        attrs.get('itemKey') ?? tag,
        `Every slide needs the key ${props.itemKey?.lit ?? 'id'}, a string: name another field with itemKey.`,
      )
    props.items.key = key.name
  },
  checkChildren({ element, tag, fail }) {
    // A slide is layers in one area, like an MBox's: the Web puts a layer of its own size at
    // the top left and NativeScript in the middle.
    const sized = (dimension) => dimension && !('lit' in dimension && dimension.lit === '100%')
    const slide = element.slots?.find((slot) => slot.name === 'default')
    if (
      slide?.body.some(
        (child) => child.v === 'element' && (sized(child.props.width) || sized(child.props.height)),
      )
    )
      fail(
        tag,
        'A slide of MCarousel fills it: content with its own width or height sits at the top left on the Web and in the middle on NativeScript. Make the slide an MColumn or MRow and place the sized content in it.',
      )
  },
  swift(node, context) {
    const { emit, indent, tokens } = context
    const pad = ' '.repeat(indent)
    const props = node.props
    const slide = node.slots?.find((slot) => slot.name === 'default')
    const empty = node.slots?.find((slot) => slot.name === 'empty')
    const key = props.items.key
    const taken = (index, fallback) =>
      slide && !slide.params[index].unused ? slide.params[index].name : fallback
    const item = taken(0, 'mavisItem')
    const index = taken(1, 'mavisIndex')
    const views = (nodes) =>
      nodes.map((child) => emit.view(child, indent + 8, tokens)).join('\n') ||
      `${pad}        EmptyView()`
    // A slide is a row of a list: fields in it take focus per item.
    emit.forKeys.push(`${item}.${key}`)
    const content = slide ? views(slide.body) : `${pad}        EmptyView()`
    emit.forKeys.pop()
    const args = [
      `label: ${emit.value(props.label)}`,
      `items: ${emit.expr(props.items.expr)}`,
      `key: { $0.${key} }`,
      `value: ${emit.expr(props.value.expr)}`,
      `onChange: ${emit.handler(props.onChange, indent + 4)}`,
      ...['disabled', 'loop', ...labels]
        .filter((name) => props[name])
        .map((name) => `${name}: ${emit.value(props[name])}`),
    ].map((arg) => `${pad}    ${arg}`)
    return [
      `${pad}MavisCarousel(`,
      [
        ...args,
        `${pad}    empty: {\n${
          empty
            ? views(empty.body)
            : `${pad}        Text(verbatim: ${props.emptyLabel ? emit.value(props.emptyLabel) : '"No slides"'})\n${pad}            .font(${tokens.font('body')})\n${pad}            .foregroundStyle(${tokens.color('muted')})`
        }\n${pad}    }`,
        `${pad}    slide: { (${item}: ${props.items.record}, ${index}: Double) in\n${
          slide && !slide.params[2].unused
            ? `${pad}        let ${slide.params[2].name} = ${item}.${key}\n`
            : ''
        }${content}\n${pad}    }`,
      ].join(',\n'),
      `${pad})`,
      ...(props.id ? [`${pad}    .mavisIdentifier(${emit.value(props.id)})`] : []),
    ].join('\n')
  },
  swiftRuntime({ theme, font, metric, motion, scoped }) {
    const settle = theme.motion.enterDuration * 1.8
    return `/// MCarousel: the label and the position, the slide in view and the controls under it. Only
/// the slide in view exists. It enters through Jolt from the side it comes from, follows a drag
/// through Jolt's drag and returns unless it was dragged far enough to change.
struct MavisCarousel<Item: Hashable, Slide: View, Empty: View>: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let label: String
    let items: [Item]
    let key: (Item) -> String
    let value: String?
    let onChange: (String) -> Void
    var disabled: Bool = false
    var loop: Bool = false
    var previousLabel: String = "Previous slide"
    var nextLabel: String = "Next slide"
    var slideLabel: String = "Slide"
    @ViewBuilder let empty: () -> Empty
    @ViewBuilder let slide: (Item, Double) -> Slide
    @StateObject private var drag = ${scoped ? 'MavisThemedCarouselDrag()' : 'try! JoltDragModel(bounds: MavisCarouselDrag.free, snaps: [.zero], transition: MavisCarouselDrag.settle)'}
    @State private var direction = 1.0
    @State private var moved = false
    @FocusState private var focused: Bool
    @Environment(\\.layoutDirection) private var reading

    private var index: Int { Swift.max(0, items.firstIndex { key($0) == value } ?? 0) }
    private var still: Bool { disabled || items.count < 2 }

    private func choose(_ next: Int) {
        guard !disabled, next != index, items.indices.contains(next) else { return }
        onChange(key(items[next]))
    }

    private func move(_ amount: Int) {
        guard !items.isEmpty else { return }
        choose(loop ? (index + amount + items.count) % items.count : Swift.min(items.count - 1, Swift.max(0, index + amount)))
    }

    private func key(_ press: KeyPress) -> KeyPress.Result {
        guard press.modifiers.isDisjoint(with: [.option, .control, .command]) else { return .ignored }
        let forward = press.key == .rightArrow ? 1 : press.key == .leftArrow ? -1 : 0
        guard forward != 0 else { return .ignored }
        move(forward * (reading == .rightToLeft ? -1 : 1))
        return .handled
    }

    private var position: String { items.isEmpty ? "0 / 0" : "\\(index + 1) / \\(items.count)" }

    private func arrow(_ glyph: String, _ name: String, off: Bool, _ amount: Int) -> some View {
        Button(action: { move(amount) }) {
            MavisButtonLabel(text: "", icon: glyph, variant: .secondary)
        }
        .buttonStyle(MavisButtonStyle(variant: .secondary, iconOnly: true))
        .disabled(still || off)
        .accessibilityLabel(Text(verbatim: name))
        .mavisItem(shrink: 0)
    }

    var body: some View {
        MavisColumn(spacing: ${metric('space.md')}) {
            MavisRow(spacing: ${metric('space.md')}, justify: .between, wrap: true) {
                Text(verbatim: label)
                    .font(${font('heading')})
                    .foregroundStyle(MavisTokens.text)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityAddTraits(.isHeader)
                    .accessibilityHeading(.h2)
                Text(verbatim: position)
                    .font(${font('caption')})
                    .foregroundStyle(MavisTokens.muted)
                    .mavisItem(shrink: 0)
            }
            if items.isEmpty {
                empty()
            } else {
                MavisLayers {
                    MavisCarouselSlide(from: moved ? direction * (reading == .rightToLeft ? -1 : 1) * 48 : 0) {
                        MavisLayers { slide(items[index], Double(index)) }
                    }
                    .id(key(items[index]))
                    // Jolt's drag says where it is through accessibility: one element takes that,
                    // and the texts of the slide keep saying their own.
                    .accessibilityElement(children: .contain)
                    .joltDrag(${scoped ? 'drag.model' : 'drag'})
                }
                .clipShape(RoundedRectangle(cornerRadius: ${metric('radius.lg')}))
                .contentShape(Rectangle())
                .focusable(!disabled, interactions: .edit)
                .focused($focused)
                .onKeyPress(action: key)
                .simultaneousGesture(TapGesture().onEnded { if !disabled { focused = true } })
                .accessibilityElement(children: .contain)
                .accessibilityLabel(Text(verbatim: slideLabel + " " + position))
            }
            MavisRow(spacing: ${metric('space.sm')}, justify: .between) {
                arrow(${swiftGlyph('arrow-left')}, previousLabel, off: !loop && index == 0, -1)
                MavisRow(spacing: ${metric('space.xs')}, justify: .center, wrap: true) {
                    ForEach(Array(items.enumerated()), id: \\.offset) { entry in
                        Button(action: { choose(entry.offset) }) {
                            Text(verbatim: String(entry.offset + 1))
                        }
                        .buttonStyle(MavisButtonStyle(variant: entry.offset == index ? .primary : .ghost))
                        .disabled(disabled)
                        .accessibilityLabel(Text(verbatim: slideLabel + " " + String(entry.offset + 1)))
                        .fixedSize()
                    }
                }
                arrow(${swiftGlyph('arrow-right')}, nextLabel, off: !loop && index == items.count - 1, 1)
            }
        }
${
  scoped
    ? `        .onChange(of: mavisTheme.palette.metrics.motion, initial: true) { _, motion in drag.configure(motion.layout) }
        .onChange(of: drag.position) { _, _ in drag.configure(mavisTheme.palette.metrics.motion.layout) }`
    : ''
}
        .onChange(of: index) { before, after in
            direction = after > before ? 1 : -1
            moved = true
            // The new slide starts where it belongs, not where the last one was let go.
            drag.move(to: .zero, reducedMotion: true)
        }
        .onChange(of: still, initial: true) { _, next in
            try? drag.updateBounds(next ? MavisCarouselDrag.none : MavisCarouselDrag.free, snaps: [.zero])
        }
        // Let go 40 points or more to a side, the slide gives way to the next one there.
        .onChange(of: drag.dragging) { before, after in
            guard before, !after, abs(drag.position.x) >= 40 else { return }
            move((drag.position.x < 0 ? 1 : -1) * (reading == .rightToLeft ? -1 : 1))
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(verbatim: label))
    }
}

private enum MavisCarouselDrag {
    static let free = try! JoltDragBounds(x: -100_000...100_000, y: 0...0)
    static let none = try! JoltDragBounds(x: 0...0, y: 0...0)
    /// componentMotion(theme, "layout") of the Mavis core.
    static let settle = (try? JoltTransition.spring(milliseconds: ${settle}, bounce: 0)) ?? .spring(.smooth)
    static func enter(_ from: Double) -> JoltPose { (try? JoltPose(x: from, opacity: 0.7)) ?? .identity }
}

${
  scoped
    ? `/// Jolt's release transition is immutable. Swap its model only while settled at zero;
/// a theme change during a gesture waits for Jolt to finish. The source's selected slide and
/// the child views stay in place; no additional clock or gesture recognizer is introduced.
@MainActor final class MavisThemedCarouselDrag: ObservableObject {
    @Published private(set) var model: JoltDragModel
    private var changes: AnyCancellable?
    init() {
        model = try! JoltDragModel(bounds: MavisCarouselDrag.free, snaps: [.zero], transition: MavisCarouselDrag.settle)
        observe()
    }
    var position: CGPoint { model.position }
    var dragging: Bool { model.dragging }
    func configure(_ transition: JoltTransition) {
        guard transition != model.transition, !model.dragging, model.position == .zero else { return }
        let bounds = model.bounds, snaps = model.snaps
        changes = nil
        model.dispose()
        model = try! JoltDragModel(bounds: bounds, snaps: snaps, transition: transition)
        observe()
    }
    private func observe() { changes = model.objectWillChange.sink { [weak self] _ in self?.objectWillChange.send() } }
    func move(to point: CGPoint, reducedMotion: Bool) { model.move(to: point, reducedMotion: reducedMotion) }
    func updateBounds(_ bounds: JoltDragBounds, snaps: [CGPoint]) throws { try model.updateBounds(bounds, snaps: snaps) }
}
`
    : ''
}
/// A slide as it comes into view: from 48 points to the side it comes from, through Jolt.
private struct MavisCarouselSlide<Content: View>: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let from: Double
    @ViewBuilder var content: () -> Content
    @State private var entered = false

    var body: some View {
        content()
            .joltMotion(to: entered || from == 0 ? .identity : MavisCarouselDrag.enter(from), transition: ${motion('layout', 'MavisCarouselDrag.settle')})
            .onAppear { entered = true }
    }
}`
  },
  vue: {
    rename: { value: 'modelValue', onChange: 'update:modelValue' },
  },
}
