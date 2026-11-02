<script setup lang="ts">
import { markRaw, ref } from 'vue'
import {
  createMotionRegion,
  createMotionSurface,
  type MotionTimeline,
} from '@getcortexlabs/mavis-core/experimental'
import { useMavisWebMotion } from '@getcortexlabs/mavis-web/experimental'
import { MBox, MButton, MColumn, MText } from '@getcortexlabs/mavis-web'
import type { WebPathDrawing } from '@rafaelaugusto/jolt/web'
const region = markRaw(createMotionRegion())
const surface = markRaw(createMotionSurface())
const ready = ref(false),
  checkpoints = ref(0)
let drawing: WebPathDrawing | undefined
let group: MotionTimeline | undefined
useMavisWebMotion(region, (scope, element) => {
  drawing = scope.drawPath(element.querySelector('path')!, { progress: 1 })
  ready.value = true
  return () => {
    drawing = undefined
    ready.value = false
  }
})
function start() {
  group?.stop()
  group = region.timeline([
    [surface, { x: [0, 30, 0] }, { duration: 1600 }],
    {
      at: 1000,
      run: () => {
        checkpoints.value++
        return surface.animate({ scale: [1, 1.1, 1] }, { duration: 400 })
      },
    },
  ])
}
</script>
<template>
  <MBox :motionRegion="region">
    <MColumn gap="md">
      <svg width="240" height="80" role="img" aria-label="Server rendered connection">
        <path
          id="nuxt-motion-path"
          d="M10 40 C60 0 180 80 230 40"
          pathLength="100"
          stroke="#4262C4"
          stroke-width="3"
          fill="none"
        />
      </svg>
      <MButton id="nuxt-orchestration-target" :motionSurface="surface"
        >A shared motion surface</MButton
      >
      <MButton :disabled="!ready" @click="start">Start orchestration</MButton>
      <MButton :disabled="!ready" @click="group?.pause()">Pause orchestration</MButton>
      <MButton :disabled="!ready" @click="group?.resume()">Resume orchestration</MButton>
      <MButton :disabled="!ready" @click="drawing?.animate(0, { duration: 500 })"
        >Reverse connection</MButton
      >
      <MText id="nuxt-motion-checkpoints">{{ checkpoints }} checkpoints</MText>
    </MColumn>
  </MBox>
</template>
