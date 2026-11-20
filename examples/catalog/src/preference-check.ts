import { Frame, View, GestureTypes, knownFolders, isIOS } from '@nativescript/core'
import { configure, onReducedMotion, reducedMotion } from '@rafaelaugusto/jolt'

const failures: string[] = [],
  samples: { name: string; value: unknown }[] = []
export const recordError = (error: unknown) => failures.push(String(error))
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
function views(root: View | undefined = Frame.topmost()?.currentPage): View[] {
  if (!root) return []
  const all = [root]
  root.eachChildView((child) => {
    all.push(...views(child))
    return true
  })
  return all
}
const find = (id: string) => views().find((view) => view.id === id)
function tap(id: string) {
  const view = find(id)!
  if (!view) throw new Error('Missing ' + id)
  const listeners = view.getGestureObservers(GestureTypes.tap) ?? []
  if (listeners.length)
    for (const listener of listeners)
      listener.callback.call(listener.context, {
        eventName: 'tap',
        object: view,
        getX: () => 1,
        getY: () => 1,
      } as never)
  else view.notify({ eventName: 'tap', object: view })
}
const record = (name: string, value: unknown, valid: boolean) => {
  samples.push({ name, value })
  if (!valid) failures.push(name)
}
async function wait(check: () => boolean) {
  for (let i = 0; i < 120; i++) {
    if (check()) return
    await delay(50)
  }
  throw new Error('Preference fixture did not reach expected lifecycle state')
}
function geometry() {
  const plot = views().find((view) => view.className === 'm-chart-plot')!
  const bars: number[] = []
  plot.eachChildView((child) => {
    const size = child.getActualSize()
    if (size.width > 2 && size.height > 2) bars.push(size.height)
    return true
  })
  return { bar: bars[0]!, primary: find('preference-primary')!.getActualSize().width }
}
const same = (a: ReturnType<typeof geometry>, b: ReturnType<typeof geometry>) =>
  Math.abs(a.bar - b.bar) < 1 && Math.abs(a.primary - b.primary) < 1
void (async () => {
  const changes: boolean[] = []
  const system = reducedMotion()
  configure({ reducedMotion: 'never' })
  const off = onReducedMotion((value) => changes.push(value))
  try {
    await wait(() => !!find('preference-primary'))
    await delay(800)
    const initial = geometry()
    tap('preference-change')
    await delay(80)
    const moving = geometry()
    configure({ reducedMotion: 'always' })
    await delay(120)
    const settled = geometry()
    await delay(500)
    record(
      'changing preference settles chart and numeric layout in flight',
      { initial, moving, settled, final: geometry() },
      !same(initial, settled) && !same(moving, settled) && same(settled, geometry()),
    )
    tap('preference-change')
    await delay(120)
    record('reduced updates reach final geometry', geometry(), same(initial, geometry()))
    for (let round = 0; round < 3; round++) {
      tap('preference-mount')
      await wait(() => !find('preference-primary'))
      configure({ reducedMotion: 'never' })
      configure({ reducedMotion: 'always' })
      tap('preference-mount')
      await wait(() => !!find('preference-primary'))
      configure({ reducedMotion: 'never' })
      tap('preference-change')
      await delay(80)
      const step = geometry()
      await delay(700)
      record(`remount ${round} resumes motion`, { step, end: geometry() }, !same(step, geometry()))
      tap('preference-active')
      await wait(() => !find('preference-primary'))
      configure({ reducedMotion: 'always' })
      tap('preference-active')
      await wait(() => !!find('preference-primary'))
      configure({ reducedMotion: 'never' })
      tap('preference-change')
      await delay(80)
      const active = geometry()
      await delay(700)
      record(
        `KeepAlive ${round} resumes motion`,
        { active, end: geometry() },
        !same(active, geometry()),
      )
    }
    const before = changes.length
    configure({ reducedMotion: 'always' })
    configure({ reducedMotion: 'always' })
    configure({ reducedMotion: 'never' })
    configure({ reducedMotion: 'never' })
    record(
      'public observers report actual changes once',
      changes.slice(before),
      JSON.stringify(changes.slice(before)) === '[true,false]',
    )
    configure({ reducedMotion: 'user' })
    record(
      'user policy returns to the platform preference',
      reducedMotion(),
      reducedMotion() === system,
    )
  } catch (error) {
    recordError(error)
  } finally {
    off()
    configure({ reducedMotion: 'user' })
  }
  await knownFolders
    .documents()
    .getFile('preference-check.json')
    .writeText(
      JSON.stringify({ done: true, platform: isIOS ? 'ios' : 'android', samples, failures }),
    )
})()
