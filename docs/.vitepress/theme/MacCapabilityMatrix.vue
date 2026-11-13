<script setup>
import { computed } from 'vue'
import { macosCapabilities } from '@getcortexlabs/mavis-core'
import MacCapability from './MacCapability.vue'
const props = defineProps({ locale: { type: String, default: 'en' } })
const language = computed(() => (props.locale === 'pt' ? 'pt' : 'en'))
const groups = computed(() => {
  const grouped = new Map()
  for (const [name, entry] of Object.entries(macosCapabilities.components)) {
    if (!grouped.has(entry.issue))
      grouped.set(entry.issue, { label: entry.familyLabel, issue: entry.issue, names: [] })
    grouped.get(entry.issue).names.push(name)
  }
  return [...grouped.values()].sort((a, b) => a.issue - b.issue)
})
</script>

<template>
  <ul>
    <li v-for="limit in macosCapabilities.sharedLimits" :key="limit.en">{{ limit[language] }}</li>
  </ul>
  <section v-for="group in groups" :key="group.issue">
    <h2>{{ group.label[language] }} · #{{ group.issue }}</h2>
    <MacCapability v-for="name in group.names" :key="name" :name="name" :locale="locale" />
  </section>
</template>
