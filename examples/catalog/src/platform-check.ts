import {
  Frame,
  View,
  Label,
  Button,
  Image,
  GestureTypes,
  isIOS,
  knownFolders,
} from '@nativescript/core'
import { configure } from '@rafaelaugusto/jolt'

const samples: { name: string; value: unknown }[] = [],
  failures: string[] = []
const startedAt = new Date().toISOString()
function save(done = false) {
  knownFolders
    .documents()
    .getFile('platform-check.json')
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
const text = (id: string) => (find(id) as Label | undefined)?.text ?? ''
function record(name: string, value: unknown, valid: boolean) {
  samples.push({ name, value })
  if (!valid) failures.push(name)
  save()
}
async function until(predicate: () => boolean, name: string) {
  for (let n = 0; n < 120; n++) {
    if (predicate()) return
    await delay(100)
  }
  throw new Error(`Timed out: ${name}; ${text('orbit-error')} ${text('prism-error')}`)
}
function tap(id: string) {
  const view = find(id)!
  if (!view) throw new Error(`Missing ${id}`)
  const taps = view.getGestureObservers(GestureTypes.tap) ?? []
  if (!(view instanceof Button) && taps.length)
    for (const tap of taps)
      tap.callback.call(tap.context, { eventName: 'tap', object: view } as never)
  else view.notify({ eventName: 'tap', object: view })
}
const image = () => views(find('prism-photo')).find((view) => view instanceof Image) as Image
const position = (id: string) => {
  const native = find(id)!.nativeViewProtected
  const layer = isIOS ? (native.layer.presentationLayer() ?? native.layer) : undefined
  return isIOS
    ? { x: layer.transform.m41, y: layer.transform.m42 }
    : { x: native.getTranslationX(), y: native.getTranslationY() }
}
async function run() {
  save()
  await until(() => /ready|pronta/i.test(text('prism-ready')), 'decoded image')
  await delay(600)
  tap('prism-confetti')
  tap('prism-soften')
  tap('prism-morph')
  await delay(900)
  record(
    'native surface effects remain mounted',
    !!find('prism-shape')?.nativeViewProtected,
    !failures.length,
  )
  const original = image().imageSource
  tap('prism-prepare')
  await until(() => text('prism-status') === 'paused', 'prepared dissolve')
  tap('prism-seek')
  record(
    'paused dissolve retains the source',
    image().imageSource === original,
    image().imageSource === original,
  )
  tap('prism-finish')
  await until(() => text('prism-status') === 'completed', 'completed dissolve')
  record(
    'dissolve commits a prepared image',
    image().imageSource !== original,
    image().imageSource !== original,
  )
  const previousView = image()
  tap('prism-replace')
  await until(
    () => image() !== previousView && /ready|pronta/i.test(text('prism-ready')),
    'replacement image',
  )
  tap('prism-prepare')
  await until(() => text('prism-status') === 'paused', 'second dissolve')
  tap('prism-stop')
  await until(() => text('prism-status') === 'cancelled', 'cancelled dissolve')
  record('cancel leaves the loaded model coherent', !!image().imageSource, !!image().imageSource)
  if (isIOS) {
    record(
      'system symbol capability',
      find('prism-bounce')?.isEnabled,
      !!find('prism-bounce')?.isEnabled,
    )
    tap('prism-bounce')
    tap('prism-liquid')
    await delay(300)
    tap('prism-liquid')
  } else
    record(
      'unsupported liquid is disabled',
      find('prism-liquid')?.isEnabled,
      find('prism-liquid')?.isEnabled === false,
    )
  tap('prism-mount')
  await delay(100)
  record('surface teardown removes native children', !!find('prism-photo'), !find('prism-photo'))
  tap('prism-mount')
  await until(() => /ready|pronta/i.test(text('prism-ready')), 'remounted image')
  const { router } = require('./router') as typeof import('./router')
  await router.replace('/showcase/orbit')
  await until(() => /Ready to move|Pronto para mover/.test(text('orbit-ready')), 'physics layout')
  tap('orbit-pause')
  await delay(100)
  const held = position('orbit-ball-2')
  await delay(200)
  record(
    'physics pauses native presentation',
    position('orbit-ball-2'),
    JSON.stringify(position('orbit-ball-2')) === JSON.stringify(held),
  )
  tap('orbit-reset')
  tap('orbit-pause')
  tap('orbit-impulse')
  await delay(250)
  record(
    'physics impulse moves native presentation',
    position('orbit-ball-2'),
    JSON.stringify(position('orbit-ball-2')) !== JSON.stringify(held),
  )
  tap('orbit-mount')
  await delay(100)
  tap('orbit-mount')
  await until(
    () => /Ready to move|Pronto para mover/.test(text('orbit-ready')),
    'new physics world',
  )
  record('physics remount has no error', text('orbit-error'), !find('orbit-error'))
  configure({ reducedMotion: 'always' })
  await router.replace('/showcase/prism')
  await until(() => /ready|pronta/i.test(text('prism-ready')), 'reduced image')
  tap('prism-dissolve')
  await until(() => text('prism-status') === 'completed', 'reduced dissolve')
  record('reduced motion commits destination', text('prism-status'), true)
  await router.replace('/showcase')
  await delay(100)
  record(
    'navigation releases all new presentations',
    views().filter((view) => /^(prism|orbit)-/.test(view.id ?? '')).length,
    !views().some((view) => /^(prism|orbit)-/.test(view.id ?? '')),
  )
}
void run()
  .catch(recordError)
  .finally(() => {
    configure({ reducedMotion: 'user' })
    save(true)
  })
