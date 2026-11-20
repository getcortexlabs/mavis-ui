import {
  GridLayout,
  Label,
  FormattedString,
  Span,
  isAndroid,
  type View,
  type EventData,
  type PropertyChangeData,
  type TextField,
  type TextView,
} from '@nativescript/core'
import {
  fontFamily,
  iconFontFamily,
  iconGlyph,
  iconSizes,
  checkIconOnly,
  inputActionSize,
  resolveDimension,
  resolveRadius,
  resolveSpace,
  nonNegative,
  validateInput,
  type MavisTheme,
} from '@getcortexlabs/mavis-core'
import { resolvePerspective } from '@getcortexlabs/mavis-core/experimental'
import { MavisButton } from '../native/button'
import { MavisTextField } from '../native/text-field'
import { MavisTextView } from '../native/text-view'
import { attachPressFeedback } from '../native/press.js'
import { createNativeMotionSurface } from '../native/motion-binding.js'
import { attachNativeMotionRegion } from '../native/motion-region.js'
import { nativeDestination, navigateNative } from '../native/navigation.js'
import { keepEditingOn } from '../native/input-action'
import { MavisThemeScope } from './theme.js'
import {
  normalizeComponentProps,
  type NativeComponentName,
  type NativeComponentProps,
  type NativeComponentEvents,
  type MBoxProps,
  type MRowProps,
  type MColumnProps,
  type MButtonProps,
  type MInputProps,
  type MTextProps,
} from './contracts.js'
import { nativeBoxStyle, nativeButtonStyle, nativeTextStyle } from './style.js'

const controllers = new WeakMap<View, NativeComponentController>()
const alignment = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' }
const distribution = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
}
const style = (view: View, values: object) => Object.assign(view.style, values)

/** Owns only a view's presentation and native subscriptions, never application state. */
export class NativeComponentController {
  props: Record<string, unknown> = {}
  events: NativeComponentEvents = {}
  private contentText = ''
  private defaultScope = new MavisThemeScope()
  private scope = this.defaultScope
  private offTheme?: () => void
  private press?: ReturnType<typeof attachPressFeedback>
  private offRegion?: () => void
  private offAction?: () => void
  private ready = false
  private loaded = false
  private disposed = false
  private painting = false
  private focused = false
  private focusFeedback?: ReturnType<typeof setTimeout>
  private editor?: TextField | TextView
  private title?: Label
  private message?: Label
  private leading?: Label
  private trailing?: Label
  private action?: InstanceType<typeof MavisButton>
  private subscriptions: Array<() => void> = []
  private editorSubscriptions: Array<() => void> = []
  private motion = createNativeMotionSurface(
    () => (this.props as MBoxProps).motionSurface,
    () => this.enabled,
    () => this.name === 'MText',
    false,
    () => resolvePerspective((this.props as MBoxProps).perspective),
  )

  constructor(
    readonly view: View,
    readonly name: NativeComponentName,
  ) {
    controllers.set(view, this)
    this.listen(view, 'loaded', this.load)
    this.listen(view, 'unloaded', this.unload)
    if (name === 'MButton') this.listen(view, 'tap', this.activate)
  }

  get enabled() {
    return !this.props.disabled && !this.props.loading
  }
  get theme() {
    return this.scope.theme
  }
  get themeScope() {
    return this.scope
  }
  setContentText(text: string) {
    this.contentText = text
    this.render()
  }

  setTheme(scope: MavisThemeScope | undefined) {
    scope ??= this.defaultScope
    if (scope === this.scope) return
    this.offTheme?.()
    this.scope = scope
    this.offTheme = this.loaded ? this.scope.subscribe(this.render) : undefined
    this.render()
  }

  setProps(props: NativeComponentProps<NativeComponentName>) {
    if (this.disposed) throw new Error('Cannot update a disposed Mavis component')
    const previous = this.props
    const next = normalizeComponentProps(this.name, props) as Record<string, unknown>
    if (this.name === 'MInput') validateInput(next as Required<MInputProps>)
    // These are separate component compositions, not aliases for a plain button.
    if (this.name === 'MButton' && next.reorderHandle)
      throw new TypeError(
        'Native foundation MButton does not implement reorderHandle; use the declared component capability',
      )
    if (this.name === 'MButton' && next.loadingIndicator !== 'none')
      throw new TypeError(
        'Native foundation MButton supports loading text; loadingIndicator must be none',
      )
    this.props = next
    this.ready = true
    if (this.name === 'MInput' && (this.props.disabled || this.props.readonly)) this.blur()
    this.render()
    if (this.loaded) {
      if (previous.motionSurface !== this.props.motionSurface) this.motion.refresh()
      if (previous.motionRegion !== this.props.motionRegion) this.bindRegion()
      this.motion.refreshEnabled()
      this.motion.refreshPerspective()
    }
  }

  private listen(view: View, event: string, listener: (event: EventData) => void) {
    view.on(event, listener)
    this.subscriptions.push(() => view.off(event, listener))
  }

  private load = () => {
    if (this.disposed || this.loaded) return
    this.loaded = true
    this.offTheme = this.scope.subscribe(this.render)
    this.render()
    this.bindRegion()
    this.motion.onLoaded({ object: this.view, eventName: 'loaded' })
  }

  private bindRegion() {
    this.offRegion?.()
    this.offRegion = undefined
    const region = (this.props as MBoxProps).motionRegion
    if (region && this.loaded) this.offRegion = attachNativeMotionRegion(region, this.view)
  }

  private unload = () => {
    this.loaded = false
    this.offTheme?.()
    this.offTheme = undefined
    this.press?.()
    this.press = undefined
    this.offRegion?.()
    this.offRegion = undefined
    this.offAction?.()
    this.offAction = undefined
    this.motion.onUnloaded()
    clearTimeout(this.focusFeedback)
    this.focusFeedback = undefined
    this.focused = false
  }

  dispose() {
    if (this.disposed) return
    this.unload()
    this.disposed = true
    for (const off of this.subscriptions.splice(0)) off()
    for (const off of this.editorSubscriptions.splice(0)) off()
    this.events = {}
    controllers.delete(this.view)
  }

  focus() {
    if (this.loaded && this.editor && !this.props.disabled && !this.props.readonly)
      this.editor.focus()
  }
  blur() {
    this.editor?.dismissSoftInput()
    this.editor?.android?.clearFocus()
  }
  focusAction() {
    if (this.loaded && this.action?.isEnabled) this.action.focus()
  }

  private activate = () => {
    if (!this.loaded || !this.enabled || !this.motion.allowsActivation()) return
    this.events.activate?.()
    const props = this.props as MButtonProps
    if (props.href !== undefined)
      void navigateNative(props).catch((error) => this.events.error?.(error))
  }

  private shrink() {
    const parent = this.view.parent as View | undefined
    return parent && controllers.get(parent)?.name === 'MRow' ? 1 : 0
  }

  private render = () => {
    if (!this.ready || this.disposed || this.painting) return
    this.painting = true
    try {
      const props = this.props
      const theme = this.theme
      this.view.id = (props.id as string | undefined) ?? ''
      this.view.accessibilityHidden = (props.accessibilityHidden as boolean | undefined) ?? false
      this.view.automationText = (props.id as string | undefined) ?? ''
      if (this.name === 'MBox' || this.name === 'MRow' || this.name === 'MColumn') {
        style(this.view, nativeBoxStyle(theme, props as MBoxProps, this.shrink()))
        this.view.accessibilityLabel = (props.accessibilityLabel as string | undefined) ?? ''
        if (this.name !== 'MBox') {
          const layout = props as Required<MRowProps | MColumnProps>
          style(this.view, {
            flexDirection: this.name === 'MRow' ? 'row' : 'column',
            alignItems: alignment[layout.align],
            justifyContent: distribution[layout.justify],
            flexWrap: layout.wrap ? 'wrap' : 'nowrap',
            gap: resolveSpace(theme, layout.gap ?? 'none'),
          })
        }
      } else if (this.name === 'MText') {
        const text = props as Required<MTextProps>
        const label = this.view as Label
        label.text = text.text ?? this.contentText
        label.textWrap = text.wrap
        label.accessibilityLabel = text.accessibilityLabel ?? label.text
        label.accessibilityRole = /^h[1-6]$/.test(text.as) ? 'header' : 'text'
        style(label, {
          ...nativeTextStyle(theme, text, this.shrink()),
          verticalAlignment:
            controllers.get(label.parent as View)?.name === 'MBox' ? 'top' : 'stretch',
        })
      } else if (this.name === 'MButton') {
        this.paintButton(theme)
      } else this.paintInput(theme)
    } finally {
      this.painting = false
    }
  }

  private paintButton(theme: MavisTheme) {
    const props = this.props as Required<MButtonProps>
    if (props.href !== undefined) nativeDestination(props)
    const button = this.view as InstanceType<typeof MavisButton>
    const text = props.loading ? props.loadingText : (props.text ?? this.contentText)
    checkIconOnly(text, !!(props.icon || props.trailingIcon), props.accessibilityLabel)
    button.text = text
    button.textWrap = true
    button.isEnabled = this.enabled
    button.accessibilityRole = props.href === undefined ? 'button' : 'link'
    button.accessibilityLabel = props.accessibilityLabel ?? text
    button.accessibilityValue = props.accessibilityLabel ? text : ''
    button.accessibilityState = this.enabled ? '' : 'disabled'
    style(button, nativeButtonStyle(theme, props, this.shrink()))
    if (props.icon || props.trailingIcon) {
      const formatted = new FormattedString()
      const add = (text: string, icon = false) => {
        const span = new Span()
        span.text = text
        if (icon) {
          span.fontFamily = iconFontFamily
          span.fontSize = iconSizes[props.size]
        }
        formatted.spans.push(span)
      }
      if (props.icon) add(iconGlyph(props.icon), true)
      if (text) add(`${props.icon ? ' ' : ''}${text}${props.trailingIcon ? ' ' : ''}`)
      if (props.trailingIcon) add(iconGlyph(props.trailingIcon), true)
      button.formattedText = formatted
    } else button.formattedText = null as unknown as FormattedString
    if (this.loaded && this.enabled) {
      if (this.press) this.press.update(theme.motion)
      else this.press = attachPressFeedback(button, theme.motion)
    } else {
      this.press?.()
      this.press = undefined
    }
  }

  private createEditor(multiline: boolean) {
    this.offAction?.()
    this.offAction = undefined
    for (const off of this.editorSubscriptions.splice(0)) off()
    const root = this.view as GridLayout
    if (this.editor) root.removeChild(this.editor)
    const editor = multiline ? new MavisTextView() : new MavisTextField()
    this.editor = editor
    const listen = (event: string, fn: (event: EventData) => void) => {
      editor.on(event, fn)
      this.editorSubscriptions.push(() => editor.off(event, fn))
    }
    GridLayout.setRow(editor, 1)
    root.addChild(editor)
    listen('textChange', (event: EventData) => {
      if (this.painting || !this.loaded || this.props.disabled || this.props.readonly) return
      const value = String((event as PropertyChangeData).value ?? '')
      if (value === this.props.modelValue) return
      this.events.valueChange?.(value)
      // A declined controlled edit must not become independent application state.
      void Promise.resolve().then(() => {
        if (this.loaded && this.editor === editor) this.render()
      })
    })
    listen('focus', () => {
      if (!this.loaded) return
      clearTimeout(this.focusFeedback)
      if (editor.android) {
        this.focusFeedback = setTimeout(() => {
          if (this.loaded && editor.android?.hasFocus()) {
            this.focused = true
            this.render()
          }
        }, 0)
      } else {
        this.focused = true
        this.render()
      }
      this.events.focus?.()
    })
    listen('blur', () => {
      clearTimeout(this.focusFeedback)
      this.focused = false
      this.render()
      if (this.loaded) this.events.blur?.()
    })
    if (!multiline)
      listen('returnPress', () => {
        if (
          this.loaded &&
          !this.props.disabled &&
          !this.props.readonly &&
          !editor.ios?.markedTextRange
        )
          this.events.submit?.(editor.text ?? '')
      })
  }

  private paintInput(theme: MavisTheme) {
    const props = this.props as Required<MInputProps>
    const root = this.view as GridLayout
    if (!this.title) {
      root.rows = 'auto,auto,auto'
      this.title = new Label()
      this.title.accessibilityHidden = true
      this.message = new Label()
      this.message.textWrap = true
      GridLayout.setRow(this.message, 2)
      root.addChild(this.title)
      root.addChild(this.message)
    }
    if (!this.editor || this.editor instanceof MavisTextView !== props.multiline)
      this.createEditor(props.multiline)
    const editor = this.editor!
    const tokens = theme.components.input
    const fontSize = tokens.fontSize ?? theme.typography.body.fontSize
    const message = props.error || props.helperText
    this.title.text = props.label
    style(this.title, { ...nativeTextStyle(theme, { variant: 'caption' }), fontWeight: '600' })
    this.message!.text = message
    this.message!.visibility = message ? 'visible' : 'collapse'
    style(this.message!, {
      ...nativeTextStyle(theme, { variant: 'caption', tone: props.error ? 'danger' : 'muted' }),
      marginTop: theme.space.sm,
    })
    style(root, {
      width: resolveDimension(props.width) ?? 'auto',
      flexGrow: nonNegative(props.grow, 'grow'),
      flexShrink: nonNegative(props.shrink ?? this.shrink(), 'shrink'),
      minWidth: 0,
      opacity: props.disabled ? 0.5 : 1,
    })
    if (editor.text !== props.modelValue) editor.text = props.modelValue
    editor.id = props.id ?? ''
    editor.automationText = props.id ?? ''
    root.id = props.id ? `${props.id}-field` : ''
    root.automationText = root.id
    editor.hint = props.placeholder
    editor.editable = !props.disabled && !props.readonly
    editor.isEnabled = !props.disabled
    editor.isUserInteractionEnabled = !props.disabled
    editor.accessibilityLabel = props.label
    editor.accessibilityHint = message
    editor.accessibilityHidden = props.accessibilityHidden ?? false
    editor.updateTextTrigger = 'textChanged'
    if (!props.multiline) {
      const field = editor as TextField
      field.secure = props.type === 'password'
      field.closeOnReturn = false
      field.returnKeyType = props.returnKey
    }
    editor.set(
      'keyboardType',
      props.inputmode === 'decimal'
        ? 'decimal'
        : props.inputmode === 'numeric'
          ? 'number'
          : props.type === 'tel'
            ? 'phone'
            : props.type === 'email' || props.type === 'url'
              ? props.type
              : undefined,
    )
    const text = props.type === 'text' || props.type === 'search'
    const capitalize = props.autocapitalize ?? (text ? 'sentences' : 'none')
    editor.autocapitalizationType = capitalize === 'characters' ? 'allcharacters' : capitalize
    editor.autocorrect = props.autocorrect ?? text
    editor.maxLength = props.maxLength ?? Infinity
    const inset = tokens.paddingX + iconSizes.md + 10
    style(editor, {
      minWidth: 0,
      minHeight: props.multiline
        ? props.rows * fontSize * tokens.lineHeight + tokens.paddingY * 2 + 2
        : Math.max(theme.control.md.height, props.trailingAction ? inputActionSize + 8 : 0),
      paddingTop: tokens.paddingY,
      paddingBottom: tokens.paddingY,
      paddingLeft: props.icon ? inset : tokens.paddingX,
      paddingRight: props.trailingAction
        ? Math.max(inputActionSize + 12, tokens.paddingX)
        : props.trailingIcon
          ? inset
          : tokens.paddingX,
      margin: 0,
      marginTop: theme.space.sm,
      fontSize,
      fontFamily: fontFamily(
        tokens.fontFamily ?? theme.typography.body.fontFamily,
        isAndroid ? 'android' : 'ios',
      ),
      fontWeight: tokens.fontWeight,
      lineHeight: fontSize * (tokens.lineHeight - 1),
      color: theme.colors.text,
      placeholderColor: theme.colors.muted,
      backgroundColor: props.readonly ? theme.colors.elevated : theme.colors.surface,
      borderColor: props.error
        ? theme.colors.danger
        : this.focused
          ? theme.colors.primary
          : theme.colors.border,
      borderWidth: 2,
      borderRadius: resolveRadius(theme, tokens.radius),
    })
    const icon = (key: 'leading' | 'trailing', name: MInputProps['icon']) => {
      let view = this[key]
      if (!view && name) {
        view = this[key] = new Label()
        view.accessibilityHidden = true
        view.isUserInteractionEnabled = false
        GridLayout.setRow(view, 1)
        root.addChild(view)
      }
      if (!view) return
      view.visibility = name ? 'visible' : 'collapse'
      view.text = name ? iconGlyph(name) : ''
      style(view, {
        fontFamily: iconFontFamily,
        fontSize: iconSizes.md,
        color: props.error ? theme.colors.danger : theme.colors.muted,
        horizontalAlignment: key === 'leading' ? 'left' : 'right',
        verticalAlignment: props.multiline ? 'top' : 'middle',
        marginLeft: key === 'leading' ? tokens.paddingX : 0,
        marginRight: key === 'trailing' ? tokens.paddingX : 0,
        marginTop: theme.space.sm + (props.multiline ? 14 : 0),
      })
    }
    icon('leading', props.icon)
    icon('trailing', props.trailingIcon)
    const action = props.trailingAction
    if (action && !this.action) {
      this.action = new MavisButton()
      GridLayout.setRow(this.action, 1)
      root.addChild(this.action)
      this.listen(this.action, 'tap', () => {
        if (
          this.loaded &&
          !this.props.disabled &&
          !this.props.readonly &&
          !!(this.props as MInputProps).trailingAction &&
          !(this.props as MInputProps).trailingAction?.disabled
        )
          this.events.action?.()
      })
    }
    if (this.action) {
      this.action.visibility = action ? 'visible' : 'collapse'
      this.action.isEnabled = !!action && !props.disabled && !props.readonly && !action.disabled
      this.action.accessibilityLabel = action?.label ?? ''
      this.action.text = action ? iconGlyph(action.icon) : ''
      style(this.action, {
        fontFamily: iconFontFamily,
        fontSize: iconSizes.md,
        color: theme.colors.text,
        backgroundColor: 'transparent',
        borderWidth: 0,
        width: inputActionSize,
        minHeight: inputActionSize,
        padding: 0,
        margin: 0,
        marginRight: 4,
        marginTop: theme.space.sm + (props.multiline ? 4 : 0),
        horizontalAlignment: 'right',
        verticalAlignment: props.multiline ? 'top' : 'middle',
      })
      if (this.loaded && action && !this.offAction)
        this.offAction = keepEditingOn(this.action, () => this.editor)
      if (!action) {
        this.offAction?.()
        this.offAction = undefined
      }
    }
  }
}

export function nativeComponentController(view: View) {
  return controllers.get(view)
}
