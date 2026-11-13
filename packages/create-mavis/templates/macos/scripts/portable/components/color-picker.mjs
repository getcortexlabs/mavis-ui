import { choiceRuntime, strings, swiftArguments, swiftCall } from './choices.mjs'
import { flexRuntime } from './flex.mjs'

const labels = [
  'colorLabel',
  'hueLabel',
  'saturationLabel',
  'brightnessLabel',
  'alphaLabel',
  'paletteLabel',
  'invalidLabel',
]

export const MColorPicker = {
  props: {
    id: 'string',
    label: 'string',
    value: 'string',
    onChange: 'string-handler',
    disabled: 'boolean',
    readonly: 'boolean',
    alpha: 'boolean',
    animated: 'boolean',
    palette: strings,
    ...Object.fromEntries(labels.map((label) => [label, 'string'])),
  },
  required: ['label', 'value', 'onChange'],
  control: true,
  uses: [flexRuntime, choiceRuntime],
  declaration: `declare function MColorPicker(props: { id?: string; label: string; value: string; onChange: (value: string) => void; disabled?: boolean; readonly?: boolean; alpha?: boolean; animated?: boolean; palette?: readonly string[]; ${labels.map((label) => `${label}?: string`).join('; ')} }): JSX.Element`,
  swift(node, context) {
    const { emit, indent } = context
    const args = swiftArguments(node, context, [
      ['label'],
      ['value'],
      ['onChange'],
      ['disabled'],
      ['readonly'],
      ['alpha'],
      ['animated'],
      ['palette'],
      ...labels.map((label) => [label]),
    ])
    return [
      swiftCall('MavisColorPicker', args, indent),
      ...(node.props.id
        ? [`${' '.repeat(indent + 4)}.mavisIdentifier(${emit.value(node.props.id)})`]
        : []),
    ].join('\n')
  },
  swiftRuntime: ({
    theme,
    font,
  }) => `/// parseColor, colorHex, colorHsv and hsvColor from Mavis core. The field accepts only
/// hexadecimal and numeric RGB(A), keeping arbitrary CSS out of the shared contract.
struct MavisPickerColor: Equatable {
    var r: Double
    var g: Double
    var b: Double
    var a: Double = 1

    private static let rgb = try! NSRegularExpression(pattern: #"^rgba?\\(\\s*([0-9]+(?:\\.[0-9]+)?)\\s*,\\s*([0-9]+(?:\\.[0-9]+)?)\\s*,\\s*([0-9]+(?:\\.[0-9]+)?)(?:\\s*,\\s*([0-9]*\\.?[0-9]+))?\\s*\\)$"#, options: [.caseInsensitive])

    static func parse(_ source: String) -> MavisPickerColor? {
        let text = mavisTrim(source)
        if text.hasPrefix("#") {
            var digits = String(text.dropFirst())
            guard [3, 4, 6, 8].contains(digits.count), digits.utf8.allSatisfy({ (48...57).contains($0) || (65...70).contains($0) || (97...102).contains($0) }) else { return nil }
            if digits.count <= 4 { digits = digits.map { "\\($0)\\($0)" }.joined() }
            guard let bits = UInt32(digits, radix: 16) else { return nil }
            let rgb = digits.count == 8 ? bits >> 8 : bits
            return MavisPickerColor(r: Double((rgb >> 16) & 255), g: Double((rgb >> 8) & 255), b: Double(rgb & 255), a: digits.count == 8 ? Double(bits & 255) / 255 : 1)
        }
        let range = NSRange(text.startIndex..., in: text)
        guard let match = rgb.firstMatch(in: text, range: range), match.range == range else { return nil }
        func number(_ index: Int) -> Double? {
            guard let range = Range(match.range(at: index), in: text) else { return nil }
            return Double(text[range])
        }
        guard let r = number(1), let g = number(2), let b = number(3), r <= 255, g <= 255, b <= 255 else { return nil }
        let a = number(4) ?? 1
        guard a <= 1 else { return nil }
        return MavisPickerColor(r: r.rounded(), g: g.rounded(), b: b.rounded(), a: a)
    }

    func hex(_ alpha: Bool = false) -> String {
        "#" + (alpha ? [r, g, b, a * 255] : [r, g, b]).map {
            String(format: "%02X", Int(min(255, max(0, $0)).rounded()))
        }.joined()
    }

    var hsv: MavisPickerHsv {
        let r = self.r / 255, g = self.g / 255, b = self.b / 255
        let maximum = max(r, g, b), minimum = min(r, g, b)
        let delta = maximum - minimum
        let sector = delta == 0 ? 0 : maximum == r ? ((g - b) / delta).truncatingRemainder(dividingBy: 6) : maximum == g ? (b - r) / delta + 2 : (r - g) / delta + 4
        return MavisPickerHsv(h: (sector * 60 + 360).truncatingRemainder(dividingBy: 360), s: maximum == 0 ? 0 : delta / maximum * 100, v: maximum * 100, a: a)
    }
}

struct MavisPickerHsv {
    var h: Double
    var s: Double
    var v: Double
    var a: Double
    var color: MavisPickerColor {
        let h = min(360, max(0, h)) / 60, s = min(100, max(0, s)) / 100, v = min(100, max(0, v)) / 100
        let c = v * s, x = c * (1 - abs(h.truncatingRemainder(dividingBy: 2) - 1)), m = v - c
        let rgb: [Double] = h < 1 ? [c, x, 0] : h < 2 ? [x, c, 0] : h < 3 ? [0, c, x] : h < 4 ? [0, x, c] : h < 5 ? [x, 0, c] : [c, 0, x]
        return MavisPickerColor(r: ((rgb[0] + m) * 255).rounded(), g: ((rgb[1] + m) * 255).rounded(), b: ((rgb[2] + m) * 255).rounded(), a: min(1, max(0, a)))
    }
}

/// The same channel controls and palette as MColorPicker on Web and NativeScript. Invalid
/// text remains a draft; the source's value changes only after a valid canonical color.
struct MavisColorPicker: View {
    let label: String
    let value: String
    let onChange: (String) -> Void
    var disabled = false
    var readonly = false
    var alpha = false
    var animated = true
    var palette = ["#9C5270", "#51847B", "#BF733E", "#6366A4", "#213A32", "#E6C88E"]
    var colorLabel = "HEX or RGB"
    var hueLabel = "Hue"
    var saturationLabel = "Saturation"
    var brightnessLabel = "Brightness"
    var alphaLabel = "Opacity"
    var paletteLabel = "Palette"
    var invalidLabel = "Enter a valid HEX or RGB color."
    @State private var draft: String?
    @State private var invalid = false
    @State private var hue = 0.0
    @FocusState private var focus: String?

    private var blocked: Bool { disabled || readonly }
    private var color: MavisPickerColor {
        guard let parsed = MavisPickerColor.parse(value) else { preconditionFailure("MColorPicker modelValue must be HEX or RGB(A).") }
        return parsed
    }
    private var hsv: MavisPickerHsv {
        var next = color.hsv
        if next.s == 0 || next.v == 0 { next.h = hue }
        return next
    }
    private var colors: [String] {
        var shade = hsv
        shade.v = max(15, shade.v * 0.65)
        return [color.hex(), shade.color.hex()]
    }

    private func edit(_ text: String) {
        guard !blocked else { return }
        draft = text
        let next = MavisPickerColor.parse(text)
        invalid = next == nil
        if let next { onChange(next.hex(alpha)) }
    }
    private func choose(_ text: String) {
        guard !blocked else { return }
        guard let parsed = MavisPickerColor.parse(text) else { preconditionFailure("Invalid palette color.") }
        invalid = false
        onChange(parsed.hex(alpha))
        // Follow the source even if it keeps the old color. No stale captured value after a tick.
        draft = nil
    }
    private func channel(_ channel: Int, _ value: Double) {
        guard !blocked else { return }
        var next = hsv
        switch channel {
        case 0: hue = value; next.h = value
        case 1: next.s = value
        case 2: next.v = value
        default: next.a = value / 100
        }
        choose(next.color.hex(alpha))
    }
    private func control(_ channel: Int, _ label: String, _ value: Double, _ maximum: Double) -> some View {
        let rounded = value.rounded()
        return MavisColumn(spacing: ${theme.space.xs}) {
            MavisRow(spacing: ${theme.space.sm}, justify: .between) {
                Text(verbatim: label).font(${font('caption')}).foregroundStyle(MavisTokens.text)
                Text(verbatim: mavisString(rounded) + (channel == 0 ? "°" : "%")).font(${font('caption')}).foregroundStyle(MavisTokens.muted)
            }
            MavisSlider(label: label, value: rounded, onChange: { self.channel(channel, $0) }, maximum: maximum, disabled: blocked)
        }
    }

    var body: some View {
        let _ = precondition(palette.allSatisfy { MavisPickerColor.parse($0) != nil }, "Invalid palette color.")
        MavisColumn(spacing: ${theme.space.md}) {
            Text(verbatim: label).font(${font('heading')}).foregroundStyle(MavisTokens.text)
            MavisGradientBackground(colors: colors, angle: 130, animated: animated, height: 112, radius: ${theme.radius.lg}) { EmptyView() }
                .accessibilityHidden(true)
            MavisTextInput(label: colorLabel, value: draft ?? value, onChange: edit, focus: $focus, focusKey: "color", error: invalid ? invalidLabel : "", disabled: disabled, readonly: readonly)
            control(0, hueLabel, hsv.h, 360)
            control(1, saturationLabel, hsv.s, 100)
            control(2, brightnessLabel, hsv.v, 100)
            if alpha { control(3, alphaLabel, hsv.a * 100, 100) }
            Text(verbatim: paletteLabel).font(${font('caption')}).foregroundStyle(MavisTokens.text)
            MavisRow(spacing: ${theme.space.xs}, wrap: true) {
                ForEach(Array(palette.enumerated()), id: \\.offset) { _, item in
                    let hex = MavisPickerColor.parse(item)!.hex(alpha)
                    Button(action: { choose(item) }) { Text(verbatim: hex) }
                        .buttonStyle(MavisButtonStyle(variant: hex == color.hex(alpha) ? .primary : .secondary, size: .sm))
                        .disabled(blocked)
                        .accessibilityAddTraits(hex == color.hex(alpha) ? .isSelected : [])
                }
            }
        }
        .onAppear { hue = color.hsv.h }
        .onChange(of: value) { _, next in
            draft = next
            invalid = false
            if color.hsv.s != 0 && color.hsv.v != 0 { hue = color.hsv.h }
        }
        .onChange(of: focus) { _, next in if next == nil && !invalid { draft = value } }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(verbatim: label))
    }
}`,
  vue: { rename: { value: 'modelValue', onChange: 'update:modelValue' } },
}
