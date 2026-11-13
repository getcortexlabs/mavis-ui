import { flexRuntime } from './flex.mjs'
import { event, swiftRecord } from './choices.mjs'
import { bounded, content, field, named, records, slotOf } from './list-parts.mjs'
import { pictureRuntime } from './image.mjs'
import { bundleRuntime } from './assets.mjs'

const cardFields = { id: 'string', title: 'string', description: 'string?', image: 'string?' }
const cards = records('MSwipeDeck', 'cards', cardFields, '{ id: string; title: string }[]')
const labels = ['acceptLabel', 'rejectLabel', 'undoLabel', 'emptyLabel']
export const swipeDeckPolicy = `func mavisDeckDecision(_ distance: Double, _ velocity: Double, _ threshold: Double) -> String? {
    guard distance.isFinite, velocity.isFinite, threshold.isFinite, threshold > 0 else { return nil }
    guard abs(distance) >= threshold || (abs(distance) > 12 && abs(velocity) > 600) else { return nil }
    return distance + velocity * 0.08 >= 0 ? "accept" : "reject"
}`

export const MSwipeDeck = {
  props: {
    id: 'string',
    label: 'string',
    items: cards,
    value: 'optional-string',
    onChange: event(({ T }) => [T.optional(T.string)], 'string | null'),
    onDecide: event(({ record }) => [record('SwipeDeckEvent')], 'SwipeDeckEvent'),
    onUndo: 'handler',
    disabled: 'boolean',
    animated: 'boolean',
    canUndo: 'boolean',
    height: bounded('height', (value) => value >= 180, 'must be at least 180.'),
    threshold: bounded('threshold', (value) => value > 0, 'must be positive.'),
    ...Object.fromEntries(labels.map((key) => [key, 'string'])),
  },
  required: ['label', 'items'],
  slots: ['item'],
  control: true,
  scoped: {
    item: (props, { T }) => [
      { name: 'item', type: T.record(props.items.record) },
      { name: 'index', type: T.number },
    ],
  },
  uses: [flexRuntime, bundleRuntime, pictureRuntime],
  types: () =>
    "type SwipeCard = { id: string; title: string; description?: string; image?: string }\ntype SwipeDecision = 'accept' | 'reject'\ntype SwipeDeckEvent = { item: SwipeCard; decision: SwipeDecision }",
  records: {
    SwipeCard: 'the Mavis swipe card type',
    SwipeDeckEvent: 'the Mavis swipe decision event',
  },
  declaration: `declare function MSwipeDeck<T extends SwipeCard>(props: { id?: string; label: string; items: readonly T[]; value?: string | null; onChange?: (value: string | null) => void; onDecide?: (event: SwipeDeckEvent) => void; onUndo?: () => void; disabled?: boolean; animated?: boolean; height?: number; threshold?: number; canUndo?: boolean; ${labels.map((key) => `${key}?: string`).join('; ')}; slotItem?: (props: { item: T; index: number }) => JSX.Element }): JSX.Element`,
  check({ props, attrs, fail }) {
    if ('lit' in props.label && !props.label.lit.trim())
      fail(attrs.get('label'), 'MSwipeDeck needs a nonempty label.')
  },
  swift(node, context) {
    const { emit, indent } = context,
      props = node.props,
      pad = ' '.repeat(indent)
    const rows = props.items,
      slot = slotOf(node, 'item')
    const args = [
      `label: ${emit.value(props.label)}`,
      `items: ${emit.expr(rows.expr)}`,
      'key: { $0.id }',
      'title: { $0.title }',
      `detail: { ${field(rows.has, 'description', '""')} }`,
      `image: { ${field(rows.has, 'image', 'nil')} }`,
    ]
    if (props.value) args.push(`value: ${emit.value(props.value)}`)
    if (props.onChange) args.push(`onChange: ${emit.handler(props.onChange, indent + 4)}`)
    if (props.onDecide) {
      const card = swiftRecord(
        emit,
        'SwipeCard',
        Object.fromEntries(
          Object.keys(cardFields).map((key) => [key, field(rows.has, key, 'nil', 'card')]),
        ),
      )
      args.push(
        `onDecide: { card, decision in (${emit.handler(props.onDecide, indent + 4)})(SwipeDeckEvent(item: ${card}, decision: decision)) }`,
      )
    }
    if (props.onUndo) args.push(`onUndo: ${emit.handler(props.onUndo, indent + 4)}`)
    args.push(
      ...named(props, emit, ['disabled', 'animated', 'height', 'threshold', 'canUndo', ...labels]),
    )
    const params = slot
      ? slot.params.map((param, index) =>
          param.unused ? (index ? 'mavisIndex' : 'mavisItem') : param.name,
        )
      : ['mavisItem', 'mavisIndex']
    args.push(
      `item: { (${params[0]}: ${rows.record}, ${params[1]}: Double) in\n${slot ? content(slot.body, context) : `${pad}        MavisDeckDefault()`}\n${pad}    }`,
    )
    return `${pad}MavisSwipeDeck(\n${args.map((arg) => `${pad}    ${arg}`).join(',\n')}\n${pad})${props.id ? `\n${pad}    .mavisIdentifier(${emit.value(props.id)})` : ''}`
  },
  swiftRuntime: ({ theme, font }) => `${swipeDeckPolicy}

@MainActor func mavisDeckDrag() -> JoltDragModel {
    try! JoltDragModel(bounds: JoltDragBounds(x: -360...360, y: 0...0))
}
@MainActor func mavisDeckFlight() -> JoltMotionValue { try! JoltMotionValue(0) }
struct MavisDeckDefault: View { var body: some View { EmptyView() } }

struct MavisSwipeDeck<Item: Equatable, Content: View>: View {
    let label: String
    let items: [Item]
    let key: (Item) -> String
    let title: (Item) -> String
    let detail: (Item) -> String
    let image: (Item) -> String?
    var value: String? = nil
    var onChange: (String?) -> Void = { _ in }
    var onDecide: (Item, String) -> Void = { _, _ in }
    var onUndo: () -> Void = {}
    var disabled = false
    var animated = true
    var height: Double = 340
    var threshold: Double = 90
    var canUndo = false
    var acceptLabel = "Keep"
    var rejectLabel = "Pass"
    var undoLabel = "Undo"
    var emptyLabel = "All caught up."
    @ViewBuilder var item: (Item, Double) -> Content
    @StateObject private var drag = mavisDeckDrag()
    @StateObject private var flight = mavisDeckFlight()
    @State private var busy = false
    @State private var revision = 0
    @GestureState private var dragging = false
    @FocusState private var focused: Bool
    @Environment(\\.accessibilityReduceMotion) private var reduced
    private var index: Int? { items.firstIndex { key($0) == value } }
    private var displacement: Double { busy ? flight.value : drag.position.x }
    private var valid: Bool { height.isFinite && height >= 180 && threshold.isFinite && threshold > 0 && Set(items.map(key)).count == items.count && items.allSatisfy { !mavisTrim(title($0)).isEmpty } }

    private func reset() {
        revision += 1
        busy = false
        flight.cancel()
        try? flight.set(0)
        drag.end(cancelled: true)
        drag.play()
        drag.move(to: .zero, reducedMotion: true)
        if disabled { drag.pause() }
    }
    private func settle() { drag.move(to: .zero, reducedMotion: reduced || !animated) }
    private func decide(_ decision: String) {
        guard !disabled, !busy, valid, let index else { return }
        let current = items[index], identity = key(items[index])
        let next = index + 1 < items.count ? key(items[index + 1]) : nil
        busy = true
        revision += 1
        let token = revision
        drag.end(cancelled: true)
        drag.pause()
        try? flight.set(drag.position.x)
        try? flight.animate(to: decision == "accept" ? 340 : -340, transition: .tween(milliseconds: 220, ease: .easeIn), reducedMotion: reduced || !animated) { finished in
            guard finished, token == revision, !disabled, value == identity else { return }
            onDecide(current, decision)
            onChange(next)
            busy = false
            try? flight.set(0)
            drag.play()
            drag.move(to: .zero, reducedMotion: true)
        }
    }
    private func undo() { if !disabled && !busy && canUndo { onUndo() } }
    @ViewBuilder private func face(_ current: Item, _ at: Int) -> some View {
        MavisColumn(spacing: ${theme.space.md}) {
            if Content.self == MavisDeckDefault.self {
                if let source = image(current), !source.isEmpty {
                    MavisImage(src: source, alt: "", aspectRatio: nil, fit: .cover, radius: ${theme.radius.md})
                        .frame(height: max(80, height - 180))
                }
                Text(verbatim: title(current)).font(${font('title')}).foregroundStyle(MavisTokens.text)
                Text(verbatim: detail(current)).font(${font('body')}).foregroundStyle(MavisTokens.muted)
            } else { item(current, Double(at)) }
        }
        .padding(${theme.space.lg})
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(MavisTokens.surface, in: RoundedRectangle(cornerRadius: ${theme.radius.lg}))
        .overlay(RoundedRectangle(cornerRadius: ${theme.radius.lg}).strokeBorder(MavisTokens.border, lineWidth: 1).allowsHitTesting(false))
    }
    var body: some View {
        VStack(alignment: .leading, spacing: ${theme.space.md}) {
            Text(verbatim: label).font(${font('heading')}).foregroundStyle(MavisTokens.text)
            ZStack(alignment: .top) {
                if let index {
                    ForEach([2, 1].filter { index + $0 < items.count }, id: \\.self) { depth in
                        RoundedRectangle(cornerRadius: ${theme.radius.lg})
                            .fill(depth == 1 ? MavisTokens.primarySoft : MavisTokens.elevated)
                            .padding(Double(depth) * 8)
                            .offset(y: Double(depth) * 6)
                            .accessibilityHidden(true)
                    }
                    face(items[index], index)
                        .offset(x: displacement)
                        .rotationEffect(.degrees(busy ? displacement / 340 * 14 : 0))
                        .opacity(busy ? max(0, 1 - abs(displacement) / 340) : 1)
                        .gesture(DragGesture(minimumDistance: 4)
                            .updating($dragging) { _, active, _ in active = true }
                            .onChanged { event in
                                guard !disabled, !busy, valid else { return }
                                if !drag.dragging { drag.begin(); focused = true }
                                drag.update(translation: event.translation)
                            }
                            .onEnded { event in
                                let decision = mavisDeckDecision(drag.position.x, event.velocity.width, threshold)
                                drag.end(cancelled: true)
                                if let decision { decide(decision) } else { settle() }
                            })
                } else { Text(verbatim: emptyLabel).font(${font('heading')}).foregroundStyle(MavisTokens.text) }
            }
            .frame(height: height + 20)
            .clipped()
            .focusable(!disabled, interactions: .edit)
            .focused($focused)
            .onKeyPress(.leftArrow) { decide("reject"); return .handled }
            .onKeyPress(.rightArrow) { decide("accept"); return .handled }
            .onKeyPress("z") { undo(); return .handled }
            HStack(spacing: ${theme.space.sm}) {
                Button(rejectLabel) { decide("reject") }.buttonStyle(MavisButtonStyle(variant: .secondary)).disabled(disabled || busy || index == nil)
                Button(acceptLabel) { decide("accept") }.buttonStyle(MavisButtonStyle()).disabled(disabled || busy || index == nil)
                Button(undoLabel) { undo() }.buttonStyle(MavisButtonStyle(variant: .ghost)).disabled(disabled || busy || !canUndo)
            }
            Text(verbatim: index.map { "\\($0 + 1) / \\(items.count) · " + title(items[$0]) } ?? emptyLabel)
                .font(${font('caption')}).foregroundStyle(MavisTokens.text)
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(verbatim: label))
        .onAppear { drag.resume(); flight.resume(); reset() }
        .onChange(of: value) { _, _ in reset() }
        .onChange(of: items) { _, _ in reset() }
        .onChange(of: disabled) { _, _ in reset() }
        .onChange(of: threshold) { _, _ in reset() }
        .onChange(of: dragging) { _, active in if !active && drag.dragging { drag.end(cancelled: true); settle() } }
        .onDisappear { reset(); drag.suspend(); flight.suspend() }
    }
}`,
  vue: {
    rename: { value: 'modelValue', onChange: 'update:modelValue' },
    types: ['SwipeCard', 'SwipeDecision'],
  },
}
