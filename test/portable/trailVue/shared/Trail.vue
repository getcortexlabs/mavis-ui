<script setup lang="ts">
import { ref } from 'vue'
import type { TimelineItem } from '#mavis'
import type { Stage } from './types'

const events = ref<TimelineItem[]>([
  {
    key: 'order',
    title: 'Order placed',
    time: '09:12',
    description: 'Paid by card',
    icon: 'shopping-bag',
  },
  { key: 'pack', title: 'Packed', status: 'current' },
  { key: 'ship', title: 'Shipped', status: 'upcoming' },
])
const stages = ref<Stage[]>([
  { key: 'draft', title: 'Draft', status: 'complete' },
  { key: 'review', title: 'Review', status: 'current' },
])
const none = ref<Stage[]>([])

function advance() {
  events.value.splice(1, 2, { key: 'pack', title: 'Packed' })
  events.value.push({ key: 'ship', title: 'Shipped', status: 'current' })
}

function delay() {
  events.value.splice(2, 1, { key: 'ship', title: 'Shipped', status: 'error' })
  events.value.push({ key: 'done', title: 'Delivered', status: 'upcoming' })
}
</script>

<template>
  <MColumn gap="lg">
    <MTimeline id="trail" label="Order activity" :items="events">
      <template #default="{ item }">
        <MColumn :id="`note-${item.key}`">
          <MText v-if="item.key === 'order'" variant="caption">Receipt sent</MText>
        </MColumn>
      </template>
    </MTimeline>
    <MRow gap="sm">
      <MButton text="Advance" @click="advance" />
      <MButton text="Delay" variant="secondary" @click="delay" />
      <MButton text="Clear" variant="ghost" @click="events = []" />
    </MRow>
    <m-timeline
      v-slot="{ item, index }"
      label="Stages"
      :items="stages"
      :status-labels="{ complete: 'Feito', current: 'Agora', upcoming: 'Depois', error: 'Erro' }"
    >
      <MText tone="muted">{{ index + 1 }}. {{ item.title }}</MText>
    </m-timeline>
    <MTimeline label="Later" :items="none" empty-label="Nothing planned" />
  </MColumn>
</template>
