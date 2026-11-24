<script setup lang="ts">
import { reactive } from 'vue'
import type { AccordionItem } from './types'

const state = reactive({
  opened: [] as (string | number)[],
  items: [
    {
      value: 1,
      title: 'Number header',
      description: undefined,
      icon: undefined,
      disabled: undefined,
    },
    {
      value: '1',
      title: 'Text header',
      description: undefined,
      icon: undefined,
      disabled: undefined,
    },
    {
      value: 0,
      title: 'Zero header',
      description: undefined,
      icon: undefined,
      disabled: undefined,
    },
  ] as AccordionItem[],
  get summary(): string {
    return `${state.opened.length}: ${state.opened.includes(1) ? 'N' : '-'}${state.opened.includes('1') ? 'S' : '-'}${state.opened.includes(0) ? 'Z' : '-'}`
  },
})
</script>

<template>
  <MColumn gap="md">
    <MAccordion
      label="Typed panels"
      :items="state.items"
      :modelValue="state.opened"
      @update:modelValue="(value) => (state.opened = value)"
      :multiple="true"
    >
      <template #default="{ item }">
        <MText>{{
          item.value === 1 ? 'Number body' : item.value === '1' ? 'Text body' : 'Zero body'
        }}</MText>
      </template>
    </MAccordion>
    <MText>{{ state.summary }}</MText>
  </MColumn>
</template>
