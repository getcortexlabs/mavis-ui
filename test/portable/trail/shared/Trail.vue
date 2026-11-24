<script setup lang="ts">
import { reactive } from 'vue'
import type { Stage, TimelineItem } from './types'

const state = reactive({
  events: [
    {
      key: 'order',
      title: 'Order placed',
      time: '09:12',
      description: 'Paid by card',
      icon: 'shopping-bag',
      status: undefined,
    },
    {
      key: 'pack',
      title: 'Packed',
      status: 'current',
      description: undefined,
      time: undefined,
      icon: undefined,
    },
    {
      key: 'ship',
      title: 'Shipped',
      status: 'upcoming',
      description: undefined,
      time: undefined,
      icon: undefined,
    },
  ] as TimelineItem[],
  stages: [
    { key: 'draft', title: 'Draft', status: 'complete' },
    { key: 'review', title: 'Review', status: 'current' },
  ] as Stage[],
  none: [] as Stage[],
  advance(): void {
    state.events.splice(1, 2, {
      key: 'pack',
      title: 'Packed',
      description: undefined,
      time: undefined,
      status: undefined,
      icon: undefined,
    })
    state.events.push({
      key: 'ship',
      title: 'Shipped',
      status: 'current',
      description: undefined,
      time: undefined,
      icon: undefined,
    })
  },
  delay(): void {
    state.events.splice(2, 1, {
      key: 'ship',
      title: 'Shipped',
      status: 'error',
      description: undefined,
      time: undefined,
      icon: undefined,
    })
    state.events.push({
      key: 'done',
      title: 'Delivered',
      status: 'upcoming',
      description: undefined,
      time: undefined,
      icon: undefined,
    })
  },
})
</script>

<template>
  <MColumn gap="lg">
    <MTimeline id="trail" label="Order activity" :items="state.events">
      <template #default="{ item }">
        <MColumn :id="`note-${item.key}`">
          <template v-if="item.key === 'order'">
            <MText variant="caption">Receipt sent</MText>
          </template>
        </MColumn>
      </template>
    </MTimeline>
    <MRow gap="sm">
      <MButton text="Advance" @click="() => state.advance()" />
      <MButton text="Delay" variant="secondary" @click="() => state.delay()" />
      <MButton text="Clear" variant="ghost" @click="() => (state.events = [])" />
    </MRow>
    <MTimeline
      label="Stages"
      :items="state.stages"
      :statusLabels="{ complete: 'Feito', current: 'Agora', upcoming: 'Depois', error: 'Erro' }"
    >
      <template #default="{ item, index }">
        <MText tone="muted">{{ `${index + 1}. ${item.title}` }}</MText>
      </template>
    </MTimeline>
    <MTimeline label="Later" :items="state.none" emptyLabel="Nothing planned" />
  </MColumn>
</template>
