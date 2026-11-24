<script setup lang="ts">
import { reactive } from 'vue'
import type { Notice } from './types'

const state = reactive({
  items: [
    {
      id: 'build',
      title: 'Build ready',
      group: 'Studio',
      actionLabel: 'Open build',
      stamp: 7,
      read: undefined,
      disabled: undefined,
      dismissible: undefined,
    },
    {
      id: 'lock',
      title: 'Protected note',
      group: 'Studio',
      disabled: true,
      stamp: 9,
      read: undefined,
      dismissible: undefined,
      actionLabel: undefined,
    },
    {
      id: 'done',
      title: 'Already read',
      read: true,
      dismissible: false,
      stamp: 11,
      group: undefined,
      disabled: undefined,
      actionLabel: undefined,
    },
  ] as Notice[],
  filter: 'all' as string,
  action: 'none' as string,
})
</script>

<template>
  <MColumn gap="md">
    <MNotificationCenter
      label="Inbox"
      :modelValue="state.items"
      @update:modelValue="(items) => (state.items = items)"
      :filter="state.filter"
      @update:filter="(filter) => (state.filter = filter)"
      @action="(id) => (state.action = id)"
    />
    <MText>{{ `Action: ${state.action}` }}</MText>
    <MText>{{ `Metadata: ${state.items.map((item) => String(item.stamp)).join(',')}` }}</MText>
  </MColumn>
</template>
