import {
  Button,
  Frame,
  GestureTypes,
  Label,
  ListView,
  ScrollView,
  TextField,
  Utils,
  View,
  isIOS,
  knownFolders,
} from '@nativescript/core'
import { configure } from '@rafaelaugusto/jolt'

// Direct NativeScript events and native presentation measurements, not OS touch replay.
const samples: { name: string; value: unknown; valid: boolean }[] = []
const failures: string[] = []
const startedAt = new Date().toISOString()
let active = 'startup'
let deadline = Date.now() + 15_000
let done = false
function save() {
  knownFolders
    .documents()
    .getFile('jolt15-check.json')
    .writeTextSync(
      JSON.stringify(
        { startedAt, platform: isIOS ? 'ios' : 'android', active, done, samples, failures },
        null,
        2,
      ),
    )
}
export function recordError(error: unknown) {
  failures.push(`${active}: ${String((error as Error)?.stack ?? error)}`)
  save()
}
function record(name: string, value: unknown, valid: boolean) {
  samples.push({ name: `${active}: ${name}`, value, valid })
  if (!valid) failures.push(`${active}: ${name}`)
  save()
}
async function wait(ms: number) {
  if (Date.now() > deadline) throw new Error('Case exceeded its 45 second deadline')
  await new Promise<void>((resolve) => setTimeout(resolve, ms))
}
async function until(predicate: () => boolean, name: string, timeout = 6000) {
  const end = Math.min(deadline, Date.now() + timeout)
  while (Date.now() < end) {
    if (predicate()) return
    await wait(50)
  }
  throw new Error(
    `Timed out: ${name}; scroll=${text('scroll-check-modes')}; list=${text('virtual-changes-state')}; exits=${text('exit-status')}; values=${text('combined-state')}`,
  )
}
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
function required(id: string) {
  const view = find(id)
  if (!view) throw new Error(`Missing view ${id}`)
  return view
}
const text = (id: string) => (find(id) as Label | undefined)?.text ?? ''
function tap(id: string) {
  const view = required(id)
  const taps = view.getGestureObservers(GestureTypes.tap) ?? []
  if (!(view instanceof Button) && taps.length)
    for (const tap of taps)
      tap.callback.call(tap.context, { eventName: 'tap', object: view } as never)
  else view.notify({ eventName: 'tap', object: view })
}
function pose(id: string) {
  const view = required(id)
  const native = view.nativeViewProtected
  if (isIOS) {
    const layer = native.layer.presentationLayer() ?? native.layer
    return {
      x: Number(layer.valueForKeyPath('transform.translation.x')),
      y: Number(layer.valueForKeyPath('transform.translation.y')),
      scale: Number(layer.valueForKeyPath('transform.scale.x')),
      opacity: Number(layer.opacity),
    }
  }
  const density = Utils.layout.getDisplayDensity()
  return {
    x: Number(native.getTranslationX()) / density,
    y: Number(native.getTranslationY()) / density,
    scale: Number(native.getScaleX()),
    opacity: Number(native.getAlpha()),
  }
}
const near = (a: number, b: number, tolerance = 1) => Math.abs(a - b) <= tolerance
async function navigate(path: string, ready: string) {
  const { router } = require('./router') as typeof import('./router')
  await router.replace(path)
  await until(() => !!find(ready)?.isLoaded, `loaded ${path}`)
  await wait(100)
}

async function scrollExecution() {
  await until(() => !!find('scroll-check-auto')?.isLoaded, 'initial scroll surface', 12_000)
  // The page copies execution into text before native window geometry may exist. Read its
  // live diagnostics after layout, using the same explicit refresh available to the user.
  await until(() => {
    tap('scroll-check-refresh')
    return text('scroll-check-modes') === 'native,scheduler'
  }, 'compiled scroll backend')
  record('compiled and scheduler backends', text('scroll-check-modes'), true)
  const scroller = views().find((view) => view instanceof ScrollView) as ScrollView | undefined
  if (!scroller) throw new Error('Missing ScrollView')
  async function compare(offset: number, name: string) {
    scroller!.scrollToVerticalOffset(offset, false)
    await wait(180)
    const automatic = pose('scroll-check-auto'),
      fallback = pose('scroll-check-fallback')
    record(
      name,
      { offset: scroller!.verticalOffset, automatic, fallback },
      near(automatic.y, fallback.y) && near(automatic.opacity, fallback.opacity, 0.025),
    )
    return automatic.y
  }
  const before = await compare(0, 'initial paths agree')
  const top = required('scroll-check-section').getLocationRelativeTo(scroller)?.y
  if (top === undefined) throw new Error('Missing scroll section geometry')
  const moved = await compare(top + 240, 'scrolled paths agree')
  record('scroll changes the native presentation', { before, moved }, !near(before, moved, 3))
  tap('scroll-check-grow')
  await wait(150)
  tap('scroll-check-refresh')
  await compare(top + 420, 'resized section refreshes both ranges')
  tap('scroll-check-takeover')
  await wait(80)
  await compare(top + 100, 'explicit writes release the mapped channel')
  record(
    'takeover stays at the requested position',
    pose('scroll-check-auto'),
    near(pose('scroll-check-auto').y, -25) && near(pose('scroll-check-fallback').y, -25),
  )
  const previous = required('scroll-check-auto')
  tap('scroll-check-mount')
  await until(
    () => !find('scroll-check-auto') && text('scroll-check-modes') === 'released',
    'scroll detach',
  )
  tap('scroll-check-mount')
  await until(() => {
    if (!find('scroll-check-auto')?.isLoaded) return false
    tap('scroll-check-refresh')
    return text('scroll-check-modes') === 'native,scheduler'
  }, 'scroll remount')
  record(
    'new presentation owns fresh links',
    required('scroll-check-auto') !== previous,
    required('scroll-check-auto') !== previous,
  )
  await compare(top + 360, 'remounted paths agree')
}

function listSnapshot() {
  const list = required('virtual-changes-list') as ListView
  const native = list.nativeViewProtected
  let first = -1,
    top = 0,
    visible = 0
  if (isIOS) {
    const paths = native.indexPathsForVisibleRows
    visible = Number(paths?.count ?? 0)
    if (visible) {
      const path = paths.objectAtIndex(0)
      first = Number(path.row)
      top = Number(native.rectForRowAtIndexPath(path).origin.y - native.contentOffset.y)
    }
  } else {
    first = Number(native.getFirstVisiblePosition())
    visible = Number(native.getLastVisiblePosition()) - first + 1
    top = Number(native.getChildAt(0)?.getTop() ?? 0) / Utils.layout.getDisplayDensity()
  }
  const items = list.items as { id: number }[]
  const rows = views(list).filter((view) => /^virtual-row-/.test(view.id ?? ''))
  return {
    first,
    key: items[first]?.id,
    top,
    visible,
    realized: rows.length,
    ids: rows.map((view) => view.id),
  }
}
async function virtualChanges() {
  await navigate('/checks/virtual-changes', 'virtual-changes-list')
  tap('virtual-middle')
  await until(() => listSnapshot().key === 50 && !!find('virtual-draft-50')?.isLoaded, 'middle row')
  const field = views(required('virtual-draft-50')).find((view) => view instanceof TextField) as
    TextField | undefined
  if (!field) throw new Error('Missing row 50 TextField')
  field.text = 'retained draft'
  await until(
    () => text('virtual-changes-state').includes('|retained draft|'),
    'draft model update',
  )
  const anchor = listSnapshot()
  record('middle anchor starts at row 50', anchor, anchor.key === 50)
  for (const action of ['prepend', 'reverse', 'filter']) {
    tap(`virtual-${action}`)
    await wait(800)
    const after = listSnapshot()
    record(
      `${action} retains key and offset`,
      after,
      after.key === 50 && near(after.top, anchor.top, 2),
    )
    record(
      `${action} keeps realized views bounded`,
      after,
      after.realized > 0 && after.realized <= 24 && after.visible <= 6,
    )
    record(
      `${action} preserves the draft`,
      text('virtual-changes-state'),
      text('virtual-changes-state').includes('|retained draft|'),
    )
  }
  tap('virtual-last')
  await wait(200)
  tap('virtual-middle')
  await until(
    () => listSnapshot().key === 50 && !!find('virtual-draft-50')?.isLoaded,
    'recycled row 50',
  )
  const recycled = views(required('virtual-draft-50')).find(
    (view) => view instanceof TextField,
  ) as TextField
  record('recycling restores the logical draft', recycled.text, recycled.text === 'retained draft')
  const beforeRemoval = listSnapshot()
  tap('virtual-remove')
  await wait(800)
  const afterRemoval = listSnapshot()
  record(
    'removal preserves the neighboring anchor offset',
    afterRemoval,
    afterRemoval.key !== 50 &&
      near(afterRemoval.top, beforeRemoval.top, 2) &&
      afterRemoval.realized <= 24,
  )
  record(
    'removed record leaves the model',
    text('virtual-changes-state'),
    text('virtual-changes-state').startsWith('99|removed|'),
  )
  tap('virtual-hide')
  await until(() => !find('virtual-changes-list'), 'list disposal')
  record(
    'hiding releases realized rows',
    views().filter((view) => /^virtual-row-/.test(view.id ?? '')).length,
    !views().some((view) => /^virtual-row-/.test(view.id ?? '')),
  )
}

const exitRows = () =>
  views()
    .filter((view) => /^exit-card-/.test(view.id ?? ''))
    .map((view) => view.id)
const sameRows = (ids: number[]) =>
  JSON.stringify(exitRows()) === JSON.stringify(ids.map((id) => `exit-card-${id}`))
async function exits() {
  await navigate('/checks/portable', 'exit-list')
  await until(() => sameRows([1, 2, 3, 4]), 'initial exit rows')
  // Bring the static region into the viewport so native snapshot capture is exercised.
  const scroller = views().find((view) => view instanceof ScrollView) as ScrollView
  const offset = required('exit-list').getLocationRelativeTo(scroller)?.y ?? 0
  scroller.scrollToVerticalOffset(offset, false)
  await wait(100)
  const survivor = required('exit-card-3')
  tap('exit-remove')
  await until(() => sameRows([2, 3, 4]), 'removed original')
  tap('exit-restore')
  await until(
    () => sameRows([1, 2, 3, 4]) && text('exit-status') === 'complete',
    'reinsertion completion',
  )
  record(
    'reinsertion keeps the surviving native view',
    required('exit-card-3') === survivor,
    required('exit-card-3') === survivor,
  )
  tap('exit-mix')
  await until(
    () => sameRows([5, 4, 3, 1]) && text('exit-status') === 'complete',
    'mixed mutation completion',
  )
  record(
    'one mutation inserts removes reorders and resizes',
    { ids: exitRows(), height: required('exit-card-1').getActualSize().height },
    sameRows([5, 4, 3, 1]) && near(required('exit-card-1').getActualSize().height, 112),
  )
  tap('exit-budget')
  tap('exit-remove')
  await until(
    () => sameRows([4, 3, 1]) && text('exit-status') === 'complete',
    'pixel budget fallback',
  )
  record('tiny snapshot budget still commits the model', exitRows(), sameRows([4, 3, 1]))
  tap('exit-budget')
  tap('exit-remove')
  await until(() => sameRows([3, 1]), 'interruptible removal')
  tap('exit-stop')
  await until(() => text('exit-status') === 'cancelled', 'explicit cancellation')
  record('cancel preserves the committed mutation', exitRows(), sameRows([3, 1]))
  configure({ reducedMotion: 'always' })
  tap('exit-restore')
  await until(
    () => sameRows([1, 2, 3, 4]) && text('exit-status') === 'complete',
    'reduced motion completion',
  )
  record('reduced motion reaches the final model', exitRows(), sameRows([1, 2, 3, 4]))
  configure({ reducedMotion: 'never' })
  tap('exit-remove')
  await until(() => sameRows([2, 3, 4]), 'removal before detach')
  tap('exit-toggle')
  await until(() => !find('exit-list'), 'exit region disposal')
  record('region detach removes original views', exitRows(), exitRows().length === 0)
  tap('exit-toggle')
  await until(() => sameRows([2, 3, 4]), 'exit region remount')
  record('remount follows the retained model', exitRows(), sameRows([2, 3, 4]))
}

type CombinedState = {
  generation: number
  a: number | null
  b: number | null
  total: number | null
  position: number | null
  scale: number | null
  paused: boolean
  moving: boolean
  inputDisposed: boolean
  totalDisposed: boolean
  followerDisposed: boolean
  staleRejected: boolean
}
const combined = () => JSON.parse(text('combined-state') || '{}') as CombinedState
async function readCombined() {
  tap('combined-read')
  await wait(30)
  return combined()
}
async function settled(value: number) {
  await until(() => {
    tap('combined-read')
    const state = combined()
    return !state.moving && state.position !== null && near(state.position, value, 0.1)
  }, `spring settles at ${value}`)
  const state = await readCombined(),
    presentation = pose('combined-surface')
  record(
    `spring binds ${value} to the native presentation`,
    { state, presentation },
    near(presentation.x, value, 0.2),
  )
}
async function combinedValues() {
  await navigate('/checks/combined-values', 'combined-surface')
  await until(() => combined().generation === 1, 'initial combined graph')
  await settled(20)
  tap('combined-pause')
  await wait(50)
  const held = pose('combined-surface').x
  tap('combined-retarget')
  await wait(200)
  let state = await readCombined()
  record(
    'pause retains presentation while inputs retarget',
    { state, held, actual: pose('combined-surface').x },
    state.paused && state.total === 40 && near(pose('combined-surface').x, held, 0.1),
  )
  tap('combined-resume')
  await settled(40)
  tap('combined-b')
  await settled(35)
  tap('combined-dispose-graph')
  await wait(50)
  state = await readCombined()
  record(
    'graph disposal releases dependents and borrows inputs',
    state,
    state.totalDisposed && state.followerDisposed && !state.inputDisposed,
  )
  tap('combined-a')
  tap('combined-scale')
  await wait(80)
  state = await readCombined()
  record(
    'unrelated inputs and scale remain owned',
    { state, pose: pose('combined-surface') },
    state.a === 140 && state.scale === 1.08 && near(pose('combined-surface').scale, 1.08, 0.01),
  )
  const previous = required('combined-surface')
  tap('combined-toggle')
  await until(() => !find('combined-surface'), 'combined surface disposal')
  tap('combined-toggle')
  await until(
    () => !!find('combined-surface')?.isLoaded && combined().generation === 2,
    'fresh combined graph',
  )
  await settled(20)
  tap('combined-stale')
  await wait(30)
  state = combined()
  record(
    'remount invalidates old handles',
    state,
    state.staleRejected && required('combined-surface') !== previous,
  )
  tap('combined-dispose-input')
  await wait(50)
  state = await readCombined()
  record(
    'input disposal invalidates its derived graph only',
    state,
    state.inputDisposed && state.totalDisposed && state.followerDisposed && state.b === 20,
  )
}

async function run() {
  save()
  configure({ reducedMotion: 'never' })
  for (const [name, check] of [
    ['scroll execution', scrollExecution],
    ['virtual changes', virtualChanges],
    ['list exits', exits],
    ['combined values', combinedValues],
  ] as const) {
    active = name
    deadline = Date.now() + 45_000
    save()
    try {
      await check()
    } catch (error) {
      recordError(error)
    }
    configure({ reducedMotion: 'never' })
  }
  active = 'route cleanup'
  deadline = Date.now() + 10_000
  const { router } = require('./router') as typeof import('./router')
  await router.replace('/components/button')
  await until(() => !find('combined-surface') && !find('exit-list'), 'route cleanup')
  record(
    'navigation releases the tested presentations',
    views().filter((view) => /^(combined|exit|virtual-row|scroll-check)-/.test(view.id ?? ''))
      .length,
    !views().some((view) => /^(combined|exit|virtual-row|scroll-check)-/.test(view.id ?? '')),
  )
}
// Let NativeScript-Vue finish mounting its initial Frame before observing or navigating it.
setTimeout(() => {
  void run()
    .catch(recordError)
    .finally(() => {
      configure({ reducedMotion: 'user' })
      done = true
      active = 'complete'
      save()
    })
}, 0)
