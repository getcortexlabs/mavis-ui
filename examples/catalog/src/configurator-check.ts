import {
  Frame,
  View,
  TextField,
  Label,
  ScrollView,
  Image,
  Switch,
  Button,
  GestureTypes,
  isIOS,
  Utils,
  knownFolders,
} from '@nativescript/core'
import { nextTick } from 'nativescript-vue'
import { configure } from '@rafaelaugusto/jolt'

// Only included by --env.configuratorCheck; exercises the shared Forma screen.
const samples: { name: string; value: unknown }[] = []
const failures: string[] = []
export function recordError(error: unknown) {
  failures.push(String((error as Error)?.stack ?? error))
}
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
function record(name: string, value: unknown, valid: boolean) {
  samples.push({ name, value })
  if (!valid) failures.push(name)
}
function views(root: View | undefined = Frame.topmost()?.currentPage): View[] {
  if (!root) return []
  const found = [root]
  root.eachChildView((child) => {
    found.push(...views(child))
    return true
  })
  return found
}
const find = (id: string) => views().find((view) => view.id === id)
async function show(view: View) {
  const scroll = views().find((view) => view instanceof ScrollView) as ScrollView | undefined
  const position = scroll?.content && view.getLocationRelativeTo(scroll.content)
  if (scroll && position) {
    scroll.scrollToVerticalOffset(Math.max(0, position.y - 24), false)
    await delay(150)
  }
}

const button = (pattern: RegExp, root?: View) =>
  views(root).find(
    (view) => view.accessibilityRole === 'button' && pattern.test(view.accessibilityLabel || ''),
  )
function tap(view: View | undefined) {
  if (!view) throw new Error('Expected control is missing')
  if (view instanceof Button) {
    view.notify({ eventName: 'tap', object: view })
    return
  }
  const observers = view.getGestureObservers(GestureTypes.tap) ?? []
  if (observers.length)
    for (const observer of observers)
      observer.callback.call(observer.context, { eventName: 'tap', object: view } as never)
  else view.notify({ eventName: 'tap', object: view })
}
async function run() {
  for (
    let attempt = 0;
    attempt < 100 &&
    (!find('forma-quantity')?.isLoaded || !find('forma-image')?.getActualSize().width);
    attempt++
  )
    await delay(100)
  await delay(1000)
  const editor = find('forma-quantity') as TextField
  if (!editor) throw new Error('Forma did not mount')
  editor.text = '-'
  await nextTick()
  record('numeric incomplete draft', editor.text, editor.text === '-')
  tap(button(/Increase:|Aumentar:/))
  await delay(200)
  record('numeric step from last valid model', editor.text, editor.text === '2')
  const image = find('forma-image')!
  const size = image.getActualSize()
  record(
    'image reserved ratio and decoded pixels',
    size,
    size.width > 100 &&
      Math.abs(size.width / size.height - 4 / 3) < 0.03 &&
      views(image).some((view) => view instanceof Image && !!view.imageSource),
  )
  const choice = views().find((view) => view instanceof Switch) as Switch
  const before = choice.checked
  choice.checked = !before
  await nextTick()
  record('switch controlled update', choice.checked, choice.checked === !before)
  const accordion = find('forma-accordion')!
  await show(accordion)
  const trigger = button(/Made to last|Feito para durar/, accordion)
  tap(trigger)
  await delay(400)
  const note = find('forma-note') as TextField
  record('Accordion opens editor', Boolean(note), Boolean(note))
  const beforeHeight = accordion.getActualSize().height
  tap(find('forma-more'))
  await delay(200)
  record(
    'Accordion follows intrinsic content',
    accordion.getActualSize().height,
    accordion.getActualSize().height > beforeHeight,
  )
  const bodyText = views(accordion).find(
    (view) => view instanceof Label && /Impressão de arte|An art print/.test(view.text || ''),
  ) as Label
  const originalFont = bodyText.fontSize
  const originalHeight = accordion.getActualSize().height
  bodyText.fontSize = 26
  await delay(200)
  record(
    'Accordion follows runtime text size',
    accordion.getActualSize().height,
    accordion.getActualSize().height > originalHeight,
  )
  bodyText.fontSize = originalFont
  await delay(200)
  const normalWidth = accordion.width
  accordion.width = accordion.getActualSize().width - 48
  await delay(200)
  record(
    'Accordion follows width changes',
    accordion.getActualSize().height,
    accordion.getActualSize().height >= beforeHeight,
  )
  accordion.width = normalWidth
  await delay(200)
  note.text = 'Keep this draft'
  tap(trigger)
  await nextTick()
  tap(trigger)
  await delay(400)
  record(
    'Accordion reversal retains editor',
    note.text,
    note === find('forma-note') && note.text === 'Keep this draft',
  )
  tap(trigger)
  await delay(400)
  record('Accordion removes closed content', Boolean(find('forma-note')), !find('forma-note'))
  await show(find('forma-paint')!)
  tap(find('forma-cool'))
  await delay(1000)
  const paint = find('forma-paint')!
  samples.push({
    name: 'paint diagnostics',
    value: {
      loaded: paint.isLoaded,
      size: paint.getActualSize(),
      caption: (find('forma-intensity') as TextField)?.text,
    },
  })
  const presentation = () => {
    const native = paint.nativeViewProtected
    if (isIOS) {
      const layer = native.layer.presentationLayer() ?? native.layer
      return {
        scale: Number(layer.valueForKeyPath('transform.scale.x')),
        radius: Number(layer.cornerRadius),
        color: String(layer.backgroundColor),
      }
    }
    let drawable = native.getBackground()
    if (drawable.getWrappedDrawable) drawable = drawable.getWrappedDrawable()
    const type = drawable.getClass()
    const radius = type.getDeclaredField('borderTopLeftRadius')
    const color = type.getDeclaredField('backgroundColor')
    radius.setAccessible(true)
    color.setAccessible(true)
    return {
      scale: Number(native.getScaleX()),
      radius: Utils.layout.toDeviceIndependentPixels(radius.getFloat(drawable)),
      color: Number(color.getInt(drawable)),
    }
  }
  record(
    'mapped application scale',
    presentation().scale,
    Math.abs(presentation().scale - 1.1) < 0.02,
  )
  record('mapped color and radius', presentation(), presentation().radius >= 31)
  const touch = (action: string) => {
    for (const observer of paint.getGestureObservers(GestureTypes.touch) ?? [])
      observer.callback.call(observer.context, {
        eventName: 'touch',
        object: paint,
        action,
        getX: () => 20,
        getY: () => 20,
      } as never)
  }
  touch('down')
  await delay(400)
  record(
    'press composes with app scale',
    presentation().scale,
    Math.abs(presentation().scale - 1.1 * 0.96) < 0.02,
  )
  touch('cancel')
  await delay(600)
  record(
    'press releases to app scale',
    presentation().scale,
    Math.abs(presentation().scale - 1.1) < 0.02,
  )
  configure({ reducedMotion: 'always' })
  try {
    tap(paint)
    await delay(100)
    record(
      'live reduced motion settles mapped spring',
      presentation().scale,
      Math.abs(presentation().scale - 1) < 0.02,
    )
  } finally {
    configure({ reducedMotion: 'user' })
  }
  await show(find('forma-extras')!)
  tap(find('forma-extras'))
  await delay(500)
  const modal = Frame.topmost()?.currentPage
  if (
    !views(modal).some(
      (view) => view instanceof TextField && /Search|Buscar/.test(view.accessibilityLabel || ''),
    )
  )
    throw new Error('MultiSelect sheet did not open')
  const option = views(modal).find(
    (view) =>
      view.accessibilityRole === 'checkbox' &&
      /Handwritten|Cartão/.test(view.accessibilityLabel || ''),
  )
  tap(option)
  await delay(200)
  record(
    'MultiSelect toggles native checkbox',
    option?.accessibilityState,
    option?.accessibilityState === 'checked',
  )
  tap(button(/^(Done|Concluir)$/, modal))
  for (
    let attempt = 0;
    attempt < 30 &&
    views().some(
      (view) => view instanceof TextField && /Search|Buscar/.test(view.accessibilityLabel || ''),
    );
    attempt++
  )
    await delay(100)
  record(
    'MultiSelect closes',
    views().some(
      (view) => view instanceof TextField && /Search|Buscar/.test(view.accessibilityLabel || ''),
    ),
    !views().some(
      (view) => view instanceof TextField && /Search|Buscar/.test(view.accessibilityLabel || ''),
    ),
  )
}
void run()
  .catch((error) => failures.push(String(error?.stack ?? error)))
  .finally(async () => {
    await knownFolders
      .documents()
      .getFile('configurator-check.json')
      .writeText(JSON.stringify({ done: true, samples, failures }, null, 2))
  })
