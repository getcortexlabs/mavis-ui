import { nativeProps } from './contract.mjs'
import { mavis, midnight } from '@getcortexlabs/mavis-core'
import { opacityMotion } from './motion.mjs'

const rect = (x, y, width, height) => ({ origin: { x, y }, size: { width, height } })
const emit = (listener, ...args) => {
  for (const fn of Array.isArray(listener) ? listener : [listener])
    if (typeof fn === 'function') fn(...args)
}
const nativeColor = (hex) => {
  const rgb = Number.parseInt(hex.replace('#', '').slice(0, 6), 16)
  return NSColor.colorWithSRGBRedGreenBlueAlpha(
    (rgb >> 16) / 255,
    ((rgb >> 8) & 255) / 255,
    (rgb & 255) / 255,
    1,
  )
}

class MavisAppKitView extends NSView {
  static {
    NativeClass(this)
  }
  // The bridge overrides the Objective-C property name, not its isFlipped selector.
  get flipped() {
    return true
  }
}
class MavisAppKitCard extends NSButton {
  static {
    NativeClass(this)
  }
  hitTest(point) {
    return super.hitTest(point) ? this : null
  }
}
class MavisAppKitAction extends NSObject {
  static ObjCExposedMethods = {
    activate: { returns: interop.types.void, params: [interop.types.id] },
  }
  static {
    NativeClass(this)
  }
  activate() {
    this.callback?.()
  }
}
class MavisAppKitInputDelegate extends NSObject {
  static ObjCProtocols = [NSTextFieldDelegate]
  static {
    NativeClass(this)
  }
  controlTextDidChange() {
    this.change?.()
  }
  controlTextViewDoCommandBySelector(_control, _editor, selector) {
    if (selector === 'insertNewline:') {
      this.submit?.()
      return true
    }
    if (selector === 'cancelOperation:') {
      this.escape?.()
      return true
    }
    return false
  }
}
class MavisAppKitWindowDelegate extends NSObject {
  static ObjCProtocols = [NSWindowDelegate]
  static {
    NativeClass(this)
  }
  windowDidResize() {
    this.resize?.()
  }
  windowWillClose() {
    this.close?.()
  }
}

/** Small, explicit component host for the desktop starter, not the full Mavis renderer. */
export function createHost({ title = '__MAVIS_NAME__', onClose = () => {} } = {}) {
  const app = NSApplication.sharedApplication
  app.setActivationPolicy(NSApplicationActivationPolicy.Regular)
  const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
    rect(0, 0, 780, 620),
    NSWindowStyleMask.Titled |
      NSWindowStyleMask.Closable |
      NSWindowStyleMask.Miniaturizable |
      NSWindowStyleMask.Resizable,
    NSBackingStoreType.Buffered,
    false,
  )
  window.title = title
  window.releasedWhenClosed = false
  window.minSize = { width: 360, height: 380 }
  const rootView = MavisAppKitView.alloc().initWithFrame(rect(0, 0, 780, 620))
  window.contentView = rootView
  const root = {
    kind: 'root',
    text: '',
    props: {},
    children: [],
    parent: null,
    native: rootView,
    content: rootView,
  }
  const nodes = new Set([root])
  let theme = mavis,
    closed = false,
    scheduled = false,
    pumpTimer
  let reducedOverride = null
  const reduced = () =>
    reducedOverride ?? NSWorkspace.sharedWorkspace.accessibilityDisplayShouldReduceMotion
  const actions = [] // Cocoa targets/delegates are weak. Retain until their owner is disposed.
  const sheets = new Set()
  const tokens = (key) => (typeof key === 'number' ? key : (theme.space[key] ?? 0))
  const text = (node) => node.text || node.children.map(text).join('')
  const setBackground = (view, color) => {
    view.wantsLayer = true
    view.layer.backgroundColor = nativeColor(color).CGColor
  }
  function action(target, callback) {
    const delegate = MavisAppKitAction.new()
    delegate.callback = callback
    target.target = delegate
    target.action = 'activate'
    return delegate
  }
  function create(kind) {
    if (
      ![
        '#text',
        '#comment',
        'screen',
        'column',
        'row',
        'grid',
        'text',
        'input',
        'reveal',
        'button',
        'link',
        'card',
      ].includes(kind)
    )
      throw new Error(`AppKit desktop host does not implement ${kind}`)
    const node = { kind, text: '', props: {}, children: [], parent: null }
    nodes.add(node)
    if (kind[0] === '#') return node
    if (kind === 'text') {
      node.native = NSTextField.labelWithString('')
      node.native.lineBreakMode = NSLineBreakMode.ByWordWrapping
      node.native.maximumNumberOfLines = 0
    } else if (kind === 'input') {
      node.native = MavisAppKitView.new()
      node.label = NSTextField.labelWithString('')
      node.editor = NSTextField.new()
      node.editor.bezelStyle = NSTextFieldBezelStyle.RoundedBezel
      node.delegate = MavisAppKitInputDelegate.new()
      node.delegate.change = () => emit(node.props['onUpdate:modelValue'], node.editor.stringValue)
      node.delegate.submit = () => emit(node.props.onSubmit)
      node.delegate.escape = () => emit(node.props.onEscape)
      node.editor.delegate = node.delegate
      node.native.addSubview(node.label)
      node.native.addSubview(node.editor)
    } else if (['button', 'link', 'card'].includes(kind)) {
      node.native = kind === 'card' ? MavisAppKitCard.new() : NSButton.new()
      node.native.setButtonType(NSButtonType.MomentaryPushIn)
      node.native.bezelStyle = NSBezelStyle.Rounded
      node.delegate = action(node.native, () => emit(node.props.onClick))
      if (kind === 'link') node.native.bordered = false
      if (kind === 'card') {
        node.content = MavisAppKitView.new()
        node.native.addSubview(node.content)
      }
    } else if (kind === 'screen') {
      node.native = NSScrollView.new()
      node.native.hasVerticalScroller = true
      node.native.autohidesScrollers = true
      node.native.drawsBackground = false
      node.content = MavisAppKitView.new()
      node.native.documentView = node.content
    } else node.native = MavisAppKitView.new()
    node.content ??= node.native
    node.native.wantsLayer = true
    node.dispose = () => {
      node.motion?.cancel()
      if (node.editor) node.editor.delegate = null
      if (node.delegate) {
        node.delegate.callback =
          node.delegate.change =
          node.delegate.submit =
          node.delegate.escape =
            null
        if ('target' in node.native) node.native.target = null
        node.delegate = null
      }
      nodes.delete(node)
    }
    return node
  }
  function update(node) {
    if (!node.native || closed) return
    const p = node.props,
      view = node.native
    for (const key of Object.keys(p))
      if (!nativeProps(node.kind, 'macos').includes(key))
        throw new Error(`AppKit desktop host does not implement ${node.kind}.${key}`)
    const identifier = String(p.id ?? '')
    view.accessibilityIdentifier = identifier
    if (p.accessibilityLabel) view.accessibilityLabel = p.accessibilityLabel
    if (node.kind === 'text') {
      view.stringValue = p.text ?? text(node)
      const size = { title: 28, heading: 20, caption: 12 }[p.variant] ?? 14
      view.font =
        p.variant === 'title' || p.variant === 'heading'
          ? NSFont.boldSystemFontOfSize(size)
          : NSFont.systemFontOfSize(size)
      view.textColor = nativeColor(
        theme.colors[p.tone === 'muted' ? 'muted' : p.tone === 'success' ? 'success' : 'text'],
      )
    }
    if (node.kind === 'input') {
      node.label.stringValue = String(p.label ?? '')
      node.label.textColor = nativeColor(theme.colors.text)
      const value = String(p.modelValue ?? '')
      // Re-rendering unrelated state must not reset the editor's selection/caret.
      if (node.editor.stringValue !== value) node.editor.stringValue = value
      node.editor.placeholderString = String(p.placeholder ?? '')
      node.editor.editable = !p.readonly && !p.disabled
      node.editor.enabled = !p.disabled
      node.editor.accessibilityIdentifier = identifier
      node.editor.accessibilityLabel = String(p.label ?? '')
    }
    if (['button', 'link', 'card'].includes(node.kind)) {
      view.title =
        node.kind === 'card'
          ? ''
          : String(p.loading ? (p.loadingText ?? 'Loading…') : (p.text ?? text(node)))
      view.enabled = !p.disabled && !p.loading
      view.keyEquivalent = p.shortcut === 'mod+s' ? 's' : ''
      if (node.kind === 'card') {
        setBackground(node.content, theme.colors.surface)
        node.content.layer.cornerRadius = 10
      }
    }
    if (node.kind === 'reveal') {
      const shown = p.show !== false
      if (node.shown !== shown) {
        node.motion?.cancel()
        node.shown = shown
        view.hidden = !shown
        node.pendingReveal = shown
      }
    }
  }
  function attach(node, parent) {
    if (!node.native) return
    const host = parent.content
    if (host && node.native.superview !== host) host.addSubview(node.native)
  }
  function detach(node) {
    node.native?.removeFromSuperview()
    nodes.delete(node)
  }
  function layoutNode(node, x, y, width, viewport = 0) {
    if (!node.native) return 0
    if (node.kind === 'reveal' && !node.shown) {
      node.native.frame = rect(x, y, width, 0)
      return 0
    }
    const p = node.props
    let height = 0
    if (node.kind === 'text') {
      height = Math.ceil(node.native.cell.cellSizeForBounds(rect(0, 0, width, 10000)).height) + 2
    } else if (node.kind === 'input') {
      const label = p.label ? 20 : 0
      node.label.frame = rect(0, 0, width, label)
      node.editor.frame = rect(0, label + 4, width, 28)
      height = label + 36
    } else if (node.kind === 'button' || node.kind === 'link') height = 34
    else {
      const pad = tokens(p.padding ?? (node.kind === 'card' ? 'md' : 'none'))
      const gap = tokens(p.gap)
      const children = node.children.filter(
        (child) => child.native && !(child.kind === 'reveal' && !child.shown),
      )
      const columns =
        node.kind === 'grid'
          ? Math.max(
              1,
              Math.floor((width - pad * 2 + gap) / (Number(p.minColumnWidth ?? 240) + gap)),
            )
          : node.kind === 'row'
            ? Math.max(1, children.length)
            : 1
      const cellWidth = (width - pad * 2 - gap * (columns - 1)) / columns
      let top = pad
      for (let index = 0; index < children.length; index += columns) {
        let rowHeight = 0
        for (let col = 0; col < columns && index + col < children.length; col++)
          rowHeight = Math.max(
            rowHeight,
            layoutNode(
              children[index + col],
              pad + col * (cellWidth + gap),
              top,
              cellWidth,
              viewport,
            ),
          )
        top += rowHeight + gap
      }
      height = top + pad - (children.length ? gap : 0)
      if (node.kind === 'screen') {
        node.content.frame = rect(0, 0, width, Math.max(viewport, height))
        height = viewport
      } else if (node.kind === 'card') node.content.frame = rect(4, 4, width - 8, height)
    }
    if (node.kind === 'root') height = viewport
    node.native.frame = rect(x, y, width, Math.max(height, 0))
    return height
  }
  function layout() {
    if (scheduled || closed) return
    scheduled = true
    queueMicrotask(() => {
      scheduled = false
      if (closed) return
      const { width, height } = window.contentView.bounds.size
      layoutNode(root, 0, 0, width, height)
      for (const node of nodes) {
        if (node.pendingReveal && node.native.window) {
          node.pendingReveal = false
          node.motion = opacityMotion(node.native, 0, 1, reduced())
        }
      }
      window.recalculateKeyViewLoop()
    })
  }
  function setTheme(dark) {
    theme = dark ? midnight : mavis
    window.appearance = NSAppearance.appearanceNamed(
      dark ? 'NSAppearanceNameDarkAqua' : 'NSAppearanceNameAqua',
    )
    window.backgroundColor = nativeColor(theme.colors.background)
    for (const node of nodes) update(node)
    layout()
  }
  function stop() {
    if (closed) return
    closed = true
    clearTimeout(pumpTimer)
    for (const sheet of sheets) window.endSheetReturnCode(sheet.window, NSModalResponseCancel)
    sheets.clear()
    NSWorkspace.sharedWorkspace.notificationCenter.removeObserver(accessibilityObserver)
    for (const node of nodes) node.dispose?.()
    nodes.clear()
    window.delegate = null
    delegate.resize = delegate.close = null
    for (const target of actions) target.callback = null
    app.mainMenu = null
  }
  const delegate = MavisAppKitWindowDelegate.new()
  delegate.resize = layout
  delegate.close = () => {
    onClose()
    stop()
  }
  window.delegate = delegate
  const menu = NSMenu.new()
  function addMenu(name, items) {
    const submenu = NSMenu.alloc().initWithTitle(name)
    for (const [label, selector, key, callback] of items) {
      const item = submenu.addItemWithTitleActionKeyEquivalent(label, selector, key)
      if (callback) actions.push(action(item, callback))
    }
    const item = NSMenuItem.new()
    item.submenu = submenu
    menu.addItem(item)
  }
  addMenu('Mavis', [['Quit Mavis', 'activate:', 'q', () => window.performClose(null)]])
  addMenu('Edit', [
    ['Undo', 'undo:', 'z'],
    ['Redo', 'redo:', 'Z'],
    ['Cut', 'cut:', 'x'],
    ['Copy', 'copy:', 'c'],
    ['Paste', 'paste:', 'v'],
    ['Select All', 'selectAll:', 'a'],
  ])
  addMenu('View', [['Toggle theme', 'activate:', 't', () => setTheme(theme === mavis)]])
  function openInfoSheet() {
    const sheet = NSAlert.new()
    sheet.messageText = 'Community directory'
    sheet.informativeText =
      'Find a place to learn, create or meet your neighbours. Changes are saved on this Mac.'
    sheet.addButtonWithTitle('Done')
    sheet.addButtonWithTitle('Cancel')
    sheets.add(sheet)
    sheet.beginSheetModalForWindowCompletionHandler(window, () => sheets.delete(sheet))
    return sheet
  }
  addMenu('Help', [['About Community directory', 'activate:', '', openInfoSheet]])
  app.mainMenu = menu
  setTheme(false)
  function show() {
    app.finishLaunching()
    window.center()
    window.makeKeyAndOrderFront(null)
    app.activateIgnoringOtherApps(true)
    const pump = () => {
      if (closed) return
      for (let i = 0; i < 64; i++) {
        const event = app.nextEventMatchingMaskUntilDateInModeDequeue(
          NSEventMask.Any,
          null,
          'kCFRunLoopDefaultMode',
          true,
        )
        if (!event) break
        app.sendEvent(event)
      }
      app.updateWindows()
      pumpTimer = setTimeout(pump, 4)
    }
    pump()
    layout()
  }
  function setReducedMotion(value) {
    reducedOverride = value
    if (reduced())
      for (const node of nodes)
        if (node.kind === 'reveal' && node.shown) {
          node.motion?.cancel()
          node.motion = opacityMotion(node.native, 1, 1, true)
        }
  }
  const accessibilityObserver =
    NSWorkspace.sharedWorkspace.notificationCenter.addObserverForNameObjectQueueUsingBlock(
      'NSWorkspaceAccessibilityDisplayOptionsDidChangeNotification',
      null,
      null,
      () => setReducedMotion(reducedOverride),
    )
  return {
    root,
    window,
    nodes,
    sheets,
    create,
    update,
    attach,
    detach,
    layout,
    show,
    close() {
      window.performClose(null)
    },
    stop,
    setTheme,
    addMenu,
    openInfoSheet,
    setReducedMotion,
    get closed() {
      return closed
    },
  }
}
