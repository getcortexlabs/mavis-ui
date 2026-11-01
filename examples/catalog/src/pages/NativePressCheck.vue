<script setup lang="ts">
import { onMounted, onBeforeUnmount, nextTick, ref } from 'nativescript-vue'
import {
  GestureTypes,
  isIOS,
  knownFolders,
  type EventData,
  type TouchGestureEventData,
  type View,
} from '@nativescript/core'
import { animate, set, stop, configure } from '@rafaelaugusto/jolt'
import { mavis } from '@getcortexlabs/mavis-core'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { attachPressFeedback } from '../../../../packages/nativescript/src/native/press'

// This page is included only by --env.pressCheck. It measures real native playback.
const disabled = ref(false)
const status = ref('Running native press checks…')
const { setTheme } = useMavisTheme()
let raw: View
let button: View
let remove: (() => void) | undefined
let disposed = false
const samples: { name: string; model: number[]; presentation: number[]; expected: number[] }[] = []
const failures: string[] = []
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
const touch = (view: View, action: string) => {
  // NativeScript routes gestures through observers, not Observable.notify().
  const observers = [...(view.getGestureObservers(GestureTypes.touch) ?? [])]
  if (!observers.length) throw new Error(`No touch observers for ${view.typeName}`)
  for (const observer of observers)
    observer.callback.call(observer.context, {
      eventName: 'touch',
      object: view,
      action,
    } as TouchGestureEventData)
}
const loaded = (event: EventData) => {
  raw = event.object as View
}
const buttonLoaded = (event: EventData) => {
  button = event.object as View
}
function presentation(view: View): number[] {
  const native = view.nativeViewProtected
  if (!isIOS) return [native.getScaleX(), native.getScaleY()]
  const layer = native.layer.presentationLayer() ?? native.layer
  return [
    Number(layer.valueForKeyPath('transform.scale.x')),
    Number(layer.valueForKeyPath('transform.scale.y')),
  ]
}
function check(name: string, view: View, x: number, y = x) {
  if (disposed) throw new Error('Check page disposed during playback')
  const sample = {
    name,
    model: [view.scaleX, view.scaleY],
    presentation: presentation(view),
    expected: [x, y],
  }
  samples.push(sample)
  for (const kind of ['model', 'presentation'] as const) {
    sample[kind].forEach((value, index) => {
      if (!Number.isFinite(value) || Math.abs(value - sample.expected[index]!) > 0.015)
        failures.push(`${name} ${kind}[${index}]: ${value}, expected ${sample.expected[index]}`)
    })
  }
}
function continuity(name: string, before: number[], after: number[]) {
  if (
    after.some(
      (value, index) => !Number.isFinite(value) || Math.abs(value - before[index]!) > 0.025,
    )
  )
    failures.push(`${name}: visible jump ${before} → ${after}`)
}
onBeforeUnmount(() => {
  disposed = true
  remove?.()
  if (raw) stop(raw)
  if (button) stop(button)
})
onMounted(async () => {
  await wait(600)
  try {
    remove = attachPressFeedback(raw, 0.96)
    raw.scaleX = 1.2
    raw.scaleY = 0.8
    remove()
    await wait(60)
    check('idle assignment survives removal', raw, 1.2, 0.8)

    set(raw, { scaleX: 1.1, scaleY: 0.8 })
    remove = attachPressFeedback(raw, 0.96)
    touch(raw, 'down')
    await wait(900)
    check('current non-uniform base multiplied', raw, 1.056, 0.768)
    const before = presentation(raw)
    const retarget = animate(raw, { scaleX: 1.2, scaleY: 0.6 }, { duration: 400, ease: 'linear' })
    continuity('retarget begins continuously', before, presentation(raw))
    await retarget.finished
    await wait(80)
    check('app retarget while held', raw, 1.152, 0.576)
    const pressed = presentation(raw)
    touch(raw, 'up')
    continuity('release begins continuously', pressed, presentation(raw))
    await wait(1400)
    check('release keeps current app base', raw, 1.2, 0.6)
    raw.scaleX = 1.3
    raw.scaleY = 0.7
    remove()
    await wait(60)
    check('settled assignment survives removal', raw, 1.3, 0.7)

    remove = attachPressFeedback(raw, 0.96)
    touch(raw, 'down')
    await wait(120)
    const app = animate(raw, { scaleX: 1.4, scaleY: 1.1 }, { duration: 600, ease: 'linear' })
    await wait(120)
    remove()
    if (!(await app.finished)) failures.push('feedback removal cancelled the application animation')
    await wait(80)
    check('app animation survives mid-press removal', raw, 1.4, 1.1)

    remove = attachPressFeedback(raw, 0.96)
    touch(raw, 'down')
    await wait(900)
    const oldRemove = remove
    remove()
    remove = attachPressFeedback(raw, 0.9)
    touch(raw, 'down')
    await wait(900)
    oldRemove()
    check('stale cleanup preserves new feedback', raw, 1.26, 0.99)
    touch(raw, 'cancel')
    await wait(1400)
    check('cancel restores base', raw, 1.4, 1.1)
    remove()

    configure({ reducedMotion: 'always' })
    remove = attachPressFeedback(raw, 0.96)
    touch(raw, 'down')
    set(raw, { scale: 1.2 })
    remove()
    await wait(60)
    check('reduced-motion cleanup', raw, 1.2)
    configure({ reducedMotion: 'user' })

    set(button, { scaleX: 1.1, scaleY: 0.8 })
    disabled.value = true
    await nextTick()
    await wait(60)
    check('button disable without a press', button, 1.1, 0.8)
    disabled.value = false
    await nextTick()
    touch(button, 'down')
    await wait(900)
    set(button, { scaleX: 1.2, scaleY: 0.6 })
    disabled.value = true
    await nextTick()
    await wait(60)
    check('button disable while held', button, 1.2, 0.6)
    disabled.value = false
    await nextTick()
    touch(button, 'down')
    await wait(120)
    touch(button, 'up')
    setTheme({ ...mavis, motion: { ...mavis.motion, pressScale: 0.9 } })
    await nextTick()
    await wait(60)
    check('theme refresh during release', button, 1.2, 0.6)
    touch(button, 'down')
    await wait(900)
    check('replacement theme feedback', button, 1.08, 0.54)
    // Native lifecycle notification, without removing the view needed for presentation reads.
    button.notify({ eventName: 'unloaded', object: button })
    await wait(60)
    check('unload removes held layer', button, 1.2, 0.6)
  } catch (error) {
    failures.push(String(error))
  } finally {
    remove?.()
    configure({ reducedMotion: 'user' })
    status.value = failures.length
      ? `${failures.length} checks failed`
      : `${samples.length} checks passed`
    knownFolders
      .documents()
      .getFile('press-check.json')
      .writeTextSync(JSON.stringify({ done: true, samples, failures }))
    console.log('MAVIS_PRESS ' + JSON.stringify({ samples: samples.length, failures }))
  }
})
</script>

<template>
  <m-screen>
    <m-column padding="xl" gap="xl">
      <m-text variant="heading">Native press composition</m-text>
      <m-text>{{ status }}</m-text>
      <Label
        text="App scale × press"
        height="64"
        backgroundColor="#E8EDFF"
        color="#4262C4"
        textAlignment="center"
        @loaded="loaded"
      />
      <m-button :disabled="disabled" @loaded="buttonLoaded">Component lifecycle</m-button>
      <m-text variant="caption"
        >The check reads both model values and native presentation. Touch events are dispatched by
        the fixture.</m-text
      >
    </m-column>
  </m-screen>
</template>
