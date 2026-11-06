import {
  Frame,
  Utils,
  View,
  Button,
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
  tap(find('creative-next'))
  await waitFor(check)
  await delay(350)
}
async function run() {
  await waitFor(() => !!find('color-value'))
  const color = named('HEX or RGB') as TextField
  color.text = 'rgba(12, 34, 56, .5)'
  await waitFor(() => text('color-value') === '#0C223880')
  record('color edits emit canonical RGBA', text('color-value'), true)
  color.text = '#12'
  await delay(100)
  record(
    'invalid color draft preserves model',
    text('color-value'),
    text('color-value') === '#0C223880',
  )
  await next(() => !!find('deck-decisions'))
  tap(named('Keep'))
  await waitFor(() => text('deck-decisions') === 'forest:accept')
  record('deck decision advances', text('deck-decisions'), !!withText('Follow the coastline.'))
  tap(named('Undo'))
  await waitFor(() => !!withText('A morning among trees.'))
  record('deck undo restores identity', text('deck-decisions'), text('deck-decisions') === '—')
  await next(() => !!find('balance-gauge'))
  tap(named('In the flow'))
  await delay(700)
  record(
    'gauge exposes canonical value',
    find('balance-gauge')?.accessibilityLabel,
    find('balance-gauge')?.accessibilityLabel === 'Weekly balance: 92%',
  )
  await next(() => !!find('tour-start'))
  tap(named('Show me around'))
  await waitFor(() => !!named('Next'))
  tap(named('Next'))
  await waitFor(() => !!withText('Choose the unexpected.'))
  record('tour moves to registered target', true, true)
  tap(named('End tour'))
  await waitFor(() => text('tour-result') === 'skip')
  record('tour closes without removing content', text('tour-result'), !!named('Trip name'))
  await next(() => !!find('transfer-values'))
  tap(named('Field notebook'))
  await nextTick()
  await waitFor(
    () => named('Pack selected')?.isEnabled === true,
    'transfer selection enables action',
  )
  tap(named('Pack selected'))
  await waitFor(() => text('transfer-values') === 'camera, notebook')
  record('transfer moves enabled item by identity', text('transfer-values'), true)
  record(
    'transfer preserves disabled item',
    named('Radio · unavailable')?.isEnabled,
    named('Radio · unavailable')?.isEnabled === false,
  )
  await next(() => !!find('reminder-marquee-track'))
  tap(named('Play motion'))
  await delay(600)
  const native = find('reminder-marquee-track')!.nativeViewProtected
  const offset = isIOS
    ? Number(
        (native.layer.presentationLayer() ?? native.layer).valueForKeyPath(
          'transform.translation.x',
        ),
      )
    : Utils.layout.toDeviceIndependentPixels(native.getTranslationX())
  record('marquee uses intermediate native Jolt presentation', offset, offset < -1 && offset > -784)

  tap(named('Pause motion'))
  await delay(200)
  record(
    'marquee returns to static readable content',
    !!withText('Stay curious.'),
    !!withText('Stay curious.'),
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
    .getFile('creative-check.json')
    .writeText(JSON.stringify(report, null, 2))
  console.log('MAVIS_CREATIVE_CHECK', JSON.stringify(report))
})()
