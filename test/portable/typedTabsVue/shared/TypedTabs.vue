<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ChoiceValue, TabOption, StepOption } from '#mavis'
const value = ref<ChoiceValue | null>(null)
const tabs: TabOption[] = [
  { value: 1, label: 'Number tab' },
  { value: '1', label: 'Text tab' },
  { value: 0, label: 'Zero tab' },
]
const steps: StepOption[] = [
  { value: 1, label: 'Number step' },
  { value: '1', label: 'Text step' },
  { value: 0, label: 'Zero step' },
]
const summary = computed(() =>
  value.value === 1
    ? 'Numeric one'
    : value.value === '1'
      ? 'Textual one'
      : value.value === 0
        ? 'Zero'
        : 'None',
)
</script>
<template>
  <MColumn gap="md">
    <MTabs label="Typed tabs" :tabs="tabs" v-model="value" keep-alive
      ><template #default="{ value }"
        ><MText>{{
          value === 1 ? 'Number panel' : value === '1' ? 'Text panel' : 'Zero panel'
        }}</MText></template
      ></MTabs
    >
    <MSteps label="Typed steps" :steps="steps" v-model="value" />
    <MText>{{ summary }}</MText
    ><MButton text="Clear" @click="value = null" />
  </MColumn>
</template>
