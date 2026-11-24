<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  unread: 11 as number,
  urgent: false as boolean,
  get tone(): string {
    return state.urgent ? 'danger' : 'primary'
  },
})
</script>

<template>
  <MColumn id="page" gap="md" :width="320">
    <MRow id="tones" gap="sm">
      <MBadge id="neutral" text="Draft" />
      <MBadge id="primary" text="New" tone="primary" />
      <MBadge id="accent" text="Beta" tone="accent" />
    </MRow>
    <MRow id="states" gap="sm">
      <MBadge id="success" text="Paid" tone="success" />
      <MBadge id="warning" text="Late" tone="warning" />
      <MBadge id="danger" text="Failed" tone="danger" />
    </MRow>
    <MRow id="counts" gap="sm" :height="48">
      <MBadge id="unread" :text="state.unread" :tone="state.tone" />
      <MBadge id="small" :text="11" size="sm" tone="accent" />
      <MBadge id="one" text="1" />
      <MBadge id="named" text="3" size="sm" accessibilityLabel="3 replies" />
    </MRow>
    <MColumn id="narrow" :width="120">
      <MBadge id="long" text="Waiting for review" tone="warning" />
    </MColumn>
    <MRow gap="sm">
      <MButton text="Receive" @click="() => (state.unread += 100)" />
      <MButton text="Escalate" @click="() => (state.urgent = !state.urgent)" />
    </MRow>
  </MColumn>
</template>
