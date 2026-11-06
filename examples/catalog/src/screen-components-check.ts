import {
  Frame,
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
  tap(find('screen-components-next'))
  await waitFor(check)
  await delay(350)
}
async function run() {
  await waitFor(() => !!named('Back to top'))
  await delay(600)
  record(
    'header has bounded native scroll geometry',
    views().filter((view) => view instanceof ScrollView).length,
    views().filter((view) => view instanceof ScrollView).length >= 2,
  )
  tap(named('Change header size'))
  await delay(300)
  record(
    'header preserves content after resizing',
    !!withText('A place to return'),
    !!withText('A place to return'),
  )
  await next(() => !!find('refresh-edition'))
  await delay(700)
  tap(named('Refresh'))
  await waitFor(() => !!named('Cancel refresh'))
  tap(named('Cancel refresh'))
  await delay(1000)
  record(
    'cancelled refresh cannot commit',
    text('refresh-edition'),
    text('refresh-edition') === 'Edition 1',
  )
  tap(named('Refresh'))
  await waitFor(() => text('refresh-edition') === 'Edition 2')
  record(
    'refresh applies one guarded result',
    text('refresh-edition'),
    text('refresh-edition') === 'Edition 2',
  )
  await next(() => !!find('composer-sent'))
  const composer = named('Your message') as TextView
  if (!composer) throw new Error('Missing composer editor')
  composer.text = 'Keep this thought'
  await nextTick()
  tap(named('Add attachment'))
  await nextTick()
  record(
    'composer retains draft with attachment',
    composer.text,
    composer.text === 'Keep this thought',
  )
  tap(named('Remove attachment: field-notes-1.pdf'))
  await nextTick()
  tap(named('Send message'))
  await waitFor(() => text('composer-sent') === '1')
  record('composer send remains application-owned', composer.text, composer.text === '')
  await next(() => !!find('dial-selection'))
  tap(named('Create something'))
  await waitFor(() => !!named('Write a note'))
  record(
    'dial respects disabled action',
    named('Publish')?.isEnabled,
    named('Publish')?.isEnabled === false,
  )
  tap(named('Write a note'))
  await waitFor(() => text('dial-selection') === 'note')
  record(
    'dial selects an application action',
    text('dial-selection'),
    text('dial-selection') === 'note',
  )
  await next(() => !!find('pin-complete'))
  const pin = named('Verification code') as TextField
  if (!pin) throw new Error('Missing PIN editor')
  pin.text = '012345'
  await waitFor(() => text('pin-complete') === '012345')
  record('pin preserves zeros and completion', pin.text, pin.text === '012345')
  pin.text = '9-８７ ６５４'
  await waitFor(() => text('pin-complete') === '987654', `normalized PIN: ${pin.text}`)
  record('pin normalizes paste', pin.text, pin.text === '987654')
  await next(() => !!find('animated-phrase'))
  tap(named('Next phrase'))
  await delay(1000)
  record(
    'animated text settles to canonical phrase',
    text('animated-phrase'),
    text('animated-phrase') === 'Follow the unexpected.',
  )
  tap(named('Replay'))
  await delay(1000)
  record(
    'animated text replay preserves text',
    text('animated-phrase'),
    text('animated-phrase') === 'Follow the unexpected.',
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
    .getFile('screen-components-check.json')
    .writeText(JSON.stringify(report, null, 2))
  console.log('MAVIS_SCREEN_COMPONENTS_CHECK', JSON.stringify(report))
})()
