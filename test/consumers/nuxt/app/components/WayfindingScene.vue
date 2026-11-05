<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { ChartSelection, ChoiceValue } from '@getcortexlabs/mavis-core'
const ready = ref(false)
onMounted(() => {
  ready.value = true
})
const open = ref(false)
const command = ref<ChoiceValue>('')
const collapsed = ref(false)
const destination = ref('')
const selection = ref<ChartSelection | null>(null)
const hidden = ref<ChoiceValue[]>([])
</script>
<template>
  <MColumn gap="lg" padding="lg">
    <MText id="wayfinding-ready" :text="ready ? 'ready' : 'pending'" />
    <MButton id="wayfinding-trigger" text="Open commands" @click="open = true" />
    <MCommandPalette
      v-model:open="open"
      label="Commands"
      :items="[{ value: 1, label: 'Invite a teammate', keywords: ['invite'] }]"
      returnFocus="wayfinding-trigger"
      @select="(key) => (command = key)"
    />
    <MNavigationRail
      v-model:collapsed="collapsed"
      label="Workspace"
      :groups="[
        {
          key: 'group',
          label: 'Group',
          items: [
            {
              value: 'a',
              label: 'Home',
              href: '/',
              navigate: (href) => {
                destination = href
              },
            },
          ],
        },
      ]"
    />
    <MBreadcrumb
      :items="[
        {
          key: 'a',
          label: 'Start',
          href: '/',
          navigate: (href) => {
            destination = href
          },
        },
        { key: 'b', label: 'Current' },
      ]"
    />
    <MTooltip triggerLabel="About activity" text="Activity in the last seven days." />
    <MTimeline
      label="Activity"
      :items="[{ key: 'a', title: 'Created', time: 'Yesterday', status: 'complete' }]"
    />
    <MChart
      v-model="selection"
      v-model:hiddenSeries="hidden"
      label="Visits"
      :categories="[
        { key: 'mon', label: 'Monday' },
        { key: 'tue', label: 'Tuesday' },
      ]"
      :series="[{ key: 'sales', label: 'Sales', values: [-3, 5] }]"
      showData
    />
    <MText
      id="wayfinding-state"
      :text="`${command}|${collapsed}|${destination}|${selection?.category ?? ''}|${selection?.series ?? ''}`"
    />
  </MColumn>
</template>
