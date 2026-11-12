// Replays a fixture's steps on the real NativeScript views of the generated screen.
// Taps run the views' own tap handlers; typing goes through the platform's text input,
// so maxLength and the field's own filters apply as they do for a keyboard.
import {
  Button,
  Color,
  Frame,
  ScrollView,
  GestureTypes,
  Label,
  TextField,
  TextView,
  isIOS,
  type View,
} from '@nativescript/core'
import { layoutFailures, type Rect, type Relation } from './layout'

export type Step = Record<string, unknown>
type Field = TextField | TextView | Button

const wait = (ms: number) => new Promise((done) => setTimeout(done, ms))
const hidden = (view: View) => view.accessibilityHidden === true || view.visibility !== 'visible'

function walk(view: View, visit: (view: View) => void) {
  if (hidden(view)) return
  visit(view)
  view.eachChildView((child) => {
    walk(child, visit)
    return true
  })
}

function all(root: View) {
  const views: View[] = []
  walk(root, (view) => views.push(view))
  return views
}

const page = () => Frame.topmost().currentPage as unknown as View
const editor = (view: View): view is TextField | TextView =>
  view instanceof TextField || view instanceof TextView
const checkbox = (view: View) =>
  view instanceof Button && ['checked', 'unchecked'].includes(String(view.accessibilityState))

function field(label: string): Field {
  const matches = all(page()).filter(
    (view) => view.accessibilityLabel === label && (editor(view) || view instanceof Button),
  )
  const found = matches.find(editor) ?? matches[0]
  if (!found) throw new Error(`No field ${label}`)
  return found as Field
}

// Screen texts in reading order. A field's message is announced with the field instead.
function labels(root: View) {
  const fields = all(root).filter((view) => editor(view) || view instanceof Button)
  return all(root)
    .filter((view): view is Label => view instanceof Label)
    .filter((label) => {
      const text = label.text ?? ''
      return !fields.some(
        (owner) => owner.accessibilityHint === text && owner.parent && near(owner, label),
      )
    })
}

// What assistive technology reads: the text, or the name the source gave it.
const spoken = (label: Label) => label.accessibilityLabel || (label.text ?? '')
const texts = (root: View) => labels(root).map(spoken)
const headings = (root: View) =>
  labels(root)
    .filter((label) => label.accessibilityRole === 'header')
    .map(spoken)

// An element by the id its source gave it, in device-independent units from the window's corner.
// mavis-window is the part of the window a screen gets for its content: inside the system bars,
// where MScreen puts its scroll area or its column.
function frame(id: string): Rect | undefined {
  const view = id === 'mavis-window' ? viewport() : byId(id)
  const origin = view?.getLocationInWindow()
  if (!view || !origin) return undefined
  return { ...origin, ...view.getActualSize() }
}

// Decorations that assistive technology does not see, such as separators, have ids too.
function byId(id: string) {
  let found: View | undefined
  const visit = (view: View) => {
    if (found || view.visibility !== 'visible') return
    if (view.id === id) found = view
    view.eachChildView((child) => {
      visit(child)
      return !found
    })
  }
  visit(page())
  return found
}

function viewport() {
  const screen = (page() as unknown as { content?: View }).content
  let first: View | undefined
  screen?.eachChildView((child) => {
    first = child
    return false
  })
  return first
}

// The color that shows through at an element: its own background, or the nearest one behind it.
const background = (view: View) => {
  const value = view.backgroundColor as Color | string | undefined
  const color = !value ? undefined : value instanceof Color ? value : new Color(value)
  return color && color.a > 0 ? color : undefined
}

function paint(id: string) {
  let view = byId(id)
  if (!view) return `no element with id ${id}`
  while (view && !background(view)) view = view.parent as View | undefined
  const color = view && background(view)
  return color ? [color.r, color.g, color.b] : 'no background'
}

// The message sits next to its field in the field's own container.
function near(owner: View, label: View) {
  let container = owner.parent as View | undefined
  for (let depth = 0; container && depth < 3; depth++) {
    if (all(container).includes(label)) return true
    container = container.parent as View | undefined
  }
  return false
}

function hasFocus(view: View) {
  return isIOS ? Boolean(view.ios?.isFirstResponder) : Boolean(view.android?.hasFocus())
}

function focused() {
  const view = all(page()).find((item) => editor(item) && hasFocus(item))
  return view ? (view.accessibilityLabel ?? '') : null
}

// What assistive technology announces: the value, or Android 11+'s state description.
function mixed(view: View) {
  const android = view.android as { getStateDescription?(): unknown } | undefined
  return Boolean(view.accessibilityValue) || Boolean(!isIOS && android?.getStateDescription?.())
}

function state(label: string, keys: string[]) {
  const view = field(label)
  const result: Record<string, unknown> = {}
  for (const key of keys) {
    if (key === 'message') result.message = view.accessibilityHint ?? ''
    else if (key === 'checked')
      result.checked = mixed(view) ? 'mixed' : view.accessibilityState === 'checked'
    else result.value = (view as TextField).text ?? ''
  }
  return result
}

function tap(view: View) {
  if (!view.isEnabled) return
  // A card listens with a tap gesture; buttons with the tap event.
  const observers = view.getGestureObservers(GestureTypes.tap) ?? []
  if (!observers.length) return view.notify({ eventName: 'tap', object: view })
  for (const observer of [...observers])
    observer.callback.call(observer.context, {
      eventName: 'tap',
      object: view,
      type: GestureTypes.tap,
      view,
      ios: undefined,
      android: undefined,
    })
}

// A card with onClick: one accessible button that is not a Button view.
const card = (view: View) =>
  !(view instanceof Button) && view.accessible === true && view.accessibilityRole === 'button'

function buttons(name: string) {
  return all(page()).filter(
    (view) =>
      (view instanceof Button &&
        !checkbox(view) &&
        (view.text === name || view.accessibilityLabel === name)) ||
      (card(view) && view.accessibilityLabel === name),
  )
}

async function focusField(view: TextField | TextView) {
  if (!hasFocus(view)) view.focus()
  await wait(150)
}

// The parts of UIKit and EditText used to type, without the platform typings.
declare const NSMakeRange: (location: number, length: number) => unknown
type IOSField = {
  text: string
  delegate: {
    textFieldShouldChangeCharactersInRangeReplacementString?(
      field: unknown,
      range: unknown,
      text: string,
    ): boolean
    textViewShouldChangeTextInRangeReplacementText?(
      view: unknown,
      range: unknown,
      text: string,
    ): boolean
    textViewDidChange?(view: unknown): void
  }
  sendActionsForControlEvents?(events: number): void
}
type AndroidInput = {
  getText(): { length(): number; replace(start: number, end: number, text: string): unknown }
  setSelection(start: number, end: number): void
}

// One keystroke on iOS: ask the field's delegate, as UIKit does, then apply the edit.
function key(view: TextField | TextView, start: number, length: number, text: string) {
  const native = view.ios as IOSField
  const range = NSMakeRange(start, length)
  const current = native.text ?? ''
  const next = current.slice(0, start) + text + current.slice(start + length)
  if (view instanceof TextView) {
    if (
      native.delegate.textViewShouldChangeTextInRangeReplacementText?.(native, range, text) ===
      false
    )
      return
    native.text = next
    native.delegate.textViewDidChange?.(native)
  } else {
    if (
      native.delegate.textFieldShouldChangeCharactersInRangeReplacementString?.(
        native,
        range,
        text,
      ) === false
    )
      return
    native.text = next
    native.sendActionsForControlEvents?.(1 << 17)
  }
}

// Text goes through the platform's text input at the end, character by character, like typing.
function insert(view: TextField | TextView, text: string, replace: boolean) {
  if (isIOS) {
    const native = view.ios as IOSField
    if (replace) key(view, 0, (native.text ?? '').length, '')
    for (const character of text) key(view, (native.text ?? '').length, 0, character)
  } else {
    const native = view.android as AndroidInput
    const editable = native.getText()
    if (replace) editable.replace(0, editable.length(), '')
    for (const character of text) {
      const end = editable.length()
      native.setSelection(end, end)
      editable.replace(end, end, character)
    }
  }
}

// A Sheet that is closing hides the screen from assistive technology for a moment: wait for
// the control, as a person would.
async function found<T>(get: () => T | undefined, missing: string): Promise<T> {
  for (let tries = 0; tries < 30; tries++) {
    try {
      const value = get()
      if (value) return value
    } catch {}
    await wait(100)
  }
  throw new Error(missing)
}

/** What a fixture with a route table runs on: the app's router and its top-level destinations. */
export type Navigation = {
  router: {
    push(href: string): Promise<unknown>
    replace(href: string): Promise<unknown>
    back(): Promise<unknown>
  }
  destinations: { label: string; href: string }[]
}
let navigation: Navigation | undefined
/** The navigation of the fixture about to be replayed, or none. */
export const navigate = (next: Navigation | undefined) => (navigation = next)

// A link: an MLink, or a button or card with an href, by the name assistive technology reads.
const link = (view: View) => view.accessible !== false && view.accessibilityRole === 'link'
const named = (view: View) => view.accessibilityLabel || ((view as Button).text ?? '')
const links = (root: View) => all(root).filter(link)

// Moving between the screens of a route table. Returns false for any other step.
async function travel(step: Step) {
  if (step.follow !== undefined) {
    tap(
      await found(
        () => links(page()).filter((view) => named(view) === step.follow)[Number(step.nth ?? 0)],
        `No link ${step.follow}`,
      ),
    )
  } else if (step.back) {
    // The system's back goes through the router, as the navigation bar's button does.
    await navigation!.router.back()
  } else if (step.open !== undefined) {
    // A deep link lands as a new page over the current one.
    await navigation!.router.push(String(step.open))
  } else if (step.destination !== undefined) {
    const chosen = navigation!.destinations.find((item) => item.label === step.destination)
    if (!chosen) throw new Error(`No destination ${step.destination}`)
    // What a tab bar asks of the app's navigation.
    await navigation!.router.replace(chosen.href)
  } else return false
  await wait(600)
  return true
}

async function step(step: Step) {
  if (step.click !== undefined) {
    tap(
      await found(
        () => buttons(String(step.click))[Number(step.nth ?? 0)],
        `No button ${step.click}`,
      ),
    )
  } else if (step.type !== undefined || step.replace !== undefined) {
    const label = String(step.type ?? step.replace)
    const view = await found(() => field(label), `No field ${label}`)
    if (!editor(view)) throw new Error(`${step.type ?? step.replace} is not a text field`)
    await focusField(view)
    insert(view, String(step.text ?? ''), step.replace !== undefined)
  } else if (step.press === 'Return') {
    const view = all(page()).find((item) => editor(item) && hasFocus(item)) as
      TextField | TextView | undefined
    if (!view) throw new Error('Return needs a focused field')
    if (view instanceof TextView) insert(view, '\n', false)
    else view.notify({ eventName: 'returnPress', object: view })
  } else if (step.toggle !== undefined) {
    tap(await found(() => field(String(step.toggle)), `No field ${step.toggle}`))
  } else if (step.choose !== undefined) {
    tap(await found(() => field(String(step.choose)), `No field ${step.choose}`))
    let option: Button | undefined
    for (let tries = 0; tries < 50 && !option; tries++) {
      await wait(100)
      option = all(page()).find(
        (view): view is Button => checkbox(view) && view.accessibilityLabel === step.option,
      )
    }
    if (!option) throw new Error(`No option ${step.option}`)
    tap(option)
    await wait(600)
  } else if (step.scroll !== undefined) {
    const screen = all(page()).find((item) => item.id === step.scroll)
    let scroll: ScrollView | undefined
    if (screen)
      walk(screen, (view) => {
        if (!scroll && view instanceof ScrollView) scroll = view
      })
    if (!scroll) throw new Error(`${step.scroll} does not scroll`)
    scroll.scrollToVerticalOffset(scroll.verticalOffset + Number(step.by), false)
    await wait(300)
  } else throw new Error(`Step without a native equivalent: ${JSON.stringify(step)}`)
  await wait(120)
}

function current(root: View, expected: Step) {
  const actual: Record<string, unknown> = { texts: texts(root) }
  if (expected.headings) actual.headings = headings(root)
  if (expected.cards)
    actual.cards = all(root)
      .filter(card)
      .map((view) => view.accessibilityLabel ?? '')
  if (expected.fields) {
    const fields: Record<string, unknown> = {}
    for (const [label, value] of Object.entries(expected.fields as Record<string, object>))
      fields[label] = state(label, Object.keys(value))
    actual.fields = fields
  }
  if ('focused' in expected) actual.focused = focused()
  return actual
}

export async function replay(name: string, steps: Step[], root: () => View) {
  for (const [index, original] of steps.entries()) {
    // Hardware-keyboard steps name what a touch user would do instead, or null to skip.
    const native = 'native' in original ? (original.native as Step | null) : original
    if (!native) continue
    if (native.paint) {
      const expected = native.is as number[]
      const matches = (shown: unknown) =>
        Array.isArray(shown) && shown.every((value, at) => Math.abs(value - expected[at]!) <= 3)
      let shown = paint(String(native.paint))
      for (let tries = 0; tries < 50 && !matches(shown); tries++) {
        await wait(100)
        shown = paint(String(native.paint))
      }
      if (!matches(shown)) return { name, failed: index, paint: shown, expected }
    } else if (native.layout) {
      const relations = native.layout as Relation[]
      // Layout settles a frame or two after the state that changed it.
      let failures = layoutFailures(relations, frame)
      for (let tries = 0; tries < 50 && failures.length; tries++) {
        await wait(100)
        failures = layoutFailures(relations, frame)
      }
      if (failures.length) return { name, failed: index, layout: failures }
    } else if (native.expect) {
      const wanted = {
        texts: native.expect,
        ...(native.headings ? { headings: native.headings } : {}),
        ...(native.cards ? { cards: native.cards } : {}),
        ...(native.fields ? { fields: native.fields } : {}),
        ...('focused' in native ? { focused: native.focused } : {}),
      }
      // A Sheet closing or a row moving can hide the content for a moment; keep reading.
      const read = () => {
        try {
          return current(root(), native)
        } catch (error) {
          return { error: String((error as Error).message ?? error) }
        }
      }
      let actual = read()
      for (
        let tries = 0;
        tries < 50 && JSON.stringify(actual) !== JSON.stringify(wanted);
        tries++
      ) {
        await wait(100)
        actual = read()
      }
      if (JSON.stringify(actual) !== JSON.stringify(wanted))
        return { name, failed: index, expected: wanted, actual }
    } else if (native.links) {
      const wanted = native.links as string[]
      let actual = links(root()).map(named)
      for (
        let tries = 0;
        tries < 50 && JSON.stringify(actual) !== JSON.stringify(wanted);
        tries++
      ) {
        await wait(100)
        actual = links(root()).map(named)
      }
      if (JSON.stringify(actual) !== JSON.stringify(wanted))
        return { name, failed: index, links: actual, expected: wanted }
    } else if ('title' in native || 'selected' in native) {
      // A window's title and a destination in front are the Mac's own.
    } else
      try {
        if (!(await travel(native))) await step(native)
      } catch (error) {
        return { name, failed: index, error: String((error as Error).message ?? error) }
      }
  }
  return { name, passed: true }
}
