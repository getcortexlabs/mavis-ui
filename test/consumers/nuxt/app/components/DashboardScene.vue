<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { KanbanCard } from '@getcortexlabs/mavis-core'
const ready = ref(false),
  selected = ref<string | null>(null),
  trigger = ref(0),
  draft = ref('Retained draft')
const cards = ref<KanbanCard[]>([{ id: 'a', column: 'todo', title: 'A shared project' }])
onMounted(() => {
  ready.value = true
})
</script>
<template>
  <MColumn padding="lg" gap="lg">
    <MText id="dashboard-ready" :text="ready ? 'ready' : 'pending'" />
    <MKanban
      v-model="cards"
      label="Studio"
      :columns="[
        { id: 'todo', title: 'Ideas' },
        { id: 'done', title: 'Published' },
      ]"
    />
    <MDonutChart
      v-model="selected"
      label="Discipline"
      :segments="[
        { id: 'a', label: 'Design', value: 75 },
        { id: 'b', label: 'Research', value: 25 },
      ]"
    />
    <MSparkline
      label="Activity"
      :points="[
        { id: 'a', label: 'Monday', value: 10 },
        { id: 'b', label: 'Tuesday', value: null },
        { id: 'c', label: 'Wednesday', value: 20 },
      ]"
    />
    <MGradientBackground :height="100"
      ><MInput v-model="draft" label="A retained editor"
    /></MGradientBackground>
    <MParticleField :height="100"><MText text="A retained particle slot" /></MParticleField>
    <MConfetti :trigger="trigger"><MButton text="Celebrate" @click="trigger++" /></MConfetti>
    <MText id="dashboard-state" :text="`${cards[0]?.column}|${selected}|${trigger}|${draft}`" />
  </MColumn>
</template>
