import {
  Frame,
  View,
  Button,
  TextField,
  GestureTypes,
  knownFolders,
  isIOS,
} from '@nativescript/core'
import { numberFlowFormatter } from '../../../packages/nativescript/src/native/number-flow-format'
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
  tap(find('interactive-next'))
  await waitFor(check)
  await delay(350)
}
async function run() {
  const brl = numberFlowFormatter('pt-BR', { style: 'currency', currency: 'BRL' })(1234.5)
  record('native localized currency', brl, brl.includes('1.234,50') && brl.includes('R$'))
  const jpy = numberFlowFormatter('en-US', { style: 'currency', currency: 'JPY' })(1234.5)
  record('native zero-decimal currency', jpy, jpy.includes('1,235') && !jpy.includes('.'))
  const percent = numberFlowFormatter('en-US', { style: 'percent', maximumFractionDigits: 1 })(
    0.123,
  )
  record('native percentage', percent, percent === '12.3%')
  await waitFor(() => !!find('sort-order')?.isLoaded)
  await delay(600)
  tap(named('Move down: Morning light'))
  await waitFor(() => text('sort-order') === 'coast,morning,blue,home')
  record(
    'sortable moves by identity',
    text('sort-order'),
    text('sort-order') === 'coast,morning,blue,home',
  )
  tap(named('Lock order'))
  await nextTick()
  const handle = named('Reorder: Morning light')
  record('sortable disables native handle', handle?.isEnabled, handle?.isEnabled === false)
  await next(() => !!find('swipe-result'))
  tap(named('Actions'))
  await waitFor(() => !!named('Star'))
  tap(named('Star'))
  await waitFor(() => text('swipe-result') === 'favorite')
  record(
    'swipe accessible action changes model',
    text('swipe-result'),
    text('swipe-result') === 'favorite',
  )
  await next(() => !!find('flow-revenue'))
  tap(named('New orders'))
  await delay(950)
  record(
    'rolling number retains canonical value',
    text('flow-revenue'),
    text('flow-revenue').includes('13,856.75'),
  )
  tap(named('Refund'))
  await delay(950)
  record(
    'rolling number handles decreases',
    text('flow-revenue'),
    text('flow-revenue').includes('13,608.00'),
  )
  await next(() => !!find('panel-value'))
  const editor = views().find((view) => view instanceof TextField) as TextField | undefined
  if (editor) editor.text = 'Keep this thought'
  await nextTick()
  tap(named('Hide notes'))
  await waitFor(() => text('panel-value') === '0')
  record(
    'panel collapses without discarding editor',
    editor?.text,
    editor?.text === 'Keep this thought' && editor.isLoaded,
  )
  tap(named('Show notes'))
  await waitFor(() => text('panel-value') !== '0')
  tap(named('Stack panels'))
  await delay(450)
  record(
    'orientation preserves draft',
    editor?.text,
    editor?.text === 'Keep this thought' && editor.isLoaded,
  )
  await next(() => !!find('compare-value'))
  tap(named('More coast'))
  await waitFor(() => text('compare-value') === '15')
  await delay(450)
  record('comparison changes reveal value', text('compare-value'), text('compare-value') === '15')
  tap(named('Change direction'))
  await delay(450)
  await next(() => !!find('viewer-value'))
  tap(named('Above the clouds'))
  await waitFor(() => !!named('Close viewer'))
  await waitFor(() => named('Zoom in')?.isEnabled === true, 'native zoom controller readiness')
  tap(named('Zoom in'))
  await waitFor(() => !!withText('150%'), 'native zoom settling at 150%')
  record('viewer zoom controller reaches requested scale', !!withText('150%'), !!withText('150%'))
  tap(named('Next image'))
  await waitFor(() => text('viewer-value') === 'lake:true')
  await delay(500)
  record('viewer selection resets zoom', !!withText('100%'), !!withText('100%'))
  tap(named('Close viewer'))
  await waitFor(() => text('viewer-value') === 'lake:false' && !named('Close viewer'))
  record('viewer closes layer', text('viewer-value'), text('viewer-value') === 'lake:false')
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
    .getFile('interactive-check.json')
    .writeText(JSON.stringify(report, null, 2))
  console.log('MAVIS_INTERACTIVE_CHECK', JSON.stringify(report))
})()
