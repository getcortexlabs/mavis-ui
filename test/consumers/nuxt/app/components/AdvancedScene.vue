<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import {
  civilDate,
  type ImageCrop,
  type CropExport,
  type SchedulerEvent,
} from '@getcortexlabs/mavis-core'
const ready = ref(false),
  selected = ref(['fern']),
  expanded = ref<string[]>([]),
  date = ref(civilDate('2026-11-07')),
  heat = ref<ReturnType<typeof civilDate> | null>(null),
  draft = ref('Keep this draft'),
  crop = ref<ImageCrop | null>(null),
  exported = ref<CropExport>(),
  filter = ref<'all' | 'unread'>('all')
const events = ref<SchedulerEvent[]>([
    {
      id: 'meeting',
      title: 'Studio meeting',
      start: Date.parse('2026-11-07T09:00:00Z'),
      end: Date.parse('2026-11-07T10:00:00Z'),
    },
  ]),
  notes = ref([{ id: 'notice', title: 'A shared message', read: false }])
const image =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l1sAAAAASUVORK5CYII='
onMounted(() => (ready.value = true))
onBeforeUnmount(() => {
  void exported.value?.dispose()
})
</script>
<template>
  <MColumn padding="md" gap="lg">
    <MText id="advanced-ready" :text="ready ? 'ready' : 'pending'" />
    <MTreeSelect
      v-model="selected"
      v-model:expanded="expanded"
      label="Discipline"
      :nodes="[
        { id: 'fern', label: 'Fern' },
        { id: 'moss', label: 'Moss' },
      ]"
    />
    <MMasonry label="Collection" :items="[{ id: 'story' }, { id: 'editor' }]"
      ><template #item="{ item }"
        ><MCard
          ><MText v-if="item.id === 'story'" text="A shared story" /><MInput
            v-else
            v-model="draft"
            label="Retained editor" /></MCard></template
    ></MMasonry>
    <MHeatmap
      v-model="heat"
      :start="date"
      :end="date"
      :values="[{ date, value: 0 }]"
      label="Activity"
    />
    <MImageCropper
      v-model="crop"
      :src="image"
      label="Cover"
      :output="{ mimeType: 'image/png', quality: 1, width: 16 }"
      @export="exported = $event"
    />
    <MScheduler v-model="events" :date="date" timeZone="UTC" label="Agenda" :days="1" />
    <MNotificationCenter v-model="notes" v-model:filter="filter" label="Inbox" />
    <MText
      id="advanced-state"
      :text="`${selected.join(',')}|${heat}|${draft}|${notes[0]?.read}|${exported?.width ?? 0}`"
    />
  </MColumn>
</template>
