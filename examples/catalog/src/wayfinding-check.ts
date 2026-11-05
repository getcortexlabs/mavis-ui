import {
  Frame,
  View,
  Button,
  TextField,
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
async function waitFor(check: () => boolean) {
  for (let n = 0; n < 120; n++) {
    if (check()) return
    await delay(50)
  }
  throw new Error('Timed out waiting for wayfinding state')
}
async function next(check: () => boolean) {
  tap(find('wayfinding-next'))
  await waitFor(check)
  await delay(350)
}
async function run() {
  await waitFor(() => !!find('command-result')?.isLoaded)
  await delay(500)
  tap(find('command-trigger'))
  await waitFor(() => !!named('Invite a teammate I'))
  const editor = views().find((view) => view instanceof TextField) as TextField | undefined
  record(
    'command search uses a real native editor',
    editor?.getActualSize(),
    !!editor && editor.getActualSize().width > 0,
  )
  if (editor) editor.text = 'team'
  await nextTick()
  record(
    'command filters unavailable matches',
    !!named('Invite a teammate I'),
    !!named('Invite a teammate I') && !named('Open overview G O'),
  )
  tap(named('Invite a teammate I'))
  await waitFor(() => text('command-result') === 'invite' && !named('Invite a teammate I'))
  record(
    'command selection and dismissal',
    text('command-result'),
    text('command-result') === 'invite',
  )
  await next(() => !!find('rail-value'))
  tap(named('Projects 8'))
  await nextTick()
  record('rail app-owned navigation', text('rail-value'), text('rail-value') === 'projects')
  tap(named('Collapse navigation'))
  await delay(300)
  record(
    'compact rail preserves destination names',
    !!named('Projects 8. Current page'),
    !!named('Projects 8. Current page'),
  )
  tap(named('Expand navigation'))
  await next(() => !!find('breadcrumb-value'))
  tap(named('Show full path'))
  await nextTick()
  tap(named('Projects'))
  await nextTick()
  record(
    'breadcrumb expands and delegates navigation',
    text('breadcrumb-value'),
    text('breadcrumb-value') === '/projects',
  )
  await next(() => !!named('About this metric'))
  tap(named('About this metric'))
  await waitFor(
    () => !!withText('Active members are people who contributed during the last seven days.'),
  )
  const help = withText('Active members are people who contributed during the last seven days.')!
  record(
    'native help measures its text',
    help.getActualSize(),
    help.getActualSize().width > 0 && help.getActualSize().height > 0,
  )
  tap(named('About this metric'))
  await delay(250)
  await next(() => !!named('Approve and continue'))
  tap(named('Approve and continue'))
  await nextTick()
  record(
    'timeline advances while keeping its content',
    views().filter((view) => (view as { text?: string }).text === 'Complete').length,
    views().filter((view) => (view as { text?: string }).text === 'Complete').length === 3 &&
      !!withText('AM'),
  )
  await next(() => !!find('chart-value'))
  await delay(500)
  const plot = views().find((view) => view.cssClasses.has('m-chart-plot'))
  record(
    'chart has measured native geometry',
    plot?.getActualSize(),
    !!plot && plot.getActualSize().width > 80 && plot.getActualSize().height === 200,
  )
  const chart = views().find((view) => view.cssClasses.has('m-chart'))
  const position = plot && chart ? plot.getLocationRelativeTo(chart) : undefined
  record(
    'chart plot stays inside its container',
    { plot: plot?.getActualSize(), chart: chart?.getActualSize(), position },
    !!plot &&
      !!chart &&
      !!position &&
      position.x >= 0 &&
      position.x + plot.getActualSize().width <= chart.getActualSize().width + 1,
  )
  if (plot) tap(plot, { x: plot.getActualSize().width / 14, y: 130 })
  await nextTick()
  record(
    'chart tap resolves a stable category key',
    text('chart-value'),
    text('chart-value').startsWith('0/'),
  )
  tap(named('Show data'))
  await delay(350)
  record(
    'chart data retains missing observations',
    !!withText('Saves: No value'),
    !!withText('Saves: No value'),
  )
  tap(named('Another week'))
  await delay(350)
  record('chart replacement updates textual data', !!withText('Saves: 20'), !!withText('Saves: 20'))
  record(
    'all views have finite geometry',
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
    .getFile('wayfinding-check.json')
    .writeText(JSON.stringify(report, null, 2))
  console.log('MAVIS_WAYFINDING_CHECK', JSON.stringify(report))
})()
