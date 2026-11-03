import {
  Frame,
  View,
  Button,
  TextField,
  TimePicker,
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
const button = (label: RegExp) =>
  views().find(
    (view) =>
      ['button', 'link'].includes(view.accessibilityRole) &&
      label.test(view.accessibilityLabel || ''),
  )
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
const state = () => (find('collection-state') as { text?: string } | undefined)?.text ?? ''
async function run() {
  for (let n = 0; n < 100 && !find('collection-time')?.isLoaded; n++) await delay(100)
  await delay(800)
  if (!find('collection-time')) throw new Error('Collection screen did not mount')
  const bar = find('collection-app-bar')
  record(
    'app bar has intrinsic height',
    bar?.getActualSize(),
    !!bar && bar.getActualSize().height > 0 && bar.getActualSize().height < 160,
  )
  tap(button(/^Back$/))
  await nextTick()
  record('app bar callback', state(), state().startsWith('1|'))
  tap(button(/^Actions$/))
  await delay(300)
  record('anchored menu visible', !!button(/^Edit$/), !!button(/^Edit$/))
  record(
    'disabled menu action',
    button(/^Blocked$/)?.isEnabled,
    button(/^Blocked$/)?.isEnabled === false,
  )
  tap(button(/^Edit$/))
  await delay(200)
  record('menu selection and dismissal', state(), state().includes('|edit|') && !button(/^Edit$/))
  tap(button(/^Filters$/))
  await delay(300)
  const query = find('collection-query') as TextField
  record('popover native geometry', query?.getActualSize(), !!query?.getActualSize().width)
  if (query) query.text = 'Shared'
  await nextTick()
  tap(button(/^Apply filters$/))
  await delay(200)
  record(
    'popover closes and keeps shared draft',
    state(),
    state().includes('|Shared|') && !find('collection-query'),
  )
  const editor = find('collection-time') as TextField
  editor.text = '10:'
  await nextTick()
  record(
    'incomplete time preserves last model',
    state(),
    state().includes('|09:30|') && editor.text === '10:',
  )
  editor.text = '10:15 AM'
  await nextTick()
  record('localized time emits canonical model', state(), state().includes('|10:15|'))
  tap(button(/^Choose time/))
  await delay(650)
  const picker = views().find((view) => view instanceof TimePicker) as TimePicker | undefined
  record('system time picker presented', !!picker?.isLoaded, !!picker?.isLoaded)
  if (picker) picker.time = new Date(2000, 0, 1, 15, 30)
  await nextTick()
  record('picker selection remains provisional', state(), state().includes('|10:15|'))
  tap(button(/^Apply$/))
  await delay(650)
  record('confirmed time', state(), state().includes('|15:30|') && editor.text === '3:30 PM')
  tap(button(/^Save 1$/))
  await nextTick()
  record('row state belongs to item', state(), state().endsWith('|true'))
  tap(find('collection-last'))
  await delay(650)
  const rows = views().filter((view) => view.id?.startsWith('collection-row-'))
  record('native cells bounded for 1000 items', rows.length, rows.length > 0 && rows.length < 50)
  const last = find('collection-row-1000')
  record(
    'public scrollToIndex reaches final item',
    { rows: rows.map((row) => row.id), location: last?.getLocationOnScreen() },
    !!last,
  )
  tap(find('collection-reverse'))
  await delay(650)
  tap(find('collection-last'))
  await delay(650)
  record(
    'identity survives reorder and reuse',
    state(),
    state().endsWith('|true') && !!find('collection-row-1'),
  )
  tap(button(/^Saved collections/))
  await delay(200)
  record('tab bar app navigation', state(), state().includes('|saved|'))
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
    .getFile('collection-check.json')
    .writeText(JSON.stringify(report, null, 2))
  console.log('MAVIS_COLLECTION_CHECK', JSON.stringify(report))
})()
