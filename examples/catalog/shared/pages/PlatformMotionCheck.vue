<script setup lang="ts">
import { markRaw, ref, onBeforeUnmount } from 'vue'
import { useMavisListMotion, useMavisPlatform } from '@getcortexlabs/mavis-core/vue'
import {
  createMotionRegion,
  createMotionScrollSource,
  createMotionSurface,
  whenMotionAvailable,
  type MotionLayoutOptions,
  type MotionPlayback,
} from '@getcortexlabs/mavis-core/experimental'
withDefaults(defineProps<{ detail?: boolean; base?: string }>(), { base: '/checks/portable' })
const platform = useMavisPlatform()
const list = useMavisListMotion({ size: false, transition: { duration: 220 } })
const all = [1, 2, 3, 4].map((id) => ({ id, draft: `Item ${id}` }))
const items = ref(all)
const status = ref('idle')
function reorder() {
  status.value = 'moving'
  void list
    .update(() => {
      items.value = [...items.value].reverse()
    })
    .finished.then((complete) => {
      status.value = complete ? 'complete' : 'cancelled'
    })
}
function filter() {
  list.update(() => {
    items.value = items.value.length === 4 ? all.filter((item) => item.id !== 2) : [...all]
  })
}
// Form controls intentionally cannot become static DOM copies. This second collection uses
// plain cards so the same data mutation can demonstrate exits on Web and NativeScript.
const exitOptions: MotionLayoutOptions = {
  size: 'scale',
  enter: true,
  exit: { opacity: 0, y: 16, scale: 0.96 },
  maxSnapshotPixels: 8_000_000,
  transition: { duration: 800 },
}
const exits = useMavisListMotion(exitOptions)
const exitCards = [1, 2, 3, 4, 5].map((id) => ({ id, title: `Idea ${id}` }))
const leavingRows = ref(exitCards.slice(0, 4))
const exitHeight = ref(80)
const exitStatus = ref('idle')
const showExitList = ref(true)
const tinyExitBudget = ref(false)
let exitOperation: MotionPlayback | undefined
let exitGeneration = 0
function mutateExits(change: () => void) {
  const generation = ++exitGeneration
  exitStatus.value = 'moving'
  exitOperation = exits.update(change)
  void exitOperation.finished.then(
    (complete) => {
      if (generation === exitGeneration) exitStatus.value = complete ? 'complete' : 'cancelled'
    },
    () => {
      if (generation === exitGeneration) exitStatus.value = 'error'
    },
  )
}
function mixExits() {
  mutateExits(() => {
    leavingRows.value = [exitCards[4]!, exitCards[3]!, exitCards[2]!, exitCards[0]!]
    exitHeight.value = exitHeight.value === 80 ? 112 : 80
  })
}
function restoreExits() {
  mutateExits(() => {
    leavingRows.value = exitCards.slice(0, 4)
  })
}
function removeExit() {
  mutateExits(() => {
    leavingRows.value = leavingRows.value.slice(1)
  })
}
function changeExitBudget() {
  tinyExitBudget.value = !tinyExitBudget.value
  exitOptions.maxSnapshotPixels = tinyExitBudget.value ? 1 : 8_000_000
}
const scroll = markRaw(createMotionScrollSource())
const section = markRaw(createMotionRegion())
const artwork = markRaw(createMotionSurface())
const height = ref(650)
const stop = whenMotionAvailable([scroll, section, artwork], () => {
  const link = artwork.scrollSection(scroll, section, { y: [0, -60], opacity: [0.3, 1] })
  return () => link.dispose()
})
onBeforeUnmount(stop)
</script>
<template>
  <MScreen scroll :motionScroll="scroll">
    <MColumn gap="lg" padding="lg">
      <MText as="h1" id="portable-heading">{{
        detail ? 'Shared detail' : 'Shared platform checks'
      }}</MText>
      <MText id="portable-platform">{{ platform.platform }}</MText>
      <MPlatform only="web"><MText id="portable-web">Web content</MText></MPlatform>
      <MPlatform only="native"><MText id="portable-native">Native content</MText></MPlatform>
      <MPlatform :only="['ios', 'android']">
        <MText>App content</MText>
        <template #fallback><MText id="portable-fallback">Browser fallback</MText></template>
      </MPlatform>
      <MRow gap="md">
        <MButton
          v-if="!detail"
          id="portable-details"
          :href="`${base}/detail`"
          text="Open shared detail"
        />
        <MButton v-else :href="base" text="Return to shared checks" />
        <MButton :href="`${base}/blocked`" text="Try blocked route" />
      </MRow>
      <MRow gap="md"
        ><MButton text="Reverse list" @click="reorder" /><MButton
          text="Filter list"
          @click="filter"
      /></MRow>
      <MText id="portable-list-status">{{ status }}</MText>
      <MColumn id="portable-list" :motionRegion="list.region" gap="md">
        <MCard v-for="item in items" :key="item.id" :id="`portable-row-${item.id}`">
          <MInput v-model="item.draft" :label="`Draft ${item.id}`" />
        </MCard>
      </MColumn>
      <MText variant="heading">Keyed card exits</MText>
      <MText tone="muted">Insert, remove, reorder and resize with one shared mutation.</MText>
      <MRow gap="sm" wrap>
        <MButton id="exit-mix" text="Mix exit cards" @click="mixExits" />
        <MButton id="exit-remove" text="Remove first exit card" @click="removeExit" />
        <MButton id="exit-restore" text="Restore exit cards" @click="restoreExits" />
        <MButton id="exit-stop" text="Stop list motion" @click="exitOperation?.stop()" />
        <MButton
          id="exit-budget"
          :text="tinyExitBudget ? 'Use normal exit budget' : 'Use tiny exit budget'"
          @click="changeExitBudget"
        />
        <MButton
          id="exit-toggle"
          :text="showExitList ? 'Hide exit list' : 'Show exit list'"
          @click="showExitList = !showExitList"
        />
      </MRow>
      <MText id="exit-status">{{ exitStatus }}</MText>
      <MColumn v-if="showExitList" id="exit-list" :motionRegion="exits.region" gap="sm">
        <MCard
          v-for="item in leavingRows"
          :key="item.id"
          :id="`exit-card-${item.id}`"
          :height="exitHeight"
          padding="md"
        >
          <MText>{{ item.title }}</MText>
        </MCard>
      </MColumn>
      <MBox :height="300" />
      <MBox id="portable-section" :height="height" :motionRegion="section">
        <MColumn gap="md">
          <MButton text="Grow section" @click="height = height === 650 ? 950 : 650" />
          <MCard id="portable-artwork" :motionSurface="artwork"
            ><MText>Section-linked artwork</MText></MCard
          >
        </MColumn>
      </MBox>
      <MBox :height="700" />
    </MColumn>
  </MScreen>
</template>
