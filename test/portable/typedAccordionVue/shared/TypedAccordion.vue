<script setup lang="ts">
import { computed, ref } from 'vue'
import type { AccordionItem, ChoiceValue } from '#mavis'
const opened = ref<ChoiceValue[]>([])
const items: AccordionItem[] = [
  { value: 1, title: 'Number header' },
  { value: '1', title: 'Text header' },
  { value: 0, title: 'Zero header' },
]
const summary = computed(
  () =>
    `${opened.value.length}: ${opened.value.includes(1) ? 'N' : '-'}${opened.value.includes('1') ? 'S' : '-'}${opened.value.includes(0) ? 'Z' : '-'}`,
)
</script>
<template>
  <MColumn gap="md"
    ><MAccordion label="Typed panels" :items="items" v-model="opened" multiple
      ><template #default="{ item }"
        ><MText>{{
          item.value === 1 ? 'Number body' : item.value === '1' ? 'Text body' : 'Zero body'
        }}</MText></template
      ></MAccordion
    ><MText>{{ summary }}</MText></MColumn
  >
</template>
