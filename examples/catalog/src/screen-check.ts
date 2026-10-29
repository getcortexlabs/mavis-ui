import {
  Application,
  Frame,
  ScrollView,
  TextField,
  View,
  knownFolders,
  isIOS,
  Utils,
} from '@nativescript/core'
import type { Bounds } from '../../../test/layout-contract'
import { router } from './router'

declare const UIWindowSceneGeometryPreferencesIOS: {
  alloc(): { initWithInterfaceOrientations(mask: number): unknown }
}
declare const android: {
  view: { WindowInsets: { Type: { systemBars(): number; ime(): number } } }
}
interface KeyboardRect {
  origin: { x: number; y: number }
  size: { width: number; height: number }
}
interface Sample {
  stage: string
  page: string
  viewport?: Bounds & { offset: number; inset: number }
  available: Bounds
  keyboardTop?: number
  views: Record<string, Bounds>
  text?: string
  events: string[]
  failures: string[]
}
const stages = [
  'initial',
  'scrolled',
  'bottom',
  'editing',
  'next',
  'back',
  'editing-again',
  'dismissed',
  'landscape',
  'landscape-editing',
  'portrait',
  'resumed',
]
const samples: Sample[] = []
const events: string[] = []
const suspended = () => events.push('suspend')
const resumed = () => events.push('resume')
Application.on(Application.suspendEvent, suspended)
Application.on(Application.resumeEvent, resumed)
let keyboard: KeyboardRect | undefined
const notification = 'UIKeyboardDidChangeFrameNotification'
const observer = isIOS
  ? Application.ios.addNotificationObserver(notification, (event) => {
      keyboard = event.userInfo.objectForKey('UIKeyboardFrameEndUserInfoKey').CGRectValue
    })
  : undefined
let hiddenScroll: ScrollView | undefined
const hiddenNotification = 'UIKeyboardDidHideNotification'
const hiddenObserver = isIOS
  ? Application.ios.addNotificationObserver(hiddenNotification, () => {
      keyboard = undefined
    })
  : undefined
let waitingForResume = 0

function rotate(landscape: boolean) {
  if (isIOS) {
    const preferences = UIWindowSceneGeometryPreferencesIOS.alloc().initWithInterfaceOrientations(
      landscape ? 24 : 2,
    )
    Application.ios.window.windowScene.requestGeometryUpdateWithPreferencesErrorHandler(
      preferences,
      (error: { localizedDescription: string }) => console.error(error.localizedDescription),
    )
  } else Application.android.foregroundActivity.setRequestedOrientation(landscape ? 0 : 1)
}

// Only included by --env.screenCheck. The external runner handles background/resume.
const timer = setInterval(() => {
  const page = Frame.topmost()?.currentPage
  if (!page || Application.suspended) return
  const index = samples.length
  if (index === 11 && events.filter((event) => event === 'resume').length <= waitingForResume)
    return
  const views: Record<string, Bounds> = {}
  let scroll: ScrollView | undefined
  let field: TextField | undefined
  function visit(view: View) {
    if (view instanceof ScrollView) scroll = view
    if (view instanceof TextField) field = view
    const location = view.getLocationInWindow()
    if (view.id && location) views[view.id] = { ...view.getActualSize(), ...location }
    view.eachChild((child) => {
      if (child instanceof View) visit(child)
      return true
    })
  }
  visit(page)
  let available: Bounds
  let keyboardTop: number | undefined
  if (isIOS) {
    const window = page.ios.view.window
    const insets = window.safeAreaInsets
    available = {
      x: insets.left,
      y: insets.top,
      width: window.bounds.size.width - insets.left - insets.right,
      height: window.bounds.size.height - insets.top - insets.bottom,
    }
    if (keyboard) {
      const frame = window.convertRectFromCoordinateSpace(keyboard, window.screen.coordinateSpace)
      if (frame.origin.y < window.bounds.size.height) keyboardTop = frame.origin.y
    }
  } else {
    const decor = Application.android.foregroundActivity.getWindow().getDecorView()
    const insets = decor.getRootWindowInsets()
    const bars = insets.getInsets(android.view.WindowInsets.Type.systemBars())
    const dip = Utils.layout.toDeviceIndependentPixels
    available = {
      x: dip(bars.left),
      y: dip(bars.top),
      width: dip(decor.getWidth() - bars.left - bars.right),
      height: dip(decor.getHeight() - bars.top - bars.bottom),
    }
    if (insets.isVisible(android.view.WindowInsets.Type.ime()))
      keyboardTop = dip(
        decor.getHeight() - insets.getInsets(android.view.WindowInsets.Type.ime()).bottom,
      )
  }
  const viewport = scroll
    ? {
        ...scroll.getActualSize(),
        ...scroll.getLocationInWindow()!,
        offset: scroll.verticalOffset,
        inset: isIOS ? scroll.ios.contentInset.bottom : 0,
      }
    : undefined
  const failures: string[] = []
  const check = (valid: boolean, message: string) => {
    if (!valid) failures.push(message)
  }
  const inside = (outer: Bounds, inner: Bounds | undefined) =>
    Boolean(
      inner &&
      inner.width > 0 &&
      inner.height > 0 &&
      inner.x >= outer.x - 1 &&
      inner.y >= outer.y - 1 &&
      inner.x + inner.width <= outer.x + outer.width + 1 &&
      inner.y + inner.height <= outer.y + outer.height + 1,
    )
  check(page.id === (index === 4 ? 'screen-next' : 'screen-check'), 'Unexpected destination')
  if (viewport) check(inside(available, viewport), 'Scroll viewport crosses a safe-area edge')
  if (index === 0) check(inside(available, views['screen-heading']), 'Heading outside safe area')
  if (index === 2) check(inside(available, views['screen-end']), 'End of content cannot be reached')
  if ([3, 6, 9].includes(index) || (index === 11 && keyboardTop !== undefined)) {
    check(
      keyboardTop !== undefined && keyboardTop < available.y + available.height,
      'Docked software keyboard did not appear',
    )
    const visible = { ...available, height: (keyboardTop ?? available.y) - available.y }
    check(inside(visible, views['session-name']), 'Focused field is covered by the keyboard')
  }
  if ([4, 7, 10].includes(index))
    check(keyboardTop === undefined, 'Keyboard remains visible after dismissal/navigation')
  if (index >= 5) check(field?.text === 'Sessão de teste', 'Page state lost on return/resume')
  if (index === 4 && isIOS)
    check(
      !hiddenScroll?.isLoaded && hiddenScroll?.ios.contentInset.bottom === 0,
      'Hidden screen retained keyboard adjustment',
    )
  if ([7, 10].includes(index) && viewport) {
    check(
      Math.abs(viewport.height - samples[0]!.viewport!.height) < 1,
      'Viewport did not recover its original height',
    )
    check(viewport.inset === 0, 'Keyboard inset was not restored')
  }
  if (index === 8) check(available.width > samples[0]!.available.width, 'Landscape was not applied')
  samples.push({
    stage: stages[index]!,
    page: page.id,
    viewport,
    available,
    keyboardTop,
    views,
    text: field?.text,
    events: [...events],
    failures,
  })
  knownFolders.documents().getFile('screen-check.json').writeTextSync(JSON.stringify(samples))
  console.log('MAVIS_SCREEN ' + JSON.stringify({ stage: stages[index], failures }))
  setTimeout(() => {
    if (index === 0) scroll?.scrollToVerticalOffset(160, false)
    if (index === 1) scroll?.scrollToVerticalOffset(scroll.scrollableHeight, false)
    if (index === 2 && field) {
      field.text = 'Sessão de teste'
      field.focus()
    }
    if (index === 3) {
      hiddenScroll = scroll
      void router.push('/checks/screen/next')
    }
    if (index === 4) void router.back()
    if (index === 5 || index === 8) field?.focus()
    if (index === 6) field?.dismissSoftInput()
    if (index === 7) rotate(true)
    if (index === 9) {
      field?.dismissSoftInput()
      rotate(false)
    }
  }, 800)
  if (index === 10) waitingForResume = events.filter((event) => event === 'resume').length
  if (index === 11) {
    clearInterval(timer)
    Application.off(Application.suspendEvent, suspended)
    Application.off(Application.resumeEvent, resumed)
    if (observer) Application.ios.removeNotificationObserver(observer, notification)
    if (hiddenObserver)
      Application.ios.removeNotificationObserver(hiddenObserver, hiddenNotification)
    if (!isIOS) Application.android.foregroundActivity.setRequestedOrientation(-1)
  }
}, 2000)
