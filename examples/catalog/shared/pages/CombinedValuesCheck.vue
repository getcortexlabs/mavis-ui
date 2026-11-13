<script setup lang="ts">
import { markRaw, onBeforeUnmount, ref } from 'vue'
import {
  createMotionSurface,
  type MotionReadable,
  type MotionSpring,
  type MotionValue,
} from '@getcortexlabs/mavis-core/experimental'

const surface = markRaw(createMotionSurface())
const mounted = ref(true)
const state = ref('{}')
const status = ref('Waiting for the surface')
let generation = 0
let a: MotionValue | undefined, b: MotionValue | undefined
let total: MotionReadable | undefined, follower: MotionSpring | undefined
let speed: MotionReadable | undefined, scale: MotionValue | undefined
let previous: MotionReadable | undefined
let staleRejected = false
const read = () => {
  const number = (value?: MotionReadable) =>
    !value || value.disposed ? null : Number(value.get().toFixed(3))
  state.value = JSON.stringify({
    generation,
    a: number(a),
    b: number(b),
    total: number(total),
    position: number(follower),
    speed: number(speed),
    scale: number(scale),
    paused: follower && !follower.disposed ? follower.paused : false,
    moving: follower && !follower.disposed ? follower.moving : false,
    totalDisposed: total?.disposed ?? true,
    inputDisposed: a?.disposed ?? true,
    followerDisposed: follower?.disposed ?? true,
    staleRejected,
  })
}
const remove = surface.onAvailable(() => {
  generation++
  a = surface.motionValue(20)
  b = surface.motionValue(20)
  total = a.add(b).mul(0.5).clamp(-80, 80)
  follower = surface.springValue(total, { stiffness: 180, damping: 24, initial: 0 })
  speed = follower.velocity()
  scale = surface.motionValue(1)
  surface.bind({ x: follower })
  surface.bind({ scale })
  status.value = 'Two sources. One native graph.'
  read()
  return () => {
    previous = total
  }
})
const changeA = () => {
  if (a && !a.disposed) a.set(a.get() + 20)
  read()
}
const changeB = () => {
  if (b && !b.disposed) b.set(b.get() - 10)
  read()
}
const retarget = () => {
  if (a && !a.disposed) a.set(120)
  if (b && !b.disposed) b.set(-40)
  status.value = 'Retargeted to 40'
  read()
}
const pause = () => {
  if (follower && !follower.disposed) follower.pause()
  read()
}
const resume = () => {
  if (follower && !follower.disposed) follower.resume()
  read()
}
const disposeGraph = () => {
  total?.dispose()
  status.value = 'Graph released; both inputs and scale stay alive'
  read()
}
const disposeInput = () => {
  a?.dispose()
  status.value = 'Input released; its derived graph is invalidated'
  read()
}
const changeScale = () => {
  if (scale && !scale.disposed) scale.set(scale.get() === 1 ? 1.08 : 1)
  read()
}
const toggle = () => {
  mounted.value = !mounted.value
  status.value = mounted.value ? 'Mounting a fresh presentation' : 'Presentation removed'
}
const checkStale = () => {
  staleRejected = false
  try {
    previous?.get()
  } catch {
    staleRejected = true
  }
  read()
}
onBeforeUnmount(remove)
</script>

<template>
  <MScreen scroll>
    <MColumn padding="lg" gap="md">
      <MText variant="overline" tone="primary">JOLT RC.15 · COMBINED VALUES</MText>
      <MText variant="heading">A shared equation. A living surface.</MText>
      <MText tone="muted">clamp((A + B) × 0.5, −80, 80) → spring → horizontal position</MText>
      <MColumn :height="180" justify="center" align="center" backgroundColor="#182326" radius="lg">
        <MCard
          v-if="mounted"
          id="combined-surface"
          :motionSurface="surface"
          :width="180"
          :height="120"
          backgroundColor="#d9f46b"
          gap="xs"
        >
          <MColumn :grow="1" justify="center" align="center" gap="xs">
            <MText variant="title" :style="{ color: '#182326' }">Signal / 02</MText>
            <MText :style="{ color: '#182326' }">Web · iOS · Android</MText>
          </MColumn>
        </MCard>
        <MText v-else tone="muted">Surface removed</MText>
      </MColumn>
      <MText id="combined-status" :text="status" />
      <MRow gap="sm" wrap>
        <MButton id="combined-a" text="A + 20" @click="changeA" />
        <MButton id="combined-b" text="B − 10" @click="changeB" />
        <MButton id="combined-retarget" text="Retarget to 40" @click="retarget" />
        <MButton id="combined-read" text="Read values" variant="secondary" @click="read" />
      </MRow>
      <MRow gap="sm" wrap>
        <MButton id="combined-pause" text="Pause" variant="secondary" @click="pause" />
        <MButton id="combined-resume" text="Resume" variant="secondary" @click="resume" />
        <MButton id="combined-scale" text="Toggle scale" variant="secondary" @click="changeScale" />
      </MRow>
      <MRow gap="sm" wrap>
        <MButton
          id="combined-dispose-graph"
          text="Dispose graph"
          variant="ghost"
          @click="disposeGraph"
        />
        <MButton
          id="combined-dispose-input"
          text="Dispose input"
          variant="ghost"
          @click="disposeInput"
        />
        <MButton
          id="combined-toggle"
          :text="mounted ? 'Unmount' : 'Mount'"
          variant="ghost"
          @click="toggle"
        />
        <MButton id="combined-stale" text="Check old handle" variant="ghost" @click="checkStale" />
      </MRow>
      <MText id="combined-state" :text="state" variant="caption" />
    </MColumn>
  </MScreen>
</template>
