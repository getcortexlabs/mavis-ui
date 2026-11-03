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
import { configure } from '@rafaelaugusto/jolt'

declare const CAGradientLayer: new () => { type: string }

// Opt-in integration probe. These callbacks are synthetic; OS gestures are recorded separately.
const samples: { name: string; value: unknown }[] = [],
  failures: string[] = []
const startedAt = new Date().toISOString()
function save(done = false) {
  knownFolders
    .documents()
    .getFile('visual-check.json')
    .writeTextSync(JSON.stringify({ startedAt, done, samples, failures }, null, 2))
}
export function recordError(error: unknown) {
  failures.push(String((error as Error)?.stack ?? error))
  save()
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
  save()
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
function gradients(native: any) {
  if (isIOS) {
    const layers = native.layer.sublayers
    const result: string[] = []
    for (let i = 0; i < (layers?.count ?? 0); i++) {
      const layer = layers.objectAtIndex(i)
      if (layer instanceof CAGradientLayer) result.push(String(layer.type))
    }
    return result
  }
  const background = native.getBackground()
  const result: string[] = []
  for (let i = 0; i < (background.getNumberOfLayers?.() ?? 0); i++)
    result.push(String(background.getDrawable(i).getClass().getName()))
  return result.filter((value) => value.includes('GradientLayer'))
}
function loaderLayer() {
  const layers = find('lustre-loader')!.nativeViewProtected.layer.sublayers
  for (let index = 0; index < (layers?.count ?? 0); index++) {
    const layer = layers.objectAtIndex(index)
    if (layer.name === 'jolt:loader') return layer
  }
}
function hasShimmer() {
  let layer = find('lustre-shimmer')!.nativeViewProtected.layer
  while (layer) {
    if (layer.animationForKey('jolt:shimmer')) return true
    layer = layer.mask
  }
  return false
}
async function run() {
  save()
  await waitFor(() => !!find('lustre-paint')?.getActualSize().width, 'Lustre layout')
  await delay(800)
  if (isIOS) {
    record('native shimmer mask is animated', hasShimmer(), hasShimmer())
    record(
      'native dots loader has three instances',
      loaderLayer()?.instanceCount,
      loaderLayer()?.instanceCount === 3,
    )
    for (const [style, count] of [
      ['ring', 12],
      ['bars', 5],
    ] as const) {
      tap(`lustre-loader-${style}`)
      await delay(150)
      record(
        `native ${style} loader replaces its layer`,
        loaderLayer()?.instanceCount,
        loaderLayer()?.instanceCount === count,
      )
    }
    tap('lustre-loading-toggle')
    await delay(150)
    record(
      'stopping loading releases native loader and shimmer',
      { loader: !!loaderLayer(), shimmer: hasShimmer() },
      !loaderLayer() && !hasShimmer(),
    )
  } else
    record(
      'unsupported native loading effects are disclosed',
      !!find('lustre-loading-limit'),
      !!find('lustre-loading-limit'),
    )
  let paint = find('lustre-paint')!
  // Retain the actual native object so cleanup can be measured after Core clears view.ios/android.
  let nativePaint = isIOS ? paint.ios : paint.android
  record(
    'native gradient layer installed',
    gradients(nativePaint),
    gradients(nativePaint).length === 1,
  )
  for (const kind of ['radial', 'conic', 'linear']) {
    tap(`lustre-${kind}`)
    await delay(250)
    record(
      `${kind} replaces one native gradient`,
      gradients(nativePaint),
      gradients(nativePaint).length === 1,
    )
  }
  tap('lustre-shift')
  await delay(1000)
  tap('lustre-replace')
  await delay(350)
  record(
    'target replacement releases old gradient',
    gradients(nativePaint),
    gradients(nativePaint).length === 0,
  )
  paint = find('lustre-paint')!
  nativePaint = isIOS ? paint.ios : paint.android
  record(
    'target replacement attaches new gradient',
    gradients(nativePaint),
    gradients(nativePaint).length === 1,
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
  void router.replace('/showcase/current')
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
  const heading = find('current-title') as Label
  const fontSize = heading.fontSize
  const artworkOffset = () =>
    find('current-artwork')!.getLocationOnScreen().y -
    find('current-header')!.getLocationOnScreen().y
  const initialArtworkOffset = artworkOffset()
  heading.fontSize = fontSize + 6
  await delay(500)
  record(
    'collapsed header keeps artwork aligned during text reflow',
    { before: initialArtworkOffset, after: artworkOffset() },
    Math.abs(artworkOffset() - initialArtworkOffset) < 1,
  )
  heading.fontSize = fontSize
  await delay(300)
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
  await waitFor(() => !!find('current-cancel'), 'refresh callback started')
  tap('current-cancel')
  await delay(1200)
  record(
    'cancelled refresh cannot commit late data',
    (find('current-status') as Label).text,
    /1 atualizações|1 refreshes/.test((find('current-status') as Label).text),
  )
  tap('current-mount')
  await waitFor(() => !find('current-collection'), 'collection unmounted')
  tap('current-mount')
  await waitFor(
    () => /ready/.test((find('current-status') as Label)?.text ?? ''),
    'collection remounted',
  )
  await delay(500)
  tap('current-down-note-8')
  await waitFor(
    () => /2 movimentos|2 moves/.test((find('current-status') as Label)?.text ?? ''),
    'remounted reorder commit',
  )
  record(
    'remounted reorder uses the replacement rows',
    (find('current-status') as Label).text,
    /2 movimentos|2 moves/.test((find('current-status') as Label).text),
  )
  const rowCount = views().filter((view) =>
    /^current-(note-\d+|new-\d+|fresh-\d+)$/.test(view.id ?? ''),
  ).length
  for (let index = 0; index < rowCount; index++) {
    tap('current-remove')
    await delay(50)
  }
  await delay(300)
  record(
    'empty retained collection remains available',
    (find('current-status') as Label).text,
    /ready/.test((find('current-status') as Label).text) &&
      !views().some((view) => /^current-(note-\d+|new-\d+|fresh-\d+)$/.test(view.id ?? '')),
  )
  tap('current-insert')
  await waitFor(() => !!find('current-new-3'), 'insert into empty collection')
  record(
    'empty collection accepts a new keyed row',
    !!find('current-new-3'),
    !!find('current-new-3'),
  )
  tap('current-refresh')
  await waitFor(() => !!find('current-cancel'), 'refresh before route teardown')
  void router.replace('/showcase')
  await delay(1200)
  record(
    'route teardown removes retained surfaces',
    !!find('current-header'),
    !find('current-header'),
  )
}
void run()
  .catch(recordError)
  .finally(() => {
    configure({ reducedMotion: 'user' })
    save(true)
  })
