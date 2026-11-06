<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { ChoiceValue } from '@getcortexlabs/mavis-core'
const ready = ref(false)
onMounted(() => {
  ready.value = true
})
const revenue = ref(1234.5)
const items = ref([
  { id: 'a', title: 'Alpha' },
  { id: 'b', title: 'Beta' },
])
const split = ref(40)
const draft = ref('Keep this draft')
const position = ref(50)
const open = ref(false)
const image = ref<ChoiceValue>('one')
const action = ref('')
const photo =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#c17a57"/></svg>',
  )
</script>
<template>
  <MColumn gap="lg" padding="lg">
    <MText id="interactive-ready" :text="ready ? 'ready' : 'pending'" />
    <MNumberFlow
      id="interactive-revenue"
      :value="revenue"
      label="Revenue"
      :format="{ style: 'currency', currency: 'USD' }"
    />
    <MButton text="Add revenue" @click="revenue += 10" />
    <MSortableList v-model="items" label="Queue" :itemLabel="(item) => item.title">
      <template #default="{ item }"><MText :text="item.title" /></template>
    </MSortableList>
    <MSwipeActions
      label="Message"
      :end="[{ value: 'archive', label: 'Archive' }]"
      @action="(item) => (action = String(item.value))"
    >
      <MText text="A message with actions" />
    </MSwipeActions>
    <MResizablePanels v-model="split" label="Workspace" collapsible>
      <template #primary><MText text="Notes" /></template>
      <template #secondary><MInput v-model="draft" label="Draft" /></template>
    </MResizablePanels>
    <MImageCompare v-model="position" :before="photo" :after="photo" label="Comparison" />
    <MImageViewer
      v-model="image"
      v-model:open="open"
      label="Gallery"
      :images="[{ key: 'one', src: photo, alt: 'Terracotta study' }]"
    />
    <MText
      id="interactive-state"
      :text="`${items.map((item) => item.id).join(',')}|${action}|${split}|${position}|${open}`"
    />
  </MColumn>
</template>
