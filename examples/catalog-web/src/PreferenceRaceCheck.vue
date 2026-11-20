<script setup lang="ts">
import { defineComponent, markRaw, onBeforeUnmount, onMounted, ref } from 'vue'
import { createMotionRegion } from '@getcortexlabs/mavis-core/experimental'
import { useMavisWebMotion } from '@getcortexlabs/mavis-web/experimental'
import {
  createWebRuntime,
  type WebPointerFollow,
  type WebRotationSensor,
} from '@rafaelaugusto/jolt/web'

const region = markRaw(createMotionRegion())
const mounted = ref(false),
  active = ref(true)
const Kept = defineComponent({
  setup:
    (_, { slots }) =>
    () =>
      slots.default?.(),
})
let sensor: WebRotationSensor | undefined, pointer: WebPointerFollow | undefined
let attached = 0,
  released = 0
const publicChanges: boolean[] = []
useMavisWebMotion(region, (scope, element) => {
  attached++
  const input = scope.sensor('rotation')
  const follower = scope.pointerFollow(element, {
    spring: false,
    range: { x: [-40, 40], y: [-40, 40] },
  })
  sensor = input
  pointer = follower
  scope.bind(element.querySelector<HTMLElement>('.race-sensor')!, {
    rotate: input.z.to([-Math.PI, Math.PI], [-180, 180]),
  })
  scope.bind(element.querySelector<HTMLElement>('.race-pointer')!, { x: follower.x, y: follower.y })
  return () => {
    released++
    sensor = undefined
    pointer = undefined
  }
})
let stop: (() => void) | undefined
onMounted(() => {
  // A separate published runtime observes the same media query. This checks the
  // public notification contract independently of Mavis's borrowed scope above.
  const runtime = createWebRuntime(document)
  const off = runtime.onReducedMotion((value) => publicChanges.push(value))
  const host = window as unknown as { __raceRead?: () => unknown }
  host.__raceRead = () => ({
    attached,
    released,
    publicChanges: [...publicChanges],
    sensor: sensor?.snapshot(),
    pointer: pointer && {
      suspended: pointer.suspended,
      available: pointer.available,
      x: pointer.x.get(),
    },
  })
  stop = () => {
    off()
    runtime.dispose()
    delete host.__raceRead
  }
})
onBeforeUnmount(() => stop?.())
</script>
<template>
  <MColumn padding="lg" gap="md">
    <MButton
      id="race-mount"
      :text="mounted ? 'Unmount' : 'Attach resources'"
      @click="mounted = !mounted"
    />
    <MButton
      id="race-active"
      :text="active ? 'Deactivate' : 'Activate'"
      @click="active = !active"
    />
    <KeepAlive v-if="mounted">
      <Kept v-if="active">
        <MBox id="race-region" :motionRegion="region" :height="180">
          <MColumn
            ><MText class="race-sensor">Compass</MText
            ><MText class="race-pointer">Follower</MText></MColumn
          >
        </MBox>
      </Kept>
    </KeepAlive>
  </MColumn>
</template>
