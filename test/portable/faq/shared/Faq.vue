<script setup lang="ts">
import { reactive } from 'vue'
import type { AccordionItem, Topic } from './types'

const state = reactive({
  questions: [
    {
      value: 'delivery',
      title: 'When will it arrive?',
      description: 'Shipping and tracking',
      icon: 'package',
      disabled: undefined,
    },
    {
      value: 'returns',
      title: 'Can I send it back?',
      description: undefined,
      icon: undefined,
      disabled: undefined,
    },
    {
      value: 'gift',
      title: 'Gift wrapping',
      disabled: true,
      description: undefined,
      icon: undefined,
    },
  ] as AccordionItem[],
  open: ['delivery'] as (string | number)[],
  topics: [
    { value: 'first', title: 'First topic' },
    { value: 'second', title: 'Second topic' },
  ] as Topic[],
  several: [] as (string | number)[],
  frozen: false as boolean,
  asked: 0 as number,
})
</script>

<template>
  <MColumn gap="lg">
    <MAccordion
      id="single"
      label="Order questions"
      :items="state.questions"
      :modelValue="state.open"
      @update:modelValue="(value) => (state.open = value)"
    >
      <template #default="{ item }">
        <MColumn :id="`answer-${item.value}`" gap="sm">
          <MText>{{
            item.value === 'delivery' ? 'Check the date in your order.' : 'Within thirty days.'
          }}</MText>
          <MColumn :id="`swatch-${item.value}`" :height="48" />
          <MButton
            :text="`Ask about ${item.value}`"
            variant="secondary"
            @click="() => (state.asked += 1)"
          />
        </MColumn>
      </template>
    </MAccordion>
    <MText>{{ `Open: ${state.open.join(', ')}. Asked ${state.asked} times.` }}</MText>
    <MAccordion
      label="Several at once"
      :items="state.topics"
      :modelValue="state.several"
      @update:modelValue="(next) => (state.several = next)"
      :multiple="true"
      :disabled="state.frozen"
      expandedLabel="Open"
      collapsedLabel="Closed"
    >
      <template #default="{ item }">
        <MText>{{ `About the ${item.title.toLowerCase()}` }}</MText>
      </template>
    </MAccordion>
    <MRow gap="sm">
      <MButton
        :text="state.frozen ? 'Thaw' : 'Freeze'"
        @click="() => (state.frozen = !state.frozen)"
      />
      <MText>{{ `${state.several.length} open below` }}</MText>
    </MRow>
  </MColumn>
</template>
