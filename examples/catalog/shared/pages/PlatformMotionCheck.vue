<script setup lang="ts">
import { markRaw, ref, onBeforeUnmount } from 'vue'
import { useMavisListMotion, useMavisPlatform } from '@getcortexlabs/mavis-core/vue'
import {
  createMotionRegion,
  createMotionScrollSource,
  createMotionSurface,
  whenMotionAvailable,
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
