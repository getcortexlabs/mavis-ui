<script setup lang="ts">
import { computed, ref } from 'vue'
import { MCard, MColumn, MPlatform, MReveal, MText, useMavisPlatform } from '#mavis'
import Counter from './Counter.vue'
import type { Entry } from './types'

const { isMacOS, isWeb } = useMavisPlatform()
const entries = ref<Entry[]>([
  { name: 'Ana', total: 0 },
  { name: 'Bo', total: 0 },
])
const total = ref(0)
const last = ref<string | null>(null)
const log = ref('')
const status = computed(() => (last.value === null ? 'Nothing added' : `Last: ${last.value ?? ''}`))

function add(name: string, step: number) {
  entries.value = entries.value.map((entry) =>
    entry.name === name ? { ...entry, total: entry.total + step } : entry,
  )
  total.value += step
  last.value = name
}
function reset() {
  entries.value = entries.value.map((entry) => ({ ...entry, total: 0 }))
  total.value = 0
  last.value = null
  log.value = ''
}
</script>

<template>
  <MColumn gap="md">
    <MText variant="title">{{ status }}</MText>
    <MText v-if="total === 0" tone="muted">Empty board</MText>
    <MText v-else-if="total < 3">Warming up: {{ total }}</MText>
    <MText v-else tone="success">On a roll: {{ total }}</MText>
    <template v-for="(entry, index) in entries" :key="entry.name">
      <Counter
        :name="entry.name"
        :step="index + 1"
        :note="index === 1 ? 'double' : ''"
        :strong="entry.total > 0"
        @add="add"
        @clear="entries.splice(index, 1)"
      />
    </template>
    <Counter name="Guest" @add="(name) => (log = `Guest asked for ${name}`)" />
    <MText v-if="log">{{ log }}</MText>
    <MText v-if="!entries.length" tone="muted">No entries</MText>
    <MPlatform only="macos">
      <MText>Shared screen</MText>
      <template #fallback><MText>Shared screen</MText></template>
    </MPlatform>
    <MText v-if="isMacOS">One file</MText>
    <MText v-else-if="isWeb">One file</MText>
    <MText v-else>One file</MText>
    <MReveal :show="total > 1">
      <MText tone="primary">More than one</MText>
    </MReveal>
    <MCard interactive accessibilityLabel="Reset board" gap="xs" @click="reset">
      <MText>Reset</MText>
    </MCard>
  </MColumn>
</template>
