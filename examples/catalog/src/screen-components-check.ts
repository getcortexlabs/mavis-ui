/// <reference types="@nativescript/types" />
import {
  Frame,
  View,
  Button,
  TextField,
  TextView,
  ScrollView,
  GestureTypes,
  knownFolders,
  isIOS,
  ImageSource,
  Utils,
} from '@nativescript/core'
import { rotate } from './check-orientation'
import { onKeyboard } from '@rafaelaugusto/jolt'
import { nextTick } from 'nativescript-vue'
const samples: { name: string; value: unknown }[] = []
const failures: string[] = []
export function recordError(error: unknown) {
  failures.push(String((error as Error)?.stack ?? error))
}
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
function views(root: View | undefined = Frame.topmost()?.currentPage): View[] {
  if (!root) return []
  const result = [root]
  root.eachChildView((child) => {
    result.push(...views(child))
    return true
  })
  return result
}
const find = (id: string) => views().find((view) => view.id === id)
const text = (id: string) => (find(id) as { text?: string } | undefined)?.text ?? ''
const named = (label: string) => views().find((view) => view.accessibilityLabel === label)
const withText = (value: string) =>
  views().find((view) => (view as { text?: string }).text === value)
function tap(view: View | undefined, point?: { x: number; y: number }) {
  if (!view) throw new Error('Missing native control')
  const observers = view instanceof Button ? [] : (view.getGestureObservers(GestureTypes.tap) ?? [])
  if (observers.length)
    observers.forEach((observer) =>
      observer.callback.call(observer.context, {
        eventName: 'tap',
        object: view,
        getX: () => point?.x ?? 0,
        getY: () => point?.y ?? 0,
      } as never),
    )
  else view.notify({ eventName: 'tap', object: view })
}
function record(name: string, value: unknown, valid: boolean) {
  samples.push({ name, value })
  if (!valid) failures.push(name)
}
async function waitFor(check: () => boolean, description = 'interactive state') {
  for (let n = 0; n < 120; n++) {
    if (check()) return
    await delay(50)
  }
  throw new Error(`Timed out waiting for ${description}`)
}
async function next(check: () => boolean) {
  tap(find('screen-components-next'))
  await waitFor(check)
  await delay(350)
}
function snapshot(frame: View, name: string, points: number[] = []) {
  const path = knownFolders.documents().getFile(name + '.png').path
  if (!isIOS) {
    const native = frame.android as android.view.View
    const bitmap = android.graphics.Bitmap.createBitmap(
      native.getWidth(),
      native.getHeight(),
      android.graphics.Bitmap.Config.ARGB_8888,
    )
    native.draw(new android.graphics.Canvas(bitmap))
    new ImageSource(bitmap).saveToFile(path, 'png')
    const density = Utils.layout.getDisplayDensity()
    const pixels = points.map((y) => {
      const color = bitmap.getPixel(Math.round(8 * density), Math.round(y * density))
      return [
        android.graphics.Color.red(color),
        android.graphics.Color.green(color),
        android.graphics.Color.blue(color),
      ]
    })
    bitmap.recycle()
    return pixels
  }
  const native = frame.ios as UIView
  UIGraphicsBeginImageContextWithOptions(native.bounds.size, false, 1)
  native.layer.renderInContext(UIGraphicsGetCurrentContext())
  const image = UIGraphicsGetImageFromCurrentImageContext()
  UIGraphicsEndImageContext()
  if (!image) throw new Error('Could not capture the native header')
  new ImageSource(image).saveToFile(path, 'png')
  return points.map((y) => {
    const pixel = CGImageCreateWithImageInRect(image.CGImage, CGRectMake(8, y, 1, 1))
    const bytes = interop.alloc(4)
    const context = CGBitmapContextCreate(
      bytes,
      1,
      1,
      8,
      4,
      CGColorSpaceCreateDeviceRGB(),
      CGImageAlphaInfo.kCGImageAlphaPremultipliedLast | CGBitmapInfo.kCGBitmapByteOrder32Big,
    )
    CGContextDrawImage(context, CGRectMake(0, 0, 1, 1), pixel)
    return Array.from(
      new Uint8Array(interop.bufferFromData(NSData.dataWithBytesLength(bytes, 4))),
    ).slice(0, 3)
  })
}
async function headerClipping() {
  await waitFor(() => !!find('clip-art'))
  const frame = find('clip-header')!
  const scroll = views(frame).find((view) => view instanceof ScrollView) as ScrollView
  const art = find('clip-art')!,
    header = art.parent!.parent!.parent as View
  const headerBottom = () => header.getLocationRelativeTo(frame).y + header.getActualSize().height
  for (const parallax of [0.5, 0]) {
    const key = parallax ? 'parallax' : 'fixed'
    await delay(600)
    const expanded = snapshot(frame, `header-${key}-expanded`, [80, 112, 150])
    record(
      `${key} expanded artwork is visible`,
      expanded,
      expanded[2]![0]! > 245 && expanded[2]![1]! < 10,
    )
    scroll.scrollToVerticalOffset(300, false)
    await waitFor(() => Math.abs(headerBottom() - 56) < 1, 'collapsed header bottom')
    await delay(300)
    const pixels = snapshot(frame, `header-${key}-collapsed`, [80, 112, 150])
    const rect = (view: View) => ({ ...view.getLocationRelativeTo(frame), ...view.getActualSize() })
    record(
      `${key} clips artwork without clipping section or content`,
      {
        pixels,
        header: rect(header),
        art: rect(art),
        section: rect(find('clip-section')!),
        nativeClips: isIOS
          ? [art.parent!, art.parent!.parent!, header].map((view) => ({
              type: view.typeName,
              native: view.nativeViewProtected.clipsToBounds,
            }))
          : undefined,
      },
      pixels[0]![1]! > 245 && pixels[0]![0]! < 10 && pixels[1]![2]! > 245 && pixels[1]![0]! < 10,
    )
    scroll.scrollToVerticalOffset(0, false)
    await waitFor(() => Math.abs(headerBottom() - 200) < 1, 'expanded header bottom')
    if (parallax) tap(find('clip-parallax'))
  }
  await next(() => !!named('Back to top'))
}
function scrollRegion(view: View): ScrollView {
  let parent = view.parent
  while (parent && !(parent instanceof ScrollView)) parent = parent.parent
  if (!(parent instanceof ScrollView)) throw new Error('Missing component scroll region')
  return parent
}
async function standaloneKeyboardFrames() {
  await next(() => !!named('Standalone editor'))
  const composer = views().find((view) => view.cssClasses.has('standalone-composer'))!
  const view = composer.ios as UIView
  const window = view.window
  if (!window) throw new Error('Standalone composer is detached from its window')
  const { width, height } = window.bounds.size
  const original = view.convertRectToView(view.bounds, window)
  const bottom = original.origin.y + original.size.height
  const top = Math.max(0, bottom - 90)
  const sendFrame = (x: number, y: number, w: number, h: number) => {
    const frame = window.convertRectToWindow(CGRectMake(x, y, w, h), null)
    const info = NSMutableDictionary.new<string, NSValue>()
    info.setObjectForKey(NSValue.valueWithCGRect(frame), UIKeyboardFrameEndUserInfoKey)
    NSNotificationCenter.defaultCenter.postNotificationNameObjectUserInfo(
      UIKeyboardWillChangeFrameNotification,
      null,
      info,
    )
    return composer.translateY
  }
  try {
    const docked = sendFrame(0, top, width, height - top)
    const floating = sendFrame(width / 4, top, width / 2, Math.min(40, height - top - 1))
    const redocked = sendFrame(0, top, width, height - top)
    record(
      'standalone composer follows docked, floating and redocked UIKit frame notifications',
      { docked, floating, redocked },
      docked < -1 &&
        Math.abs(docked - (top - bottom)) < 1 &&
        Math.abs(floating) < 1 &&
        Math.abs(redocked - docked) < 1,
    )
  } finally {
    sendFrame(0, height, width, 0)
  }
}
async function run() {
  await headerClipping()
  await waitFor(() => !!named('Back to top'))
  await delay(600)
  record(
    'header has bounded native scroll geometry',
    views().filter((view) => view instanceof ScrollView).length,
    views().filter((view) => view instanceof ScrollView).length >= 2,
  )
  tap(named('Change header size'))
  await delay(300)
  record(
    'header preserves content after resizing',
    !!withText('A place to return'),
    !!withText('A place to return'),
  )
  const stop = find('stop-3')!
  const headerScroll = scrollRegion(stop)
  headerScroll.scrollToVerticalOffset(270, false)
  // Android must capture the anchor in the same turn as its nonanimated scroll.
  if (isIOS) await waitFor(() => headerScroll.verticalOffset > 200, 'scrolled itinerary')
  const position = () => ({
    y: stop.getLocationRelativeTo(headerScroll).y,
    offset: headerScroll.verticalOffset,
  })
  const before = position()
  tap(named('Insert a stop'))
  await waitFor(() => !!find('stop-7') && !!named('Insert a stop')?.isEnabled, 'completed prepend')
  const after = position()
  record(
    'header prepend retains the visible itinerary',
    { before, after, height: headerScroll.getActualSize().height },
    before.offset > 200 &&
      after.offset > before.offset &&
      before.y >= 0 &&
      before.y < headerScroll.getActualSize().height &&
      Math.abs(after.y - before.y) < 2,
  )
  await next(() => !!find('refresh-edition'))
  await delay(700)
  tap(named('Refresh'))
  await waitFor(() => !!named('Cancel refresh'))
  tap(named('Cancel refresh'))
  await delay(1000)
  record(
    'cancelled refresh cannot commit',
    text('refresh-edition'),
    text('refresh-edition') === 'Edition 1',
  )
  const story = find('story-3')!
  const feedScroll = scrollRegion(story)
  feedScroll.scrollToVerticalOffset(180, false)
  await waitFor(() => feedScroll.verticalOffset > 100, 'scrolling the current feed')
  const storyY = () => story.getLocationRelativeTo(feedScroll).y
  const originalStoryY = storyY()
  tap(named('Refresh'))
  await waitFor(() => text('refresh-edition') === 'Edition 2')
  await waitFor(() => !!named('Refresh')?.isEnabled, 'completed feed prepend')
  record(
    'refresh retains the same visible story',
    { before: originalStoryY, after: storyY() },
    originalStoryY >= 0 &&
      originalStoryY < feedScroll.getActualSize().height &&
      Math.abs(storyY() - originalStoryY) < 2,
  )
  record(
    'refresh applies one guarded result',
    text('refresh-edition'),
    text('refresh-edition') === 'Edition 2',
  )
  tap(named('Refresh'))
  await waitFor(() => !!named('Cancel refresh'))
  tap(named('Switch edition'))
  await delay(1100)
  record(
    'source replacement discards the old refresh',
    text('refresh-edition'),
    text('refresh-edition') === 'Edition 1' && !find('story-6') && feedScroll.verticalOffset < 1,
  )
  await next(() => !!find('composer-sent'))
  const composer = named('Your message') as TextView
  if (!composer) throw new Error('Missing composer editor')
  composer.text = 'Keep this thought'
  await nextTick()
  tap(named('Add attachment'))
  await nextTick()
  record(
    'composer retains draft with attachment',
    composer.text,
    composer.text === 'Keep this thought',
  )
  tap(named('Remove attachment: field-notes-1.pdf'))
  await nextTick()
  tap(named('Send message'))
  await waitFor(() => text('composer-sent') === '1')
  record('composer send remains application-owned', composer.text, composer.text === '')
  tap(named('Edit in sheet'))
  await waitFor(() => !!named('Draft in sheet'))
  const sheetEditor = named('Draft in sheet') as TextView
  let keyboard = { visible: false, height: 0 }
  const offKeyboard = onKeyboard((state) => {
    keyboard = state
  })
  try {
    await waitFor(
      () => sheetEditor.isLoaded && sheetEditor.getActualSize().height > 0,
      'laid out editor',
    )
    await delay(450)
    sheetEditor.focus()
    if (!isIOS) {
      // A focused editor can already own focus when the sheet finishes presenting.
      // Ask the OS to show its IME even in that case.
      Utils.ad.showSoftInput(sheetEditor.android)
      await waitFor(() => keyboard.visible && keyboard.height > 0, 'docked Android IME')
    }
    await delay(800)
    sheetEditor.text = 'A draft across presentations'
    await nextTick()
    const measure = (orientation: string, docked: boolean) => {
      const position = sheetEditor.getLocationInWindow()
      const size = sheetEditor.getActualSize()
      const root = Frame.topmost()!.getActualSize()
      const windowHeight = isIOS
        ? sheetEditor.ios.window.bounds.size.height
        : Utils.layout.toDeviceIndependentPixels(sheetEditor.android.getRootView().getHeight())
      const visibleBottom = windowHeight - keyboard.height
      record(
        'focused sheet composer stays visible in ' + orientation,
        {
          keyboard,
          position,
          size,
          root,
          windowHeight,
          focused: isIOS ? sheetEditor.ios.isFirstResponder : sheetEditor.android.hasFocus(),
        },
        size.height > 0 &&
          position.y >= -1 &&
          position.y + size.height <= visibleBottom + 2 &&
          (!docked ||
            (keyboard.visible &&
              keyboard.height > 0 &&
              (isIOS ? sheetEditor.ios.isFirstResponder : sheetEditor.android.hasFocus()))),
      )
    }
    measure('portrait', true)
    const initialWidth = Frame.topmost()!.getActualSize().width
    try {
      rotate(true)
      await waitFor(
        () => Frame.topmost()!.getActualSize().width > initialWidth + 30,
        'landscape rotation',
      )
      await delay(750)
      for (
        let n = 0;
        n < 80 && (!keyboard.height || (!isIOS && !sheetEditor.android.hasFocus()));
        n++
      )
        await delay(50)
      await delay(300)

      measure('landscape', true)
    } finally {
      rotate(false)
      await waitFor(
        () => Math.abs(Frame.topmost()!.getActualSize().width - initialWidth) < 2,
        'portrait rotation',
      )
    }
    sheetEditor.dismissSoftInput()
    await waitFor(() => keyboard.height === 0, 'keyboard dismissal')
    measure('portrait without a software keyboard', false)
    tap(named('Close draft'))
    await waitFor(() => !named('Draft in sheet'), 'sheet close')
    tap(named('Edit in sheet'))
    await waitFor(() => !!named('Draft in sheet'))
    const reopened = named('Draft in sheet') as TextView
    record(
      'reopened sheet uses a fresh editor with the same draft',
      reopened.text,
      reopened !== sheetEditor && reopened.text === 'A draft across presentations',
    )
    tap(named('Close draft'))
    await waitFor(() => !named('Draft in sheet'))
  } finally {
    offKeyboard()
  }
  await next(() => !!find('dial-selection'))
  tap(named('Create something'))
  await waitFor(() => !!named('Write a note'))
  record(
    'dial respects disabled action',
    named('Publish')?.isEnabled,
    named('Publish')?.isEnabled === false,
  )
  tap(named('Write a note'))
  await waitFor(() => text('dial-selection') === 'note')
  record(
    'dial selects an application action',
    text('dial-selection'),
    text('dial-selection') === 'note',
  )
  await next(() => !!find('pin-complete'))
  const pin = named('Verification code') as TextField
  if (!pin) throw new Error('Missing PIN editor')
  pin.text = '012345'
  await waitFor(() => text('pin-complete') === '012345')
  record('pin preserves zeros and completion', pin.text, pin.text === '012345')
  pin.text = '9-８７ ６５４'
  await waitFor(() => text('pin-complete') === '987654', `normalized PIN: ${pin.text}`)
  record('pin normalizes paste', pin.text, pin.text === '987654')
  await next(() => !!find('animated-phrase'))
  tap(named('Next phrase'))
  await delay(1000)
  record(
    'animated text settles to canonical phrase',
    text('animated-phrase'),
    text('animated-phrase') === 'Follow the unexpected.',
  )
  tap(named('Replay'))
  await delay(1000)
  record(
    'animated text replay preserves text',
    text('animated-phrase'),
    text('animated-phrase') === 'Follow the unexpected.',
  )
  await next(() => !!named('Photo tags'))
  snapshot(find('tag-input-preview')!, 'tag-input')
  const tags = named('Photo tags') as TextField
  tags.text = 'Night, Coast, Night'
  await waitFor(
    () => !!named('Remove Night') && !!named('Remove Coast') && tags.text === '',
    'pasted tags',
  )
  tap(named('Remove Night'))
  await nextTick()
  record('batch tag edit and removal', tags.text, !named('Remove Night') && !!named('Remove Coast'))
  await next(() => !!withText('+2'))
  snapshot(find('avatar-group-preview')!, 'avatar-group')
  tap(named('Show all 5 credits'))
  await waitFor(() => !!withText('Jules Park') && !withText('+2'), 'expanded credits')
  record(
    'avatar overflow expands to the full roster',
    !!withText('Jules Park'),
    !!withText('Jules Park'),
  )
  await next(() => !!named('Find a photo'))
  snapshot(find('search-bar-preview')!, 'search-bar')
  const search = named('Find a photo') as TextField
  search.text = 'Alpine'
  await waitFor(
    () => !withText('Atlantic tides') && !!withText('The still lake'),
    'filtered archive',
  )
  search.notify({ eventName: 'returnPress', object: search })
  await waitFor(() => !!withText('Results for “Alpine”'), 'search submit')
  tap(named('Clear search'))
  await waitFor(() => search.text === '' && !!withText('Atlantic tides'), 'cleared archive')
  record('search filters, submits and clears', search.text, search.text === '')
  if (isIOS) await standaloneKeyboardFrames()
  record(
    'finite native geometry',
    views().length,
    views().every((view) => {
      const size = view.getActualSize()
      return Number.isFinite(size.width) && Number.isFinite(size.height)
    }),
  )
}
void (async () => {
  try {
    await run()
  } catch (error) {
    recordError(error)
  }
  const report = { platform: isIOS ? 'ios' : 'android', done: true, samples, failures }
  await knownFolders
    .documents()
    .getFile('screen-components-check.json')
    .writeText(JSON.stringify(report, null, 2))
  console.log('MAVIS_SCREEN_COMPONENTS_CHECK', JSON.stringify(report))
})()
