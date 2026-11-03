import {
  Frame,
  View,
  Label,
  Button,
  ScrollView,
  GestureTypes,
  isIOS,
  knownFolders,
} from '@nativescript/core'
import { nextTick } from 'nativescript-vue'
import { configure } from '@rafaelaugusto/jolt'

declare const CAGradientLayer: new () => { type: string }

// Opt-in integration probe. These callbacks are synthetic; OS gestures are recorded separately.
const samples: { name: string; value: unknown }[] = [],
  failures: string[] = []
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
function record(name: string, value: unknown, valid: boolean) {
  samples.push({ name, value })
  if (!valid) failures.push(name)
}
async function waitFor(predicate: () => boolean, name: string) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (predicate()) return
    await delay(100)
  }
  throw new Error(`Timed out: ${name}`)
}
function tap(id: string) {
  const view = find(id)
  if (!view) throw new Error(`Missing ${id}`)
  if (view instanceof Button) view.notify({ eventName: 'tap', object: view })
  else {
    const observers = view.getGestureObservers(GestureTypes.tap) ?? []
    if (observers.length)
      for (const observer of observers)
        observer.callback.call(observer.context, { eventName: 'tap', object: view } as never)
    else view.notify({ eventName: 'tap', object: view })
  }
}
function gradients(view: View) {
  if (isIOS) {
    const layers = view.ios.layer.sublayers
    const result: string[] = []
    for (let i = 0; i < (layers?.count ?? 0); i++) {
      const layer = layers.objectAtIndex(i)
      if (layer instanceof CAGradientLayer) result.push(String(layer.type))
    }
    return result
  }
  const native = view.android.getBackground()
  const result: string[] = []
  for (let i = 0; i < (native.getNumberOfLayers?.() ?? 0); i++)
    result.push(String(native.getDrawable(i).getClass().getName()))
  return result.filter((value) => value.includes('GradientLayer'))
}
async function run() {
  await waitFor(() => !!find('lustre-paint')?.getActualSize().width, 'Lustre layout')
  await delay(800)
  let paint = find('lustre-paint')!
  record('native gradient layer installed', gradients(paint), gradients(paint).length === 1)
  for (const kind of ['radial', 'conic', 'linear']) {
    tap(`lustre-${kind}`)
    await delay(250)
    record(`${kind} replaces one native gradient`, gradients(paint), gradients(paint).length === 1)
  }
  tap('lustre-shift')
  await delay(1000)
  tap('lustre-replace')
  await delay(350)
  record(
    'target replacement releases old gradient',
    gradients(paint),
    gradients(paint).length === 0,
  )
  paint = find('lustre-paint')!
  record(
    'target replacement attaches new gradient',
    gradients(paint),
    gradients(paint).length === 1,
  )
  tap('lustre-roll')
  tap('lustre-roll')
  tap('lustre-roll')
  await delay(1400)
  record(
    'rolling counter keeps formatted final text',
    (find('lustre-amount') as Label).text,
    /14[.,]159/.test((find('lustre-amount') as Label).text),
  )
  tap('lustre-text')
  await delay(1400)
  record(
    'animated text keeps source label',
    (find('lustre-heading') as Label).text,
    /Uma luz diferente|A different light/.test((find('lustre-heading') as Label).text),
  )
  const circle = find('lustre-circle')!,
    height = circle.getActualSize().height
  if (isIOS) {
    tap('lustre-circle-toggle')
    await delay(850)
    record(
      'concealed native panel retains geometry and blocks interaction',
      {
        visibility: circle.visibility,
        height: circle.getActualSize().height,
        hidden: circle.accessibilityHidden,
        interactive: circle.isUserInteractionEnabled,
      },
      circle.visibility === 'hidden' &&
        Math.abs(circle.getActualSize().height - height) < 1 &&
        circle.accessibilityHidden &&
        !circle.isUserInteractionEnabled,
    )
    tap('lustre-circle-toggle')
    await delay(100)
    tap('lustre-circle-toggle')
    await delay(100)
    tap('lustre-circle-toggle')
    await delay(900)
    record(
      'circular reversal restores interaction',
      circle.visibility,
      circle.visibility === 'visible' && circle.isUserInteractionEnabled,
    )
  } else
    record(
      'unsupported circular control stays disabled',
      find('lustre-circle-toggle')?.isEnabled,
      !find('lustre-circle-toggle')?.isEnabled,
    )
  configure({ reducedMotion: 'always' })
  tap('lustre-text')
  tap('lustre-roll')
  await delay(250)
  record(
    'reduced motion reaches final counter',
    (find('lustre-amount') as Label).text,
    /5[.,]159/.test((find('lustre-amount') as Label).text),
  )
  configure({ reducedMotion: 'user' })
  const { router } = await import('./router')
  await router.replace('/showcase/current')
  await waitFor(
    () => /ready/.test((find('current-status') as Label)?.text ?? ''),
    'Current controller',
  )
  await delay(1000)
  const scroll = views().find((view) => view instanceof ScrollView) as ScrollView
  record(
    'retained screen owns one native ScrollView',
    views().filter((view) => view instanceof ScrollView).length,
    views().filter((view) => view instanceof ScrollView).length === 1,
  )
  tap('current-jump')
  await delay(500)
  const y = () => find('current-note-8')!.getLocationOnScreen().y
  const before = y()
  tap('current-insert')
  await waitFor(() => !!find('current-new-1'), 'inserted row')
  await delay(600)
  record(
    'keyed insertion preserves visible native row',
    { before, after: y(), offset: scroll.verticalOffset },
    Math.abs(y() - before) < 3,
  )
  tap('current-down-note-8')
  await delay(500)
  record(
    'programmatic retained reorder commits host state',
    (find('current-status') as Label).text,
    /1 movimentos|1 moves/.test((find('current-status') as Label).text),
  )
  tap('current-top')
  await delay(600)
  tap('current-large')
  await delay(500)
  record(
    'header remeasures resized native layout',
    find('current-header')!.getActualSize().height,
    Math.abs(find('current-header')!.getActualSize().height - 310) < 1,
  )
  tap('current-fail')
  tap('current-refresh')
  await delay(1200)
  record(
    'refresh error is presented',
    (find('current-error') as Label)?.text,
    !!find('current-error'),
  )
  tap('current-refresh')
  await delay(1300)
  record(
    'refresh retries and commits once',
    (find('current-status') as Label).text,
    /1 atualizações|1 refreshes/.test((find('current-status') as Label).text),
  )
  tap('current-refresh')
  await nextTick()
  tap('current-cancel')
  await delay(1200)
  record(
    'cancelled refresh cannot commit late data',
    (find('current-status') as Label).text,
    /1 atualizações|1 refreshes/.test((find('current-status') as Label).text),
  )
  tap('current-refresh')
  await router.replace('/showcase')
  await delay(1200)
  record(
    'route teardown removes retained surfaces',
    !!find('current-header'),
    !find('current-header'),
  )
}
void run()
  .catch(recordError)
  .finally(async () => {
    configure({ reducedMotion: 'user' })
    await knownFolders
      .documents()
      .getFile('visual-check.json')
      .writeText(JSON.stringify({ done: true, samples, failures }, null, 2))
  })
