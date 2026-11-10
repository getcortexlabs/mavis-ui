// Opt-in runtime check of pointer input on Afterglow (--env.pointerCheck), with the scene's
// diagnostics shown. Hover is injected as synthetic mouse events through the
// window: it shows the wiring from platform input to the shared recipe, not a physical mouse.
import { Application, Button, Frame, Label, View, isIOS, knownFolders } from '@nativescript/core'

const samples: { name: string; value: unknown }[] = [],
  failures: string[] = []
const startedAt = new Date().toISOString()
function save(done = false) {
  knownFolders
    .documents()
    .getFile('pointer-check.json')
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
// The diagnostics' buttons in order; their labels follow the app's language.
const controls = { read: 0, removePointer: 1, toggleSurface: 4 }
const press = (control: keyof typeof controls) => {
  const button = views(find('afterglow-debug')).filter((view) => view instanceof Button)[
    controls[control]
  ]
  if (!button) throw new Error(`Missing ${control} button`)
  button.notify({ eventName: 'tap', object: button })
}
function record(name: string, value: unknown, valid: boolean) {
  samples.push({ name, value })
  if (!valid) failures.push(name)
  save()
}
type Pointer = {
  available: boolean
  execution: string
  active: boolean
  presence: number
  x: number
  y: number
} | null
async function pointer(): Promise<Pointer> {
  press('read')
  await delay(150)
  return JSON.parse((find('afterglow-pointer') as Label).text)
}

// A mouse event at a fraction of the region, sent the way the window receives input.
declare const android: any
function mouse(action: 'enter' | 'move' | 'exit' | 'touch', fx: number, fy: number) {
  const region = find('afterglow-region')!
  const native = region.nativeViewProtected
  // The Android runtime adds Array.create for Java arrays.
  const origin = (Array as unknown as { create(type: string, size: number): number[] }).create(
    'int',
    2,
  )
  native.getLocationInWindow(origin)
  const x = origin[0] + native.getWidth() * fx,
    y = origin[1] + native.getHeight() * fy
  const { MotionEvent, InputDevice } = android.view
  const now = android.os.SystemClock.uptimeMillis()
  const activity = Application.android.foregroundActivity
  // A pointer event with its tool type, as the system builds it for a mouse or a finger.
  const create = (Array as unknown as { create(type: unknown, size: number): unknown[] }).create
  const send = (code: number, source: number, tool: number, generic: boolean) => {
    const properties = new MotionEvent.PointerProperties()
    properties.id = 0
    properties.toolType = tool
    const coords = new MotionEvent.PointerCoords()
    coords.x = x
    coords.y = y
    coords.pressure = generic ? 0 : 1
    coords.size = 1
    const allProperties = create(MotionEvent.PointerProperties, 1)
    allProperties[0] = properties
    const allCoords = create(MotionEvent.PointerCoords, 1)
    allCoords[0] = coords
    const event = MotionEvent.obtain(
      now,
      now,
      code,
      1,
      allProperties,
      allCoords,
      0,
      0,
      1,
      1,
      0,
      0,
      source,
      0,
    )
    const callback = activity.getWindow().getCallback()
    if (generic) callback.dispatchGenericMotionEvent(event)
    else callback.dispatchTouchEvent(event)
    event.recycle()
  }
  if (action === 'touch') {
    send(
      MotionEvent.ACTION_DOWN,
      InputDevice.SOURCE_TOUCHSCREEN,
      MotionEvent.TOOL_TYPE_FINGER,
      false,
    )
    send(MotionEvent.ACTION_UP, InputDevice.SOURCE_TOUCHSCREEN, MotionEvent.TOOL_TYPE_FINGER, false)
  } else
    send(
      {
        enter: MotionEvent.ACTION_HOVER_ENTER,
        move: MotionEvent.ACTION_HOVER_MOVE,
        exit: MotionEvent.ACTION_HOVER_EXIT,
      }[action],
      InputDevice.SOURCE_MOUSE,
      MotionEvent.TOOL_TYPE_MOUSE,
      true,
    )
}

async function run() {
  save()
  for (let n = 0; n < 150 && !find('afterglow-pointer'); n++) await delay(100)
  await delay(1200)
  const initial = await pointer()
  if (isIOS) {
    // An iPhone has no hover: the recipe keeps its resting values and nothing listens.
    record(
      'ios-rest',
      initial,
      initial !== null &&
        initial.active === false &&
        initial.presence === 0 &&
        initial.x === 0 &&
        initial.execution === (initial.available ? 'hover' : 'static'),
    )
  } else {
    record(
      'android-available',
      initial,
      initial?.available === true && initial.execution === 'hover' && initial.presence === 0,
    )
    mouse('enter', 0.8, 0.5)
    mouse('move', 0.8, 0.5)
    await delay(900)
    const inside = await pointer()
    record(
      'android-hover-inside',
      inside,
      inside?.active === true && inside.presence === 1 && inside.x > 2 && inside.x <= 12,
    )
    mouse('exit', 0.8, 0.5)
    await delay(900)
    const outside = await pointer()
    record(
      'android-hover-exit',
      outside,
      outside?.active === false && outside.presence === 0 && Math.abs(outside.x) < 0.5,
    )
    // Ordinary touch is not hover.
    mouse('touch', 0.02, 0.02)
    await delay(400)
    const touched = await pointer()
    record(
      'android-touch-is-not-hover',
      touched,
      touched?.active === false && touched.presence === 0,
    )
  }
  // Replacing the card releases the input with it; the new card gets its own, once.
  press('toggleSurface')
  await delay(600)
  record('surface-removed', await pointer(), (await pointer()) === null)
  press('toggleSurface')
  await delay(1200)
  const resumed = await pointer()
  record('surface-restored', resumed, resumed !== null && resumed.presence === 0)
  if (!isIOS) {
    mouse('enter', 0.2, 0.5)
    mouse('move', 0.2, 0.5)
    await delay(900)
    const again = await pointer()
    record('android-hover-after-restore', again, again?.presence === 1 && again.x < -2)
    mouse('exit', 0.2, 0.5)
    await delay(600)
  }
  press('removePointer')
  await delay(300)
  const removed = await pointer()
  record('owner-removed', removed, removed === null)
  if (!isIOS) {
    mouse('enter', 0.8, 0.5)
    await delay(300)
    record('android-hover-after-removal', await pointer(), (await pointer()) === null)
  }
  save(true)
}
setTimeout(() => void run().catch((error) => (recordError(error), save(true))), 1500)
