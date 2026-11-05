import { calendarDayLabel } from '@getcortexlabs/mavis-core'
import { Frame, View, Button, GestureTypes, knownFolders, isIOS } from '@nativescript/core'
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
const named = (name: string) => views().find((view) => view.accessibilityLabel === name)
function tap(view: View | undefined) {
  if (!view) throw new Error('Missing native control')
  const observers = view instanceof Button ? [] : (view.getGestureObservers(GestureTypes.tap) ?? [])
  if (observers.length)
    observers.forEach((observer) =>
      observer.callback.call(observer.context, { eventName: 'tap', object: view } as never),
    )
  else view.notify({ eventName: 'tap', object: view })
}
function record(name: string, value: unknown, valid: boolean) {
  samples.push({ name, value })
  if (!valid) failures.push(name)
}
async function waitFor(check: () => boolean) {
  for (let n = 0; n < 120; n++) {
    if (check()) return
    await delay(50)
  }
  throw new Error('Timed out waiting for native discovery state')
}
async function next(id: string) {
  tap(find('discovery-next'))
  await waitFor(() => !!find(id)?.isLoaded)
  await delay(300)
}
async function run() {
  await waitFor(() => !!find('table-selection')?.isLoaded)
  await delay(500)
  const atlas = views().find((view) => (view as { text?: string }).text === 'Atlas')
  const table = named('A place for every idea')
  const geometry = {
    table: table?.getActualSize(),
    cell: atlas?.getActualSize(),
    position: atlas?.getLocationOnScreen(),
  }
  record(
    'table rows have intrinsic height and visible content',
    geometry,
    !!table &&
      !!atlas &&
      table.getActualSize().height < 650 &&
      atlas.getActualSize().height > 0 &&
      atlas.getLocationOnScreen().y < 850,
  )
  tap(named('Select Atlas'))
  await nextTick()
  record('table logical selection', text('table-selection'), text('table-selection') === 'atlas')
  tap(named('Members'))
  await nextTick()
  record('table sorting callback', !!named('Members, ascending'), !!named('Members, ascending'))
  await next('carousel-value')
  tap(named('Next slide'))
  await delay(450)
  record(
    'carousel key and Jolt transition',
    text('carousel-value'),
    text('carousel-value') === 'collect',
  )
  const card = views().find((view) => (view as { text?: string }).text === 'Keep what moves you.')
  record(
    'carousel content measured',
    card?.getActualSize(),
    !!card && card.getActualSize().height > 0,
  )
  await next('range-value')
  const thumb = views().find(
    (view) => (view.getGestureObservers(GestureTypes.pan) ?? []).length > 0,
  )
  if (!thumb) throw new Error('Missing range pan handle')
  const observers = thumb.getGestureObservers(GestureTypes.pan)!
  for (const [state, deltaX] of [
    [1, 0],
    [2, 50],
    [3, 50],
  ]) {
    observers.forEach((observer) =>
      observer.callback.call(observer.context, {
        object: thumb,
        eventName: 'pan',
        state,
        deltaX,
        deltaY: 0,
      } as never),
    )
    await nextTick()
  }
  await delay(250)
  record(
    'range native pan updates ordered endpoints',
    text('range-value'),
    text('range-value') !== '200 – 650' && text('range-value').endsWith(' – 650'),
  )
  record(
    'range touch target',
    thumb.getActualSize(),
    thumb.getActualSize().width >= 44 && thumb.getActualSize().height >= 44,
  )
  await next('calendar-value')
  const day17 = views().find(
    (view) => view.accessibilityLabel === calendarDayLabel('2026-11-17', 'en-US'),
  )
  tap(day17)
  await nextTick()
  record(
    'calendar starts civil range',
    text('calendar-value'),
    text('calendar-value') === '2026-11-17 / …',
  )
  tap(views().find((view) => view.accessibilityLabel === calendarDayLabel('2026-11-19', 'en-US')))
  await nextTick()
  record(
    'calendar rejects unavailable interval',
    text('calendar-value'),
    text('calendar-value') === '2026-11-17 / …',
  )
  await next('rating-value')
  tap(named('How was your stay?: 4 / 5'))
  await nextTick()
  record('rating selection', text('rating-value'), text('rating-value') === '4')
  tap(named('Clear rating'))
  await nextTick()
  record('rating clear', text('rating-value'), text('rating-value') === '0')
  await next('tree-value')
  tap(named('Research: Collapsed'))
  await waitFor(() => !!named('Interviews'))
  await delay(350)
  tap(named('Interviews'))
  await nextTick()
  record('tree lazy load and selection', text('tree-value'), text('tree-value') === 'interviews')
  record(
    'all native views retain finite geometry',
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
    .getFile('discovery-check.json')
    .writeText(JSON.stringify(report, null, 2))
  console.log('MAVIS_DISCOVERY_CHECK', JSON.stringify(report))
})()
