<script setup lang="ts">
import { onMounted, onBeforeUnmount, nextTick, ref, markRaw } from 'nativescript-vue'
import {
  Application,
  ScrollView,
  Utils,
  GestureTypes,
  isIOS,
  knownFolders,
  type View,
  type EventData,
  type TouchGestureEventData,
} from '@nativescript/core'
import { configure } from '@rafaelaugusto/jolt'
import {
  createMotionSurface,
  createMotionScrollSource,
} from '@getcortexlabs/mavis-core/experimental'
import { createKineticMotion } from '../../shared/kinetic-motion'
import { createFieldMotion } from '../../shared/field-motion'

// Opt-in probe: synthetic lifecycle/touch input, actual native Jolt presentation.
const surface = markRaw(createMotionSurface())
const source = markRaw(createMotionScrollSource())
const scrolling = ref(true)
const long = ref(true)
const mounted = ref(true)
const status = ref('Checking native continuous motion…')
let view: View
let motion: ReturnType<typeof createKineticMotion>
let setups = 0
const failures: string[] = []
const samples: { name: string; actual: number; expected: number; tolerance: number }[] = []
const remove = surface.onAvailable(() => {
  setups++
  motion = createKineticMotion(surface)
})
onBeforeUnmount(remove)
const loaded = (event: EventData) => {
  view = event.object as View
}
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
const scale = () => {
  const native = view.nativeViewProtected
  if (!isIOS) return native.getScaleX() as number
  const layer = native.layer.presentationLayer() ?? native.layer
  return Number(layer.valueForKeyPath('transform.scale.x'))
}
function check(name: string, expected: number, actual = scale(), tolerance = 0.015) {
  samples.push({ name, actual, expected, tolerance })
  if (!Number.isFinite(actual) || Math.abs(actual - expected) > tolerance)
    failures.push(`${name}: ${actual}, expected ${expected} ± ${tolerance}`)
}
function touch(action: string) {
  for (const observer of [...(view.getGestureObservers(GestureTypes.touch) ?? [])])
    observer.callback.call(observer.context, {
      eventName: 'touch',
      object: view,
      action,
    } as TouchGestureEventData)
}
onMounted(async () => {
  await wait(800)
  try {
    check('initial follower', 1)
    touch('down')
    await wait(400)
    check('press multiplies bound follower', 0.97)
    motion.scale.set(1.08)
    await wait(900)
    check('retarget while held', 1.08 * 0.97)
    touch('up')
    await wait(800)
    check('release preserves follower', 1.08)
    motion.follower.pause()
    const held = scale()
    motion.scale.set(0.94)
    await wait(180)
    check('paused follower retains presentation', held)
    motion.follower.resume()
    await wait(900)
    check('resume follows newest input', 0.94)
    motion.scale.set(1.08)
    await wait(80)
    const before = scale()
    motion.scale.set(0.96)
    check('retarget has no position reset', before, scale(), 0.035)
    await wait(900)
    check('retarget settles', 0.96)
    Application.notify({ eventName: Application.suspendEvent, object: Application })
    motion.scale.set(1.08)
    await wait(160)
    check('background retains position', 0.96)
    Application.notify({ eventName: Application.resumeEvent, object: Application })
    await wait(900)
    check('foreground follows latest input', 1.08)
    configure({ reducedMotion: 'always' })
    motion.scale.set(0.94)
    await wait(80)
    check('live reduced motion settles', 0.94)
    configure({ reducedMotion: 'user' })
    motion.scale.dispose()
    check('source disposes follower', 1, Number(motion.follower.disposed), 0)
    const old = motion
    mounted.value = false
    await nextTick()
    await wait(80)
    check('unmount releases surface', 0, Number(surface.available), 0)
    mounted.value = true
    await nextTick()
    await wait(850)
    old.scale.dispose()
    old.follower.dispose()
    old.drag.dispose()
    check('replacement starts fresh', 1)
    check('recipe runs once per presentation', 2, setups, 0)
    motion.scale.set(1.08)
    await wait(80)
    mounted.value = false
    await nextTick()
    await wait(120)
    check('active removal disposes spring', 1, Number(motion.follower.disposed), 0)
    check('active removal disposes drag', 1, Number(motion.drag.disposed), 0)
    check(
      'touch observers released',
      0,
      view.getGestureObservers(GestureTypes.touch)?.length ?? 0,
      0,
    )
    check('pan observers released', 0, view.getGestureObservers(GestureTypes.pan)?.length ?? 0, 0)
    mounted.value = true
    await nextTick()
    await wait(900)
    motion.scale.dispose()
    motion.drag.dispose()
    let ancestor = view.parent
    while (ancestor && !(ancestor instanceof ScrollView)) ancestor = ancestor.parent
    const scroll = ancestor as ScrollView
    if (!scroll) throw new Error('Missing native Screen scroll source')
    let link = createFieldMotion(source, surface)
    const y = () =>
      isIOS
        ? Number(
            (
              view.nativeViewProtected.layer.presentationLayer() ?? view.nativeViewProtected.layer
            ).valueForKeyPath('transform.translation.y'),
          )
        : Utils.layout.toDeviceIndependentPixels(view.nativeViewProtected.getTranslationY())
    const opacity = () =>
      isIOS
        ? Number(
            (view.nativeViewProtected.layer.presentationLayer() ?? view.nativeViewProtected.layer)
              .opacity,
          )
        : Number(view.nativeViewProtected.getAlpha())
    scroll.scrollToVerticalOffset(120, false)
    await wait(200)
    check('scroll maps scale', 0.95)
    check('scroll maps position', 40, y(), 0.8)
    check('scroll maps opacity', 0.675, opacity())
    touch('down')
    await wait(350)
    check('scroll composes held press', 0.95 * 0.97)
    touch('up')
    await wait(700)
    surface.set({ y: 12 })
    scroll.scrollToVerticalOffset(180, false)
    await wait(200)
    check('scroll partial interruption keeps position', 12, y(), 0.8)
    check('scroll partial interruption retains scale', 0.925)
    configure({ reducedMotion: 'always' })
    await wait(80)
    check('scroll live reduced motion spatial endpoint', 0.9)
    scroll.scrollToVerticalOffset(0, false)
    await wait(200)
    check('scroll reduced motion retains opacity input', 1, opacity())
    configure({ reducedMotion: 'user' })
    await wait(80)
    check('scroll preference restores active channels', 1)
    link.dispose()
    link = createFieldMotion(source, surface)
    long.value = false
    await nextTick()
    await wait(300)
    source.refresh()
    check('short content has zero scroll extent', 0, scroll.scrollableHeight, 1)
    check('short content keeps initial pose', 0, y(), 0.8)
    scrolling.value = false
    await nextTick()
    await wait(120)
    check('source unload disposes link', 1, Number(link.disposed), 0)
    check('source unload releases availability', 0, Number(source.available), 0)
  } catch (error) {
    failures.push(String(error))
  } finally {
    Application.notify({ eventName: Application.resumeEvent, object: Application })
    configure({ reducedMotion: 'user' })
    status.value = `${samples.length} samples · ${failures.length} failures`
    knownFolders
      .documents()
      .getFile('continuous-check.json')
      .writeTextSync(JSON.stringify({ done: true, samples, failures }))
    console.log('MAVIS_CONTINUOUS ' + JSON.stringify({ samples: samples.length, failures }))
  }
})
</script>

<template>
  <m-screen :scroll="scrolling" :motionScroll="source">
    <m-column padding="lg" gap="lg">
      <m-text variant="heading">Continuous native motion</m-text>
      <m-text>{{ status }}</m-text>
      <m-card
        v-if="mounted"
        :motionSurface="surface"
        interactive
        accessibilityLabel="Native follower"
        :height="160"
        @loaded="loaded"
      >
        <m-text variant="title">Native follower</m-text>
      </m-card>
      <m-text variant="caption"
        >The fixture dispatches touch and lifecycle input and reads native presentation. Real
        gestures are recorded separately.</m-text
      >
      <m-box v-if="long" :height="1200" />
    </m-column>
  </m-screen>
</template>
