import { flexRuntime } from './flex.mjs'
import { event, swiftRecord } from './choices.mjs'
import { bounded, content, field, named, records } from './list-parts.mjs'
import { oneOf } from './items.mjs'

const actionFields = {
  value: 'string',
  label: 'string',
  icon: 'string?',
  destructive: 'boolean?',
  disabled: 'boolean?',
}
const actions = records(
  'MSwipeActions',
  'actions',
  actionFields,
  '{ value: string; label: string }[]',
)
const labels = ['actionsLabel', 'closeLabel']

export const swipeActionsPolicy = `func mavisSwipeDestination(_ x: Double, _ velocity: Double, _ start: Double, _ end: Double, _ direction: Double) -> String? {
    let projected = (x + velocity * 0.12) * direction
    if start > 0 && projected > start * 0.45 { return "start" }
    if end > 0 && projected < -end * 0.45 { return "end" }
    return nil
}`

export const MSwipeActions = {
  props: {
    label: 'string',
    value: 'optional-string',
    onChange: event(({ T }) => [T.optional(T.string)], 'SwipeSide'),
    start: actions,
    end: actions,
    onAction: event(({ record }) => [record('SwipeAction')], 'SwipeAction'),
    disabled: 'boolean',
    actionWidth: bounded('actionWidth', (value) => value > 0, 'must be positive.'),
    direction: oneOf('direction', ['ltr', 'rtl']),
    ...Object.fromEntries(labels.map((key) => [key, 'string'])),
  },
  required: ['label'],
  children: 'elements',
  control: true,
  uses: [flexRuntime],
  types: () =>
    "type SwipeSide = 'start' | 'end' | null\ntype SwipeAction = { value: string; label: string; icon?: MavisIconName; destructive?: boolean; disabled?: boolean }",
  records: { SwipeAction: 'the Mavis swipe action type' },
  declaration:
    "declare function MSwipeActions(props: { label: string; value?: SwipeSide; onChange?: (side: SwipeSide) => void; start?: readonly SwipeAction[]; end?: readonly SwipeAction[]; onAction?: (action: SwipeAction) => void; disabled?: boolean; actionWidth?: number; direction?: 'ltr' | 'rtl'; actionsLabel?: string; closeLabel?: string; children?: JSX.Element }): JSX.Element",
  check({ props, attrs, fail }) {
    if ('lit' in props.label && !props.label.lit.trim())
      fail(attrs.get('label'), 'MSwipeActions needs a nonempty label.')
    const value = props.value?.expr
    if (value?.e === 'lit' && value.value != null && !['start', 'end'].includes(value.value))
      fail(attrs.get('value'), 'SwipeSide is start, end or null.')
  },
  swift(node, context) {
    const { emit, indent } = context,
      pad = ' '.repeat(indent),
      props = node.props
    const args = [`label: ${emit.value(props.label)}`]
    for (const name of ['start', 'end']) {
      const action = props[name]
      if (action)
        args.push(
          `${name}: ${emit.wrap(action.expr)}.map { MavisSwipeAction(value: $0.value, label: $0.label, icon: ${field(action.has, 'icon', 'nil')}, destructive: ${field(action.has, 'destructive', 'nil')}, disabled: ${field(action.has, 'disabled', 'nil')}) }`,
        )
    }
    if (props.value) args.push(`value: ${emit.value(props.value)}`)
    if (props.onChange) args.push(`onChange: ${emit.handler(props.onChange, indent + 4)}`)
    if (props.onAction)
      args.push(
        `onAction: { action in (${emit.handler(props.onAction, indent + 4)})(${swiftRecord(emit, 'SwipeAction', Object.fromEntries(Object.keys(actionFields).map((key) => [key, `action.${key}`])))}) }`,
      )
    args.push(...named(props, emit, ['disabled', 'actionWidth', 'direction', ...labels]))
    args.push(`content: {\n${content(node.children ?? [], context)}\n${pad}    }`)
    return `${pad}MavisSwipeActions(\n${args.map((arg) => `${pad}    ${arg}`).join(',\n')}\n${pad})`
  },
  swiftRuntime: ({ theme }) => `struct MavisSwipeAction: Identifiable, Equatable {
    let value: String
    let label: String
    var icon: String? = nil
    var destructive: Bool? = nil
    var disabled: Bool? = nil
    var id: String { value }
}

${swipeActionsPolicy}

@MainActor func mavisSwipeDrag() -> JoltDragModel {
    try! JoltDragModel(bounds: JoltDragBounds(x: 0...0, y: 0...0))
}

struct MavisSwipeActions<Content: View>: View {
    let label: String
    var start: [MavisSwipeAction] = []
    var end: [MavisSwipeAction] = []
    var value: String? = nil
    var onChange: (String?) -> Void = { _ in }
    var onAction: (MavisSwipeAction) -> Void = { _ in }
    var disabled = false
    var actionWidth: Double = 96
    var direction = "ltr"
    var actionsLabel = "Actions"
    var closeLabel = "Close actions"
    @ViewBuilder var content: () -> Content
    @StateObject private var drag = mavisSwipeDrag()
    @GestureState private var dragging = false
    @Environment(\\.accessibilityReduceMotion) private var reduced
    private var sign: Double { direction == "rtl" ? -1 : 1 }
    private var startWidth: Double { Double(start.count) * actionWidth }
    private var endWidth: Double { Double(end.count) * actionWidth }
    private var offset: Double { disabled ? 0 : value == "start" ? startWidth * sign : value == "end" ? -endWidth * sign : 0 }
    private var valid: Bool {
        let all = start + end
        return actionWidth.isFinite && actionWidth > 0 && Set(all.map(\\.value)).count == all.count && all.allSatisfy { !mavisTrim($0.label).isEmpty }
    }
    private func synchronize() {
        guard valid else { drag.pause(); return }
        drag.play()
        try? drag.updateBounds(JoltDragBounds(x: (sign == 1 ? -endWidth : -startWidth)...(sign == 1 ? startWidth : endWidth), y: 0...0), snaps: [])
        drag.move(to: CGPoint(x: offset, y: 0), reducedMotion: reduced)
        if disabled { drag.pause() }
    }
    private func select(_ side: String?) {
        guard !disabled, valid else { return }
        onChange(side)
        drag.move(to: CGPoint(x: offset, y: 0), reducedMotion: reduced)
    }
    private func run(_ action: MavisSwipeAction) {
        guard !disabled, action.disabled != true, valid else { return }
        onAction(action)
        select(nil)
    }
    private func button(_ action: MavisSwipeAction) -> some View {
        Button { run(action) } label: {
            HStack {
                if let icon = action.icon { MavisIcon(icon, size: 18) }
                Text(verbatim: action.label)
            }
        }
        .buttonStyle(MavisButtonStyle(variant: .secondary))
        .disabled(disabled || action.disabled == true)
    }
    @ViewBuilder private var menu: some View {
        ForEach(start + end) { action in
            Button(role: action.destructive == true ? .destructive : nil) { run(action) } label: {
                Text(verbatim: action.label)
            }.disabled(disabled || action.disabled == true)
        }
    }
    var body: some View {
        VStack(alignment: .leading, spacing: ${theme.space.xs}) {
            ZStack {
                HStack(spacing: 0) {
                    if direction == "ltr" {
                        ForEach(start) { action in button(action).frame(width: actionWidth) }
                        Spacer(minLength: 0)
                        ForEach(end) { action in button(action).frame(width: actionWidth) }
                    } else {
                        ForEach(end) { action in button(action).frame(width: actionWidth) }
                        Spacer(minLength: 0)
                        ForEach(start) { action in button(action).frame(width: actionWidth) }
                    }
                }
                .allowsHitTesting(!disabled && value != nil)
                .accessibilityHidden(disabled || value == nil)
                MavisColumn { content() }
                    .padding(${theme.space.md})
                    .background(MavisTokens.surface, in: RoundedRectangle(cornerRadius: ${theme.radius.lg}))
                    .overlay(RoundedRectangle(cornerRadius: ${theme.radius.lg}).strokeBorder(MavisTokens.border, lineWidth: 1).allowsHitTesting(false))
                    .offset(x: drag.position.x)
                    .gesture(DragGesture(minimumDistance: 4)
                        .updating($dragging) { _, active, _ in active = true }
                        .onChanged { event in
                            guard !disabled, valid else { return }
                            if !drag.dragging { drag.begin() }
                            drag.update(translation: event.translation)
                        }
                        .onEnded { event in
                            let next = mavisSwipeDestination(drag.position.x, event.velocity.width, startWidth, endWidth, sign)
                            drag.end(cancelled: true)
                            select(next)
                        })
            }
            .clipShape(RoundedRectangle(cornerRadius: ${theme.radius.lg}))
            .contextMenu { menu }
            HStack {
                Spacer()
                if value != nil { Button(closeLabel) { select(nil) }.buttonStyle(MavisButtonStyle(variant: .ghost)).disabled(disabled) }
                Menu(actionsLabel) { menu }.disabled(disabled).accessibilityLabel(Text(verbatim: actionsLabel + ": " + label))
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(verbatim: label))
        .onExitCommand { select(nil) }
        .onAppear { drag.resume(); synchronize() }
        .onChange(of: value) { _, _ in synchronize() }
        .onChange(of: start) { _, _ in synchronize() }
        .onChange(of: end) { _, _ in synchronize() }
        .onChange(of: disabled) { _, _ in synchronize() }
        .onChange(of: direction) { _, _ in synchronize() }
        .onChange(of: actionWidth) { _, _ in synchronize() }
        .onChange(of: dragging) { _, active in if !active && drag.dragging { drag.end(cancelled: true); synchronize() } }
        .onDisappear { drag.end(cancelled: true); drag.suspend() }
    }
}`,
  vue: {
    rename: { value: 'modelValue', onChange: 'update:modelValue' },
    types: ['SwipeAction', 'SwipeSide'],
  },
}
