<script setup lang="ts">
import { ref } from 'vue'
import type { Notice } from './types'
const items = ref<Notice[]>([
  { id: 'build', title: 'Build ready', group: 'Studio', actionLabel: 'Open build', stamp: 7 },
  { id: 'lock', title: 'Protected note', group: 'Studio', disabled: true, stamp: 9 },
  { id: 'done', title: 'Already read', read: true, dismissible: false, stamp: 11 },
])
const filter = ref<'all' | 'unread'>('all')
const action = ref('none')
</script>
<template>
  <MColumn gap="md">
    <MNotificationCenter
      label="Inbox"
      v-model="items"
      v-model:filter="filter"
      @action="(id) => (action = id)"
    />
    <MText>Action: {{ action }}</MText>
    <MText>Metadata: {{ items.map((item) => String(item.stamp)).join(',') }}</MText>
  </MColumn>
</template>
