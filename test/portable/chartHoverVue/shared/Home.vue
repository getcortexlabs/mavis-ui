<script setup lang="ts">
import { ref } from 'vue'
import type { ChartCategory, ChartSeries, ChartSelection } from '#mavis'
const categories = ref<ChartCategory[]>([
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
])
const series = ref<ChartSeries[]>([
  { key: 'visits', label: 'Visits', values: [20, 60] },
  { key: 'saves', label: 'Saves', values: [80, null] },
])
const picked = ref<ChartSelection | null>(null)
const hidden = ref<string[]>([])
const bars = ref(false)
const disabled = ref(false)
const changes = ref(0)
function choose(next: ChartSelection | null) {
  picked.value = next
  changes.value += 1
}
</script>
<template>
  <MColumn gap="sm">
    <MText id="outside">Outside plot</MText>
    <MChart
      id="hover-chart"
      label="Hover chart"
      description="Overview"
      :categories="categories"
      :series="series"
      :domain="[0, 100]"
      :height="200"
      :type="bars ? 'bar' : 'line'"
      :modelValue="picked"
      @update:modelValue="choose"
      :disabled="disabled"
      v-model:hiddenSeries="hidden"
    />
    <MText>{{ `Picked ${picked?.category ?? 'none'}/${picked?.series ?? 'none'}` }}</MText
    ><MText>{{ `Changes ${changes}` }}</MText> <MButton text="Bars" @click="bars = !bars" /><MButton
      text="Lock"
      @click="disabled = !disabled"
    /><MButton text="Pin Tuesday" @click="picked = { category: 'tue', series: 'visits' }" />
  </MColumn>
</template>
