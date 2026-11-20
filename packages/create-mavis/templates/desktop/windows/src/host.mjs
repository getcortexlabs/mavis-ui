import { nativeProps } from './contract.mjs'
import { createRequire } from 'node:module'
import { mavis, midnight } from '@getcortexlabs/mavis-core'
const { Windows, XamlWindow, native } = createRequire(import.meta.url)('@nativescript/windows-napi')
const Xaml = Windows.UI.Xaml
const C = Xaml.Controls
const emit = (listener, ...args) => {
  for (const fn of Array.isArray(listener) ? listener : [listener])
    if (typeof fn === 'function') fn(...args)
}
const text = (node) => node.text || node.children.map(text).join('')
const supported = {
  root: [],
  screen: ['scroll'],
  column: ['padding', 'gap'],
  row: ['padding', 'gap'],
  grid: ['minColumnWidth', 'gap'],
  text: ['text', 'as', 'variant', 'tone'],
  input: [
    'modelValue',
    'label',
    'placeholder',
    'readonly',
    'disabled',
    'onUpdate:modelValue',
    'onSubmit',
    'onEscape',
  ],
  reveal: ['show'],
  button: ['href', 'text', 'loading', 'loadingText', 'disabled', 'onClick'],
  link: ['href', 'text', 'disabled', 'onClick'],
  card: ['href', 'padding', 'gap', 'onClick', 'disabled'],
}

/** Explicit XAML Islands subset. NativeScript Core mobile widgets are not used on Windows. */
export function createHost({ title = '__MAVIS_NAME__', onClose = () => {} } = {}) {
  const window = new XamlWindow({ title, theme: 'light' })
  const root = {
    kind: 'root',
    text: '',
    props: {},
    children: [],
    parent: null,
    native: new C.Canvas(),
  }
  root.content = root.native
  window.content = root.native
  window.place({ width: 780, height: 620 })
  const nodes = new Set([root])
  let closed = false,
    scheduled = false,
    timer,
    theme = mavis
  const tokens = (key) => (typeof key === 'number' ? key : (theme.space[key] ?? 0))
  function create(kind) {
    if (!(kind in supported) && !['#text', '#comment'].includes(kind))
      throw new Error(`Windows desktop host does not implement ${kind}`)
    const node = { kind, text: '', props: {}, children: [], parent: null }
    nodes.add(node)
    if (kind[0] === '#') return node
    if (kind === 'text') {
      node.native = new C.TextBlock()
      node.native.TextWrapping = Xaml.TextWrapping.Wrap
    } else if (kind === 'input') {
      node.native = node.editor = new C.TextBox()
      node.native.TextChanged = () => {
        if (!node.updating && !closed) emit(node.props['onUpdate:modelValue'], node.editor.Text)
      }
      node.native.KeyDown = (_sender, event) => {
        if (event.Key === Windows.System.VirtualKey.Enter) emit(node.props.onSubmit)
        if (event.Key === Windows.System.VirtualKey.Escape) emit(node.props.onEscape)
      }
    } else if (['button', 'link', 'card'].includes(kind)) {
      node.native = new C.Button()
      node.native.HorizontalContentAlignment = Xaml.HorizontalAlignment.Stretch
      node.native.Click = () => {
        if (!closed && !node.props.disabled && !node.props.loading) emit(node.props.onClick)
      }
      if (kind === 'card') node.native.Content = node.content = new C.Canvas()
    } else if (kind === 'screen') {
      node.native = new C.ScrollViewer()
      node.native.VerticalScrollBarVisibility = C.ScrollBarVisibility.Auto
      node.native.HorizontalScrollBarVisibility = C.ScrollBarVisibility.Disabled
      node.native.Content = node.content = new C.Canvas()
    } else node.native = new C.Canvas()
    node.content ??= node.native
    node.dispose = () => {
      if (node.editor) {
        node.editor.TextChanged = null
        node.editor.KeyDown = null
      }
      if (['button', 'link', 'card'].includes(kind)) node.native.Click = null
      nodes.delete(node)
    }
    return node
  }
  function update(node) {
    if (!node.native || closed) return
    const p = node.props,
      view = node.native
    for (const key of Object.keys(p))
      if (!nativeProps(node.kind, 'windows').includes(key))
        throw new Error(`Windows desktop host does not implement ${node.kind}.${key}`)
    Xaml.Automation.AutomationProperties.SetAutomationId(view, String(p.id ?? ''))
    if (p.accessibilityLabel)
      Xaml.Automation.AutomationProperties.SetName(view, String(p.accessibilityLabel))
    if (node.kind === 'text') {
      view.Text = String(p.text ?? text(node))
      view.FontSize = { title: 28, heading: 20, caption: 12 }[p.variant] ?? 14
      // The system theme supplies contrast; tones remain textual semantics in this subset.
    }
    if (node.kind === 'input') {
      node.updating = true
      try {
        view.Header = String(p.label ?? '')
        if (view.Text !== String(p.modelValue ?? '')) view.Text = String(p.modelValue ?? '')
        view.PlaceholderText = String(p.placeholder ?? '')
        view.IsReadOnly = Boolean(p.readonly)
        view.IsEnabled = !p.disabled
      } finally {
        node.updating = false
      }
    }
    if (['button', 'link', 'card'].includes(node.kind)) {
      if (node.kind !== 'card')
        view.Content = String(p.loading ? (p.loadingText ?? 'Loading…') : (p.text ?? text(node)))
      view.IsEnabled = !p.disabled && !p.loading
    }
    if (node.kind === 'reveal') {
      node.shown = p.show !== false
      view.Visibility = node.shown ? Xaml.Visibility.Visible : Xaml.Visibility.Collapsed
    }
    if (node.kind === 'screen')
      view.VerticalScrollMode = p.scroll === false ? C.ScrollMode.Disabled : C.ScrollMode.Enabled
  }
  function detachNative(node) {
    const parent = node.attached
    if (parent) {
      const children = parent.content.Children
      // Rebuild from known native children: no reliance on WinRT object wrapper identity.
      children.Clear()
      for (const sibling of parent.children)
        if (sibling !== node && sibling.native) children.Append(sibling.native)
      node.attached = null
    }
  }
  function attach(node, parent) {
    if (!node.native) return
    if (node.attached && node.attached !== parent) detachNative(node)
    parent.content.Children.Clear()
    for (const sibling of parent.children)
      if (sibling.native) parent.content.Children.Append(sibling.native)
    node.attached = parent
  }
  function detach(node) {
    detachNative(node)
    nodes.delete(node)
  }
  function layoutNode(node, x, y, width, viewport) {
    if (!node.native) return 0
    const p = node.props,
      view = node.native
    let height = 0
    width = Math.max(0, width)
    if (node.kind === 'reveal' && !node.shown) height = 0
    else if (node.kind === 'text') {
      view.Width = width
      view.Measure({ Width: width, Height: 100000 })
      height = Math.max(20, view.DesiredSize.Height)
    } else if (node.kind === 'input') height = p.label ? 70 : 40
    else if (['button', 'link'].includes(node.kind)) height = 38
    else {
      const pad = tokens(p.padding ?? (node.kind === 'card' ? 'md' : 'none')),
        gap = tokens(p.gap)
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
      for (let i = 0; i < children.length; i += columns) {
        let rowHeight = 0
        for (let col = 0; col < columns && i + col < children.length; col++)
          rowHeight = Math.max(
            rowHeight,
            layoutNode(children[i + col], pad + col * (cellWidth + gap), top, cellWidth, viewport),
          )
        top += rowHeight + gap
      }
      height = top + pad - (children.length ? gap : 0)
      if (node.kind === 'screen') {
        node.content.Width = width
        node.content.Height = Math.max(viewport, height)
        height = viewport
      }
      if (node.kind === 'card') {
        node.content.Width = Math.max(0, width - 16)
        node.content.Height = height
        height += 16
      }
    }
    if (node.kind !== 'root') {
      C.Canvas.SetLeft(view, x)
      C.Canvas.SetTop(view, y)
      view.Width = width
      view.Height = Math.max(0, height)
    }
    return height
  }
  function layout() {
    if (closed || scheduled) return
    scheduled = true
    queueMicrotask(() => {
      scheduled = false
      if (!closed)
        layoutNode(root, 0, 0, root.native.ActualWidth || 780, root.native.ActualHeight || 620)
    })
  }
  root.native.SizeChanged = layout
  function setTheme(dark) {
    theme = dark ? midnight : mavis
    root.native.RequestedTheme = dark ? Xaml.ElementTheme.Dark : Xaml.ElementTheme.Light
    layout()
  }
  function stop() {
    if (closed) return
    closed = true
    clearInterval(timer)
    root.native.SizeChanged = null
    for (const node of nodes) node.dispose?.()
    nodes.clear()
  }
  window.on('closed', () => {
    onClose()
    stop()
  })
  function show() {
    window.show()
    timer = setInterval(() => native.pumpMessages(), 8)
    layout()
  }
  return {
    root,
    window,
    nodes,
    create,
    update,
    attach,
    detach,
    layout,
    show,
    stop,
    setTheme,
    close() {
      window.close()
    },
    get closed() {
      return closed
    },
  }
}
