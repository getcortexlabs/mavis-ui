<script setup lang="ts">
import { ref } from 'vue'
import type { AccordionItem, ChoiceValue } from '#mavis'
import type { Topic } from './types'

const questions = ref<AccordionItem[]>([
  {
    value: 'delivery',
    title: 'When will it arrive?',
    description: 'Shipping and tracking',
    icon: 'package',
  },
  { value: 'returns', title: 'Can I send it back?' },
  { value: 'gift', title: 'Gift wrapping', disabled: true },
])
const open = ref<ChoiceValue[]>(['delivery'])
const topics = ref<Topic[]>([
  { value: 'first', title: 'First topic' },
  { value: 'second', title: 'Second topic' },
])
const several = ref<ChoiceValue[]>([])
const frozen = ref(false)
const asked = ref(0)
</script>

<template>
  <MColumn gap="lg">
    <MAccordion id="single" v-model="open" label="Order questions" :items="questions">
      <template #default="{ item }">
        <MColumn :id="`answer-${item.value}`" gap="sm">
          <MText>
            {{
              item.value === 'delivery' ? 'Check the date in your order.' : 'Within thirty days.'
            }}
          </MText>
          <MColumn :id="`swatch-${item.value}`" :height="48" />
          <MButton :text="`Ask about ${item.value}`" variant="secondary" @click="asked += 1" />
        </MColumn>
      </template>
    </MAccordion>
    <MText>Open: {{ open.join(', ') }}. Asked {{ asked }} times.</MText>
    <m-accordion
      v-slot="{ item }"
      label="Several at once"
      :items="topics"
      :model-value="several"
      multiple
      :disabled="frozen"
      expanded-label="Open"
      collapsed-label="Closed"
      @update:model-value="(next) => (several = next)"
    >
      <MText>About the {{ item.title.toLowerCase() }}</MText>
    </m-accordion>
    <MRow gap="sm">
      <MButton :text="frozen ? 'Thaw' : 'Freeze'" @click="frozen = !frozen" />
      <MText>{{ several.length }} open below</MText>
    </MRow>
  </MColumn>
</template>
