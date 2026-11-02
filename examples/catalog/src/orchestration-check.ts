import {
  Frame,
  GestureTypes,
  Utils,
  isIOS,
  type View,
  type TouchGestureEventData,
} from '@nativescript/core'
import { router } from './router'

/** Opt-in probe: actual native presentation, with synthetic component/gesture events. */
export async function checkOrchestration(
  record: (name: string, value: unknown, pass?: boolean) => void,
) {
  const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
  const find = (id: string) => Frame.topmost().currentPage.getViewById<View>(id)
  const tap = (id: string) => {
    const view = find(id)
    view.notify({ eventName: 'tap', object: view })
  }
  await router.push('/showcase/tempo')
  for (let i = 0; i < 50 && !find('tempo-card'); i++) await wait(100)
  await wait(400)
  const sample = () => {
    const native = find('tempo-card').nativeViewProtected
    if (isIOS) {
      const layer = native.layer.presentationLayer() ?? native.layer
      return {
        x: Number(layer.valueForKeyPath('transform.translation.x')),
        y: Number(layer.valueForKeyPath('transform.translation.y')),
        scale: Number(layer.valueForKeyPath('transform.scale.x')),
        opacity: Number(layer.opacity),
      }
    }
    return {
      x: Utils.layout.toDeviceIndependentPixels(native.getTranslationX()),
      y: Utils.layout.toDeviceIndependentPixels(native.getTranslationY()),
      scale: Number(native.getScaleX()),
      opacity: Number(native.getAlpha()),
    }
  }
  const near = (
    name: string,
    key: keyof ReturnType<typeof sample>,
    expected: number,
    tolerance = 0.03,
  ) => {
    const value = sample()[key]
    record(
      name,
      { value, expected, tolerance },
      Number.isFinite(value) && Math.abs(value - expected) <= tolerance,
    )
  }
  tap('tempo-values')
  await wait(100)
  tap('tempo-pause')
  tap('tempo-seek')
  await wait(150)
  near('scalar progress uses playback clock', 'opacity', 0.775)
  const initial = sample()
  tap('tempo-accent')
  await wait(450)
  near('scalar accent adds to paused base', 'x', initial.x + 9, 0.5)
  tap('tempo-remove-accent')
  await wait(100)
  near('scalar accent releases only its layer', 'x', initial.x, 0.5)
  const touch = (action: string) => {
    const view = find('tempo-card')
    for (const observer of view.getGestureObservers(GestureTypes.touch) ?? [])
      observer.callback.call(observer.context, {
        eventName: 'touch',
        object: view,
        action,
      } as TouchGestureEventData)
  }
  touch('down')
  await wait(350)
  near('press composes with scalar binding', 'scale', initial.scale * 0.97)
  touch('up')
  await wait(600)
  near('release preserves scalar binding', 'scale', initial.scale)
  tap('tempo-resume')
  await wait(1700)
  near('scalar playback completes', 'opacity', 1)
  tap('tempo-timeline')
  await wait(100)
  tap('tempo-pause')
  await wait(1250)
  record(
    'timeline pauses future callback',
    (find('tempo-checkpoints') as View & { text: string }).text,
    (find('tempo-checkpoints') as View & { text: string }).text.startsWith('0 '),
  )
  tap('tempo-resume')
  await wait(1700)
  record(
    'timeline resumes future callback once',
    (find('tempo-checkpoints') as View & { text: string }).text,
    (find('tempo-checkpoints') as View & { text: string }).text.startsWith('1 '),
  )
  tap('tempo-working')
  await wait(60)
  tap('tempo-pause')
  tap('tempo-replace')
  await wait(300)
  const paused = sample()
  await wait(160)
  near('replacement stays paused', 'y', paused.y, 0.5)
  tap('tempo-resume')
  await wait(1000)
  near('replacement joins requested state', 'y', -14, 0.5)
  tap('tempo-success')
  await wait(1000)
  near('replacement settles success', 'scale', 1.07)
  tap('tempo-fling')
  await wait(1800)
  near('decay reaches projected snap', 'x', 40, 0.5)
  tap('tempo-mount')
  await wait(80)
  record('orchestration owner removes card', Boolean(find('tempo-card')), !find('tempo-card'))
  tap('tempo-mount')
  await wait(250)
  record(
    'orchestration owner remounts card',
    Boolean(find('tempo-card')),
    Boolean(find('tempo-card')),
  )
}
