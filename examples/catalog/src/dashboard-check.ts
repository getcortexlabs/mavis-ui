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
  const handle = named('Move card: Botanical identity')!
  const pan = (state: number, deltaX: number) => {
    const observers = handle.getGestureObservers(GestureTypes.pan) ?? []
    if (!observers.length) throw new Error('Missing native Kanban pan handler')
    for (const observer of observers)
      observer.callback.call(observer.context, {
        object: handle,
        state,
        deltaX,
        deltaY: 0,
      } as never)
  }
  pan(1, 0)
  pan(2, 42)
  await delay(100)
  const target = (handle.parent?.parent as View).nativeViewProtected
  const translated = isIOS
    ? Number(
        (target.layer.presentationLayer() ?? target.layer).valueForKeyPath(
          'transform.translation.x',
        ),
      )
    : Utils.layout.toDeviceIndependentPixels(target.getTranslationX())
  record('kanban moves its native Jolt surface during drag', translated, translated > 20)
  pan(4, 42)
  await delay(350)
  record(
    'cancelled native drag preserves controlled cards',
    text('kanban-order'),
    text('kanban-order').startsWith('identity:ideas'),
  )
  tap(named('Move down: Botanical identity'))
  await waitFor(
    () =>
      text('kanban-order').indexOf('editorial:ideas') <
      text('kanban-order').indexOf('identity:ideas'),
  )
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
    text('kanban-order').includes('editorial:ideas'),
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
