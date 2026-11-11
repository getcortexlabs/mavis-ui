<script setup lang="ts">
import { computed, defineComponent, markRaw, ref } from 'vue'
import type { ChartSeries } from '@getcortexlabs/mavis-core'
import { createMotionRegion } from '@getcortexlabs/mavis-core/experimental'
import { configureMavisWebMotion } from '@getcortexlabs/mavis-web/experimental'

type Policy = 'user' | 'always' | 'never'
const calm = markRaw(createMotionRegion())
const open = markRaw(createMotionRegion())
const policy = ref<Policy>('user')
configureMavisWebMotion(calm, { reducedMotion: 'always' })
let release = configureMavisWebMotion(open, { reducedMotion: policy.value })
const choose = (next: Policy) => {
  release()
  policy.value = next
  release = configureMavisWebMotion(open, { reducedMotion: next })
}
const mounted = ref(true)
const active = ref(true)
// Kept alive, so hiding it deactivates the regions instead of unmounting them.
const Kept = defineComponent({
  setup:
    (_, { slots }) =>
    () =>
      slots.default?.(),
})
const later = ref(false)
const size = ref(30)
const categories = ['Mon', 'Tue', 'Wed'].map((label, key) => ({ key, label }))
const series = computed<ChartSeries[]>(() => [
  { key: 'visits', label: 'Visits', values: later.value ? [80, 20, 60] : [20, 60, 30] },
])
const items = [
  { id: 'wander', label: 'Wander often.' },
  { id: 'notice', label: 'Notice the details.' },
  { id: 'wonder', label: 'Stay curious.' },
]
const regions = [
  { id: 'calm', title: 'Always reduced', region: calm },
  { id: 'open', title: 'Follows its policy', region: open },
]
</script>

<template>
  <m-screen scroll>
    <m-column padding="lg" gap="lg">
      <m-text as="h1" variant="heading">Reduced motion by region</m-text>
      <m-text id="policy" tone="muted">Second region: {{ policy }}</m-text>
      <m-row gap="sm" wrap>
        <m-button id="week" @click="later = !later">Other week</m-button>
        <m-button id="divider" variant="secondary" @click="size = size === 30 ? 70 : 30"
          >Move divider</m-button
        >
        <m-button variant="ghost" @click="choose('user')">User</m-button>
        <m-button variant="ghost" @click="choose('always')">Always</m-button>
        <m-button variant="ghost" @click="choose('never')">Never</m-button>
        <m-button variant="ghost" @click="mounted = !mounted">{{
          mounted ? 'Unmount' : 'Mount'
        }}</m-button>
        <m-button variant="ghost" @click="active = !active">{{
          active ? 'Deactivate' : 'Activate'
        }}</m-button>
      </m-row>
      <KeepAlive v-if="mounted">
        <Kept v-if="active">
          <m-box
            v-for="entry in regions"
            :id="entry.id"
            :key="entry.id"
            :motionRegion="entry.region"
          >
            <m-column gap="md">
              <m-text variant="heading">{{ entry.title }}</m-text>
              <m-chart
                type="bar"
                :categories="categories"
                :series="series"
                :height="160"
                label="Visits by day"
              />
              <m-resizable-panels v-model="size" label="Notebook layout" :height="120">
                <template #primary><m-text>Notes</m-text></template>
                <template #secondary><m-text>Editor</m-text></template>
              </m-resizable-panels>
              <m-marquee
                :items="items"
                autoplay
                :speed="60"
                label="Small reminders"
                playLabel="Play motion"
                pauseLabel="Pause motion"
              />
            </m-column>
          </m-box>
        </Kept>
      </KeepAlive>
    </m-column>
  </m-screen>
</template>
