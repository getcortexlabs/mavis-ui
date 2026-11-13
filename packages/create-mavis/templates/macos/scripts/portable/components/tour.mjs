import { MPopover } from './popover.mjs'
import { content, event, slotOf } from './list-parts.mjs'
import { swiftCall } from './choices.mjs'
import { expression, handlerJs, js } from '../js-text.mjs'

const labels = ['nextLabel', 'backLabel', 'skipLabel', 'finishLabel']
export const MTour = {
  props: {
    id: 'string',
    label: 'string',
    steps: ({ value, ctx, expr, record, T }) => ({
      expr: expr(value, ctx, T.array(record('TourStep'))),
    }),
    value: 'optional-string',
    onChange: event(({ T }) => [T.optional(T.string)]),
    onFinish: 'string-handler',
    onMissing: 'string-handler',
    animated: 'boolean',
    ...Object.fromEntries(labels.map((name) => [name, 'string'])),
  },
  required: ['label', 'steps'],
  children: 'elements',
  uses: [MPopover],
  records: { TourStep: 'the Mavis tour step type' },
  types: () => 'type TourStep = { id: string; title: string; description: string }',
  declaration: `declare function MTour(props: { id?: string; label: string; steps: readonly TourStep[]; value?: string; onChange?: (id: string | undefined) => void; onFinish?: (reason: string) => void; onMissing?: (id: string) => void; animated?: boolean; ${labels.map((name) => `${name}?: string`).join('; ')}; children?: unknown }): JSX.Element`,
  swift(node, context) {
    const { emit, indent } = context,
      p = node.props
    return swiftCall(
      'MavisTour',
      [
        `label: ${emit.value(p.label)}`,
        `steps: ${emit.wrap(p.steps.expr)}.map { MavisTourStep(id: $0.id, title: $0.title, description: $0.description) }`,
        ...['id', 'value', 'animated', ...labels].flatMap((name) =>
          p[name] ? [`${name}: ${emit.value(p[name])}`] : [],
        ),
        ...['onChange', 'onFinish', 'onMissing'].flatMap((name) =>
          p[name] ? [`${name}: ${emit.handler(p[name], indent + 4)}`] : [],
        ),
        `content: {\n${content(node.children, context)}\n${' '.repeat(indent + 4)}}`,
      ],
      indent,
    )
  },
  vue: {
    types: ['TourStep'],
    source: {
      declaration: `(props: { id?: string; label: string; steps: readonly TourStep[]; value?: string; onChange?: (id: string | null) => void; onFinish?: (reason: string) => void; onMissing?: (id: string) => void; animated?: boolean; ${labels.map((name) => `${name}?: string`).join('; ')}; children?: unknown }) => JSX.Element`,
    },
    rename: { value: 'modelValue', onChange: 'update:modelValue' },
    attribute(name, value) {
      if (name === 'value') return `:modelValue="${expression(`${js(value.expr)} ?? null`)}"`
      if (name === 'onChange')
        return `@update:modelValue="${expression(`(id) => (${handlerJs(value)})(id ?? undefined)`)}"`
    },
  },
  swiftRuntime: ({ theme, font, metric }) => `struct MavisTourStep: Equatable {
    let id: String
    let title: String
    let description: String
}
private struct MavisTourCheck: Equatable {
    let value: String?
    let targets: [String]
    let steps: [MavisTourStep]
}
private struct MavisTourTargets: PreferenceKey {
    static let defaultValue: [UUID: [String]] = [:]
    static func reduce(value: inout [UUID: [String]], nextValue: () -> [UUID: [String]]) {
        for (owner, names) in nextValue() { value[owner, default: []].append(contentsOf: names) }
    }
}
private struct MavisTourContext {
    let owner: UUID
    let value: String?
    let index: Int
    let count: Int
    let step: MavisTourStep?
    let label: String
    let animated: Bool
    let nextLabel: String
    let backLabel: String
    let skipLabel: String
    let finishLabel: String
    let move: (Int) -> Void
    let close: (String) -> Void
}
private struct MavisTourKey: EnvironmentKey { static let defaultValue: MavisTourContext? = nil }
private extension EnvironmentValues {
    var mavisTour: MavisTourContext? {
        get { self[MavisTourKey.self] }
        set { self[MavisTourKey.self] = newValue }
    }
}
struct MavisTour<Content: View>: View {
    let label: String
    let steps: [MavisTourStep]
    var id: String? = nil
    var value: String? = nil
    var animated = true
    var nextLabel = "Next"
    var backLabel = "Back"
    var skipLabel = "End tour"
    var finishLabel = "Finish"
    var onChange: (String?) -> Void = { _ in }
    var onFinish: (String) -> Void = { _ in }
    var onMissing: (String) -> Void = { _ in }
    @ViewBuilder let content: () -> Content
    @State private var targets: [String] = []
    @State private var owner = UUID()
    private var index: Int { steps.firstIndex { $0.id == value } ?? -1 }
    private var step: MavisTourStep? { steps.indices.contains(index) ? steps[index] : nil }
    private func close(_ reason: String) {
        guard value != nil else { return }
        onChange(nil); onFinish(reason)
    }
    private func move(_ direction: Int) {
        var next = index + direction
        while steps.indices.contains(next) {
            if targets.contains(steps[next].id) { onChange(steps[next].id); return }
            onMissing(steps[next].id)
            next += direction
        }
        close(direction > 0 ? "complete" : "missing")
    }
    var body: some View {
        let _ = precondition(Set(steps.map(\\.id)).count == steps.count && steps.allSatisfy { !mavisTrim($0.id).isEmpty && !mavisTrim($0.title).isEmpty }, "Tour steps require unique nonempty IDs and titles.")
        content()
            .environment(\\.mavisTour, MavisTourContext(owner: owner, value: value, index: index, count: steps.count, step: step, label: label, animated: animated, nextLabel: nextLabel, backLabel: backLabel, skipLabel: skipLabel, finishLabel: finishLabel, move: move, close: close))
            .onPreferenceChange(MavisTourTargets.self) { all in
                let next = all[owner] ?? []
                precondition(Set(next).count == next.count && next.allSatisfy { !mavisTrim($0).isEmpty }, "Tour targets require unique nonempty names within a tour.")
                targets = next
            }
            // Targets register through layout; an obsolete appearance cannot advance a newer step.
            .task(id: MavisTourCheck(value: value, targets: targets, steps: steps)) {
                await _Concurrency.Task.yield()
                guard !_Concurrency.Task.isCancelled, let value else { return }
                if step == nil || !targets.contains(value) { onMissing(value); move(1) }
            }
            .mavisIdentifier(id ?? "")
    }
}

private struct MavisTourReveal: NSViewRepresentable {
    let active: Bool
    final class AnchorView: NSView {
        var active = false
        var pending = false
        override func hitTest(_ point: NSPoint) -> NSView? { nil }
        override func layout() { super.layout(); reveal() }
        override func viewDidMoveToWindow() { super.viewDidMoveToWindow(); reveal() }
        func reveal() {
            guard active, pending, window != nil, bounds.width > 0, bounds.height > 0 else { return }
            pending = false
            scrollToVisible(bounds)
        }
    }
    func makeNSView(context: Context) -> AnchorView { AnchorView() }
    func updateNSView(_ view: AnchorView, context: Context) {
        if active && !view.active { view.pending = true }
        view.active = active
        view.reveal()
    }
}

struct MavisTourTarget<Content: View>: View {
    @Environment(\\.mavisTheme) private var mavisTheme
    let name: String
    @ViewBuilder let content: (Bool) -> Content
    @Environment(\\.mavisTour) private var tour
    var body: some View {
        let _ = precondition(tour != nil, "MTourTarget must be inside MTour.")
        if let tour {
            let active = tour.value == name && tour.step != nil
            MavisPopoverAnchor(open: active, label: tour.step?.title ?? name, width: 320, request: { reason in if active { tour.close(reason) } }) {
                content(active)
                    .padding(${metric('space.xs')})
                    .overlay(RoundedRectangle(cornerRadius: ${metric('radius.md')}).strokeBorder(active ? MavisTokens.primary : .clear, lineWidth: 2).allowsHitTesting(false))
                    .background(MavisTourReveal(active: active))
            } panel: {
                MavisColumn(spacing: ${metric('space.md')}) {
                    Text(verbatim: tour.label + " · \\(tour.index + 1) / \\(tour.count)").font(${font('caption')}).foregroundStyle(MavisTokens.muted)
                    Text(verbatim: tour.step?.title ?? "").font(${font('heading')})
                    Text(verbatim: tour.step?.description ?? "").font(${font('body')}).fixedSize(horizontal: false, vertical: true)
                    MavisRow(spacing: ${metric('space.xs')}, wrap: true) {
                        Button(tour.backLabel, action: { tour.move(-1) }).buttonStyle(MavisButtonStyle(variant: .secondary)).disabled(tour.index <= 0)
                        Button(tour.index == tour.count - 1 ? tour.finishLabel : tour.nextLabel, action: { tour.move(1) }).buttonStyle(MavisButtonStyle(variant: .primary))
                        Button(tour.skipLabel, action: { tour.close("skip") }).buttonStyle(MavisButtonStyle(variant: .ghost))
                    }
                }.padding(${metric('space.md')})
            }
            .joltReduceMotion(!tour.animated)
            .preference(key: MavisTourTargets.self, value: [tour.owner: [name]])
        }
    }
}`,
}

export const MTourTarget = {
  props: { name: 'string' },
  required: ['name'],
  children: 'elements',
  unscopedDefault: true,
  slots: ['default'],
  scoped: { default: (_props, { T }) => [{ name: 'active', type: T.boolean }] },
  uses: [MTour],
  declaration:
    'declare function MTourTarget(props: { name: string; children?: JSX.Element | ((props: { active: boolean }) => JSX.Element) }): JSX.Element',
  swift(node, context) {
    const { emit, indent } = context,
      slot = slotOf(node, 'default')
    const active = slot && !slot.params[0].unused ? slot.params[0].name : '_'
    return swiftCall(
      'MavisTourTarget',
      [
        `name: ${emit.value(node.props.name)}`,
        `content: { ${active} in\n${content(slot?.body ?? node.children, context)}\n${' '.repeat(indent + 4)}}`,
      ],
      indent,
    )
  },
}
