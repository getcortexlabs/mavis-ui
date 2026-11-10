// Opt-in runtime check of paths, axis rotation and shadows on the shared depth screen
// (--env.depthCheck). Buttons are activated through their tap events; values are read
// from the native views, not from the recipe.
import { Button, Frame, Label, Utils, View, isIOS, knownFolders } from '@nativescript/core'

const samples: { name: string; value: unknown }[] = [],
  failures: string[] = []
const startedAt = new Date().toISOString()
function save(done = false) {
  knownFolders
    .documents()
    .getFile('depth-check.json')
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
// The screen's buttons in order; their labels follow the app's language.
const controls = { send: 0, hold: 1, recall: 2, conflict: 3, tilt: 4, turn: 5, lift: 6, mount: 7 }
const press = (control: keyof typeof controls) => {
  const button = views().filter((view) => view instanceof Button)[controls[control]]
  if (!button) throw new Error(`Missing ${control} button`)
  button.notify({ eventName: 'tap', object: button })
}
const text = (id: string) => (find(id) as Label | undefined)?.text ?? null
function record(name: string, value: unknown, valid: boolean) {
  samples.push({ name, value })
  if (!valid) failures.push(name)
  save()
}
const near = (value: number, target: number, tolerance: number) =>
  Math.abs(value - target) <= tolerance

function pose(id: string) {
  const view = find(id)
  if (!view) return null
  const native = view.nativeViewProtected
  if (isIOS) {
    const layer = native.layer.presentationLayer() ?? native.layer
    const read = (key: string) => Number(layer.valueForKeyPath(key))
    const degrees = (key: string) => (read(key) * 180) / Math.PI
    return {
      x: read('transform.translation.x'),
      y: read('transform.translation.y'),
      rotate: degrees('transform.rotation.z'),
      rotateX: degrees('transform.rotation.x'),
      rotateY: degrees('transform.rotation.y'),
      perspective: native.layer.transform.m34 === 0 ? 0 : -1 / native.layer.transform.m34,
    }
  }
  const density = Utils.layout.getDisplayDensity()
  return {
    x: native.getTranslationX() / density,
    y: native.getTranslationY() / density,
    rotate: native.getRotation(),
    rotateX: native.getRotationX(),
    rotateY: native.getRotationY(),
    perspective: native.getCameraDistance() / density,
  }
}
function shadow(id: string) {
  const value = (find(id) as (View & { boxShadow?: unknown }) | undefined)?.boxShadow
  const first = Array.isArray(value) ? value[0] : undefined
  if (!first) return null
  const length = (input: unknown) =>
    typeof input === 'number' ? input : Number((input as { value?: number })?.value)
  return {
    y: length(first.offsetY),
    blur: length(first.blurRadius),
    alpha: ((first.color?.argb ?? 0) >>> 24) / 255,
  }
}

async function run() {
  save()
  for (let n = 0; n < 150 && !find('depth-courier'); n++) await delay(100)
  await delay(1200)
  const resting = pose('depth-courier')
  record('path-rest', resting, resting !== null && near(resting.x, 0, 0.5))

  press('send')
  await delay(650)
  const flying = pose('depth-courier')
  record(
    'path-in-flight',
    flying,
    flying !== null && flying.x > 10 && flying.x < 190 && flying.y < -4 && flying.y > -42,
  )
  await delay(1500)
  const delivered = pose('depth-courier')
  record(
    'path-end',
    { pose: delivered, route: text('depth-route') },
    delivered !== null &&
      near(delivered.x, 196, 0.6) &&
      near(delivered.y, 0, 0.6) &&
      near(delivered.rotate, 69.444, 1) &&
      ['Delivered', 'Entregue'].includes(String(text('depth-route'))),
  )

  press('conflict')
  await delay(250)
  const kept = pose('depth-courier')
  record(
    'path-conflict-rejected',
    { failure: text('depth-failure'), pose: kept },
    /path owns x and y/.test(String(text('depth-failure'))) &&
      kept !== null &&
      near(kept.x, 196, 0.6),
  )

  press('hold')
  await delay(500)
  const held = pose('depth-courier')
  await delay(400)
  const still = pose('depth-courier')
  record(
    'path-held-halfway',
    { held, still },
    held !== null && still !== null && held.x > 60 && held.x < 140 && near(still.x, held.x, 0.5),
  )

  press('recall')
  await delay(400)
  const recalled = pose('depth-courier')
  record(
    'path-recalled',
    recalled,
    recalled !== null && near(recalled.x, 0, 0.6) && near(recalled.rotate, 0, 1),
  )

  press('tilt')
  await delay(1400)
  const tilted = pose('depth-panel')
  record(
    'axes-tilted-under-parent-perspective',
    tilted,
    tilted !== null &&
      near(tilted.rotateX, 14, 1) &&
      near(tilted.rotateY, -22, 1) &&
      near(tilted.perspective, 640, 8),
  )
  press('turn')
  await delay(1400)
  const turned = pose('depth-panel')
  record(
    'one-axis-replaced',
    turned,
    turned !== null && near(turned.rotateX, 14, 1) && near(turned.rotateY, 22, 1),
  )
  press('tilt')
  await delay(1400)
  const level = pose('depth-panel')
  record(
    'axes-level',
    level,
    level !== null && near(level.rotateX, 0, 1) && near(level.rotateY, 0, 1),
  )

  const before = shadow('depth-card')
  const message = text('depth-shadow')
  press('lift')
  await delay(1200)
  const raised = pose('depth-card')
  const cast = shadow('depth-card')
  record(
    isIOS ? 'ios-shadow-follows' : 'android-shadow-static',
    { message, before, raised, cast },
    raised !== null &&
      near(raised.y, -8, 0.6) &&
      before !== null &&
      cast !== null &&
      (isIOS
        ? near(cast.blur, 40, 1) && near(cast.y, 16, 0.6) && near(cast.alpha, 0.2, 0.02)
        : near(cast.blur, before.blur, 0.01) && near(cast.alpha, before.alpha, 0.01)),
  )
  press('lift')
  await delay(1200)
  const lowered = pose('depth-card')
  const rest = shadow('depth-card')
  record(
    'card-lowered',
    { lowered, rest },
    lowered !== null && near(lowered.y, 0, 0.6) && rest !== null && near(rest.blur, 6, 1),
  )

  press('send')
  await delay(400)
  press('mount')
  await delay(600)
  record('unmounted-in-flight', find('depth-courier') === undefined, !find('depth-courier'))
  const remount = views().filter((view) => view instanceof Button)[0]
  remount?.notify({ eventName: 'tap', object: remount })
  await delay(1200)
  const fresh = pose('depth-courier')
  record('remounted-at-rest', fresh, fresh !== null && near(fresh.x, 0, 0.6))
  save(true)
}
run().catch((error) => {
  recordError(error)
  save(true)
})
