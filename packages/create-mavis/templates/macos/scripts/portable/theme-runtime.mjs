import { swiftString } from './swift-text.mjs'
import { themeColor } from './themes.mjs'
const q = swiftString
const dictionary = (object, entry) =>
  `[${Object.entries(object)
    .map(([key, value]) => `${q(key)}: ${entry(value)}`)
    .join(', ')}]`
const nativeFamily = (family) => (typeof family === 'string' ? family : family.ios)
const resolved = (values, value) => (typeof value === 'number' ? value : values[value])
export function themeMetrics(value) {
  const button = value.components.button,
    input = value.components.input,
    card = value.components.card
  const typography = (entry) =>
    `MavisTypography(size: ${entry.fontSize}, weight: ${q(entry.fontWeight)}, family: ${q(nativeFamily(entry.fontFamily))}, lineHeight: ${entry.lineHeight}, letterSpacing: ${entry.letterSpacing})`
  const shadow = (entry) =>
    `MavisShadowSpec(x: ${entry.x}, y: ${entry.y}, blur: ${entry.blur}, spread: ${entry.spread}, argb: ${themeColor(entry.color)})`
  return `MavisMetrics(space: ${dictionary(value.space, String)}, radius: ${dictionary(value.radius, String)}, typography: ${dictionary(value.typography, typography)}, control: ${dictionary(value.control, (v) => `MavisControlSize(height: ${v.height}, fontSize: ${v.fontSize}, padding: ${v.padding})`)}, elevation: ${dictionary(value.elevation, shadow)}, button: MavisButtonMetrics(family: ${q(nativeFamily(button.fontFamily ?? value.typography.body.fontFamily))}, weight: ${q(button.fontWeight)}, lineHeight: ${button.lineHeight}, paddingY: ${button.paddingY}, radius: ${resolved(value.radius, button.radius)}, elevation: ${q(button.elevation)}), input: MavisInputMetrics(family: ${q(nativeFamily(input.fontFamily ?? value.typography.body.fontFamily))}, fontSize: ${input.fontSize ?? value.typography.body.fontSize}, weight: ${q(input.fontWeight)}, lineHeight: ${input.lineHeight}, paddingX: ${input.paddingX}, paddingY: ${input.paddingY}, radius: ${resolved(value.radius, input.radius)}), card: MavisCardMetrics(padding: ${resolved(value.space, card.padding)}, radius: ${resolved(value.radius, card.radius)}, elevation: ${q(card.elevation)}), motion: MavisMotionMetrics(pressScale: ${value.motion.pressScale}, pressDuration: ${value.motion.pressDuration}, releaseDuration: ${value.motion.releaseDuration}, releaseBounce: ${value.motion.releaseBounce}, enterDuration: ${value.motion.enterDuration}, exitDuration: ${value.motion.exitDuration}, enterOffset: ${value.motion.enterOffset}, ease: ${q(value.motion.ease)}))`
}
export const metricsRuntime = `struct MavisTypography: Equatable {
    let size: Double; let weight: String; let family: String; let lineHeight: Double; let letterSpacing: Double
    var font: Font { mavisThemeFont(family, size, weight) }
}
func mavisThemeFont(_ family: String, _ size: Double, _ weight: String) -> Font {
    (family.isEmpty || family == "system" ? Font.system(size: size) : Font.custom(family, size: size)).weight(MavisTokens.weight(weight))
}
struct MavisControlSize: Equatable { let height: Double; let fontSize: Double; let padding: Double }
struct MavisButtonMetrics: Equatable { let family: String; let weight: String; let lineHeight: Double; let paddingY: Double; let radius: Double; let elevation: String }
struct MavisInputMetrics: Equatable { let family: String; let fontSize: Double; let weight: String; let lineHeight: Double; let paddingX: Double; let paddingY: Double; let radius: Double; var font: Font { mavisThemeFont(family, fontSize, weight) } }
struct MavisCardMetrics: Equatable { let padding: Double; let radius: Double; let elevation: String }
struct MavisMotionMetrics: Equatable {
    let pressScale: Double; let pressDuration: Double; let releaseDuration: Double; let releaseBounce: Double
    let enterDuration: Double; let exitDuration: Double; let enterOffset: Double; let ease: String
    func press(_ pressed: Bool) -> JoltTransition {
        let duration = pressed ? pressDuration : releaseDuration
        guard duration > 0 else { return try! .tween(milliseconds: 0) }
        return try! .spring(milliseconds: duration, bounce: pressed ? 0 : releaseBounce)
    }
    func tween(_ entering: Bool) -> JoltTransition {
        try! .tween(milliseconds: entering ? enterDuration : exitDuration, ease: JoltEase(rawValue: ease) ?? .easeOut)
    }
    func spring(_ factor: Double) -> JoltTransition { enterDuration == 0 ? try! .tween(milliseconds: 0) : try! .spring(milliseconds: enterDuration * factor, bounce: 0) }
    var selection: JoltTransition { spring(1.5) }
    var layout: JoltTransition { spring(1.8) }
    var tooltipEnter: JoltRecipe { JoltPreset.fadeInUp.recipe(try! JoltPresetParameters(distance: 3, duration: enterDuration)) }
    var tooltipLeave: JoltRecipe { JoltPreset.fadeOutDown.recipe(try! JoltPresetParameters(distance: 1.5, duration: exitDuration)) }
    var toastEnter: JoltRecipe { JoltPreset.fadeInDown.recipe(try! JoltPresetParameters(distance: 8, duration: enterDuration)) }
    var toastLeave: JoltRecipe { JoltPreset.fadeOutUp.recipe(try! JoltPresetParameters(distance: 4, duration: exitDuration)) }
    var paint: JoltTransition { tween(true) }
    var data: JoltTransition { try! .tween(milliseconds: enterDuration * 2.4, ease: JoltEase(rawValue: ease) ?? .easeOut) }
    var feedback: JoltTransition { enterDuration == 0 ? try! .tween(milliseconds: 0) : try! .spring(milliseconds: enterDuration * 1.2, bounce: Swift.min(0.2, releaseBounce)) }
    var enter: JoltRecipe { JoltPreset.fadeInUp.recipe(try! JoltPresetParameters(distance: enterOffset, duration: enterDuration)) }
    var appear: JoltRecipe { JoltPreset.fadeIn.recipe(try! JoltPresetParameters(duration: enterDuration)) }
    var leave: JoltRecipe { JoltPreset.fadeOut.recipe(try! JoltPresetParameters(duration: exitDuration)) }
}
struct MavisShadowSpec: Equatable {
    let x: Double; let y: Double; let blur: Double; let spread: Double; let argb: UInt32
    var color: Color { Color(red: Double((argb >> 16) & 255) / 255, green: Double((argb >> 8) & 255) / 255, blue: Double(argb & 255) / 255, opacity: Double((argb >> 24) & 255) / 255) }
}
struct MavisMetrics: Equatable {
    let space: [String:Double]; let radius: [String:Double]; let typography: [String:MavisTypography]
    let control: [String:MavisControlSize]; let elevation: [String:MavisShadowSpec]
    let button: MavisButtonMetrics; let input: MavisInputMetrics; let card: MavisCardMetrics; let motion: MavisMotionMetrics
    func gap(_ token: String) -> Double { space[token] ?? 0 }
    func corner(_ token: String) -> Double { radius[token] ?? 0 }
    func type(_ variant: String) -> MavisTypography { typography[variant] ?? typography["body"]! }
    func size(_ name: String) -> MavisControlSize { control[name] ?? control["md"]! }
    func shadow(_ name: String) -> MavisShadowSpec { elevation[name] ?? elevation["none"]! }
}
/// A default that follows its provider, while an explicit numeric property always wins.
@propertyWrapper struct MavisMetric: DynamicProperty {
    @Environment(\\.mavisTheme) private var theme
    private var explicit: Double
    private let path: String
    init(wrappedValue: Double, _ path: String) { explicit = wrappedValue; self.path = path }
    var wrappedValue: Double {
        get {
            guard explicit.isNaN else { return explicit }
            let parts = path.split(separator: ".").map(String.init)
            let metrics = theme.palette.metrics
            switch parts[0] {
            case "space": return metrics.gap(parts[1])
            case "radius": return metrics.corner(parts[1])
            default: return metrics.size(parts[1]).height
            }
        }
        set { explicit = newValue }
    }
}
/// Reads a scoped theme without replacing children when appearance changes.
struct MavisThemeReader<Content: View>: View {
    @Environment(\\.mavisTheme) private var around
    @ObservedObject private var system = MavisSystemAppearance.shared
    @ViewBuilder var content: (MavisThemeScope) -> Content
    var body: some View {
        let resolved = around.scoped(theme: nil, darkTheme: nil, appearance: nil, system: system.current)
        content(resolved).environment(\\.mavisTheme, resolved)
    }
}
private struct MavisTypographyModifier: ViewModifier {
    let variant: String
    @Environment(\\.mavisTheme) private var theme
    func body(content: Content) -> some View {
        let type = theme.palette.metrics.type(variant)
        content.font(type.font).tracking(type.letterSpacing * type.size).lineSpacing(type.size * (type.lineHeight - 1))
    }
}
/// Draw beyond the box without enlarging the background view's layout or hit-test frame.
private struct MavisShadowShape: Shape {
    let radius: Double; let spread: Double; let x: Double; let y: Double
    func path(in rect: CGRect) -> Path {
        let bounds = rect.insetBy(dx: -spread, dy: -spread).offsetBy(dx: x, dy: y)
        return RoundedRectangle(cornerRadius: Swift.max(0, radius + spread)).path(in: bounds)
    }
}
private struct MavisElevationModifier: ViewModifier {
    let level: String; let radius: Double
    @Environment(\\.mavisTheme) private var theme
    func body(content: Content) -> some View {
        let shadow = theme.palette.metrics.shadow(level)
        content.background {
            MavisShadowShape(radius: radius, spread: shadow.spread, x: shadow.x, y: shadow.y)
                .fill(shadow.color).blur(radius: shadow.blur / 2)
                .allowsHitTesting(false).accessibilityHidden(true)
        }
    }
}
extension View {
    func mavisTypography(_ variant: String) -> some View { modifier(MavisTypographyModifier(variant: variant)) }
    func mavisElevation(_ level: String, radius: Double) -> some View { modifier(MavisElevationModifier(level: level, radius: radius)) }
}`
