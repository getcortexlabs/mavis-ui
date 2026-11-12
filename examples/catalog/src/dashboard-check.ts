import {
  Frame,
  Utils,
  View,
  Button,
  Switch,
  TextField,
  TextView,
  ScrollView,
  GestureTypes,
  knownFolders,
  isIOS,
} from '@nativescript/core'
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
function toggle(label: string) {
  const control = views(named(label)).find((view) => view instanceof Switch) as Switch | undefined
  if (!control) throw new Error(`Missing native switch: ${label}`)
  control.checked = !control.checked
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
  tap(find('dashboard-next'))
  await waitFor(check)
  await delay(350)
}
async function run() {
  await waitFor(() => !!find('kanban-order'))
  const grip = (title: string) => named(`Move card: ${title}`)!
  const card = (title: string) => grip(title).parent!.parent as View
  const gesture = (view: View, type: GestureTypes, data: Record<string, unknown>) => {
    const observers = view.getGestureObservers(type) ?? []
    if (!observers.length) throw new Error(`Missing native Kanban ${GestureTypes[type]} handler`)
    for (const observer of observers)
      observer.callback.call(observer.context, { object: view, ...data } as never)
  }
  const pan = (title: string, state: number, deltaX: number, deltaY = 0) =>
    gesture(grip(title), GestureTypes.pan, { state, deltaX, deltaY })
  const touch = (title: string, action: 'down' | 'up' | 'cancel') =>
    gesture(grip(title), GestureTypes.touch, { action })
  const translation = (title: string) => {
    const target = card(title).nativeViewProtected
    const read = (axis: 'x' | 'y') =>
      isIOS
        ? Number(
            (target.layer.presentationLayer() ?? target.layer).valueForKeyPath(
              `transform.translation.${axis}`,
            ),
          )
        : Utils.layout.toDeviceIndependentPixels(
            axis === 'x' ? target.getTranslationX() : target.getTranslationY(),
          )
    return { x: read('x'), y: read('y') }
  }
  const resting = (title: string) => {
    const { x, y } = translation(title)
    return Math.abs(x) < 0.6 && Math.abs(y) < 0.6
  }
  const center = (view: View) => {
    const origin = view.getLocationInWindow(),
      size = view.getActualSize()
    return { x: origin.x + size.width / 2, y: origin.y + size.height / 2 }
  }
  const frames = () =>
    ['Botanical identity', 'Field notes', 'Studio website']
      .map((title) => {
        const origin = card(title).getLocationInWindow(),
          size = card(title).getActualSize()
        return [origin.x, origin.y, size.width, size.height].map(Math.round).join(',')
      })
      .join(';')
  async function settled() {
    for (let last = '', same = 0; same < 4; await delay(80)) {
      const now = frames()
      same = now === last ? same + 1 : 0
      last = now
    }
  }
  async function drag(title: string, to: { x: number; y: number }) {
    const from = center(card(title))
    touch(title, 'down')
    pan(title, 1, 0)
    for (let step = 1; step <= 6; step++) {
      pan(title, 2, ((to.x - from.x) * step) / 6, ((to.y - from.y) * step) / 6)
      await delay(40)
    }
    return { x: to.x - from.x, y: to.y - from.y }
  }

  await settled()
  const slots = ['Botanical identity', 'Field notes'].map(
    (title) => card(title).getActualSize().height,
  )
  record(
    'cards in a column keep their own height',
    slots,
    Math.abs(slots[0]! - slots[1]!) < 40 && slots[0]! < 300,
  )
  touch('Botanical identity', 'down')
  pan('Botanical identity', 1, 0)
  pan('Botanical identity', 2, 42)
  await delay(100)
  const translated = translation('Botanical identity').x
  record('kanban moves its native Jolt surface during drag', translated, translated > 20)
  pan('Botanical identity', 0, 42)
  touch('Botanical identity', 'cancel')
  await waitFor(() => resting('Botanical identity'), 'the cancelled card to return')
  record(
    'cancelled native drag preserves controlled cards',
    { order: text('kanban-order'), at: translation('Botanical identity') },
    text('kanban-order').startsWith('identity:ideas'),
  )

  const heading = withText('Ideas · 2')!.getLocationInWindow()
  const out = await drag('Botanical identity', {
    x: center(card('Botanical identity')).x,
    y: heading.y - 40,
  })
  const outside = translation('Botanical identity')
  pan('Botanical identity', 3, out.x, out.y)
  touch('Botanical identity', 'up')
  await waitFor(() => resting('Botanical identity'), 'the card released outside to return')
  record(
    'a release outside every column returns the card',
    { moved: outside, order: text('kanban-order') },
    outside.y < -60 && text('kanban-order').startsWith('identity:ideas,editorial:ideas'),
  )

  await settled()
  const over = await drag('Field notes', center(card('Studio website')))
  await delay(150)
  const held = center(card('Field notes')),
    aim = center(card('Studio website'))
  pan('Field notes', 3, over.x, over.y)
  touch('Field notes', 'up')
  await waitFor(() => text('kanban-result') === 'editorial:making', 'the card to change columns')
  await waitFor(() => resting('Field notes'), 'the dropped card to settle')
  record(
    'a drag by the grip drops the card into another column',
    { order: text('kanban-order'), held, aim },
    text('kanban-order').includes('editorial:making') &&
      text('kanban-order').split(',').length === 4,
  )

  await settled()
  const full = text('kanban-order')
  const refused = await drag('Botanical identity', center(card('Studio website')))
  const hovering = translation('Botanical identity')
  pan('Botanical identity', 3, refused.x, refused.y)
  touch('Botanical identity', 'up')
  await waitFor(() => resting('Botanical identity'), 'the refused card to return')
  record(
    'a column at capacity refuses the card and it returns',
    { moved: hovering, order: text('kanban-order') },
    Math.abs(hovering.x) + Math.abs(hovering.y) > 60 && text('kanban-order') === full,
  )

  tap(
    named(
      full.indexOf('editorial:making') < full.indexOf('web:making')
        ? 'Move down: Field notes'
        : 'Move up: Field notes',
    ),
  )
  await waitFor(() => text('kanban-order') !== full)
  record(
    'kanban shared reorder preserves cards',
    text('kanban-order'),
    text('kanban-order').split(',').length === 4,
  )
  const filter = named('Filter projects') as TextField
  filter.text = 'Botanical'
  await delay(200)
  tap(named('Move card'))
  await waitFor(() => !!withText('Published'))
  tap(named('Published') ?? withText('Published'))
  await waitFor(() => text('kanban-result') === 'identity:done')
  record(
    'kanban transfers while filtering',
    text('kanban-order'),
    text('kanban-order').includes('editorial:making'),
  )
  await next(() => !!find('studio-donut'))
  tap(named('Design · 54 · 54%'))
  await waitFor(() => text('donut-selection') === 'design')
  tap(named('Another week'))
  await waitFor(() => !!named('Design · 36 · 36%'))
  record(
    'donut preserves selected identity across data change',
    text('donut-selection'),
    text('donut-selection') === 'design',
  )
  await next(() => !!find('studio-sparkline'))
  tap(named('View data'))
  await waitFor(() => !!withText('Day 4: 19'))
  toggle('Missing reading')
  await waitFor(() => !!withText('Day 4: —'), 'missing Sparkline reading')
  record('sparkline preserves null gap and accessible data', true, true)
  await next(() => !!find('studio-gradient'))
  const editor = named('A thought to keep') as TextField
  editor.text = 'Retained'
  tap(named('Change atmosphere'))
  toggle('Continuous motion')
  await delay(300)
  toggle('Continuous motion')
  record('gradient palette and motion preserve editor', editor.text, editor.text === 'Retained')
  await next(() => !!find('studio-particles'))
  toggle('Play particles')
  await delay(500)
  record(
    'particle surface retains content',
    !!withText('Leave a little room for wonder.'),
    !!withText('Leave a little room for wonder.'),
  )
  toggle('Play particles')
  await next(() => !!find('studio-confetti'))
  tap(named('Publish the project'))
  await waitFor(() => text('confetti-status') === 'Published. You made it.')
  record('explicit confetti preserves success content', text('confetti-status'), true)
  toggle('Disable celebration')
  tap(named('Publish the project'))
  record(
    'disabled decoration preserves action',
    text('confetti-status'),
    text('confetti-status') === 'Published. You made it.',
  )
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
    .getFile('dashboard-check.json')
    .writeText(JSON.stringify(report, null, 2))
  console.log('MAVIS_DASHBOARD_CHECK', JSON.stringify(report))
})()
