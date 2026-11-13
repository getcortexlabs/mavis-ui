<script setup lang="ts">
import { ref } from 'vue'
import type { ChartCategory, ChartSelection, ChartSeries } from '#mavis'

const now = ref<ChartCategory[]>([{ key: 'now', label: 'Now' }])
const load = ref<ChartSeries[]>([{ key: 'cpu', label: 'CPU', values: [100] }])
const days = ref<ChartCategory[]>([
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
])
const week = ref<ChartSeries[]>([
  { key: 'visits', label: 'Visits', values: [20, 40, 30, 10] },
  { key: 'saves', label: 'Saves', values: [10, null, 20, 5], color: '#2F7D6B' },
])
const picked = ref<ChartSelection | null>(null)
const hidden = ref<string[]>([])
const bars = ref(false)
const locked = ref(false)

function drop() {
  load.value = [{ key: 'cpu', label: 'CPU', values: [10] }]
}

function rise() {
  load.value = [{ key: 'cpu', label: 'CPU', values: [100], color: '#2F7D6B' }]
}

function next() {
  week.value = [
    { key: 'visits', label: 'Visits', values: [60, 80, 20, 40] },
    { key: 'saves', label: 'Saves', values: [30, 50, null, 25], color: '#2F7D6B' },
  ]
}

function tue() {
  picked.value = { category: 'tue', series: 'visits' }
}

function saves() {
  picked.value = { category: 'tue', series: 'saves' }
}
</script>

<template>
  <MColumn id="page" gap="lg">
    <MColumn :height="640">
      <MBox id="bar" :height="420" background-color="#FFF4D6">
        <MColumn>
          <MChart label="Load" type="bar" :categories="now" :series="load" :domain="[0, 100]" />
        </MColumn>
      </MBox>
    </MColumn>
    <MRow gap="sm" wrap>
      <MButton text="Drop" @click="drop" />
      <MButton text="Rise" variant="secondary" @click="rise" />
      <MButton text="Next week" variant="secondary" @click="next" />
      <MButton text="Pick tue" variant="secondary" @click="tue" />
      <MButton text="Pick saves" variant="secondary" @click="saves" />
      <MButton text="Bars" variant="secondary" @click="bars = !bars" />
      <MButton text="Lock" variant="secondary" @click="locked = !locked" />
    </MRow>
    <MText>Picked: {{ picked?.category ?? 'none' }}/{{ picked?.series ?? 'none' }}</MText>
    <MText>Hidden: {{ hidden.join(', ') }}.</MText>
    <m-chart
      id="activity"
      v-model="picked"
      v-model:hidden-series="hidden"
      label="Activity"
      description="Four days"
      :type="bars ? 'bar' : 'line'"
      :categories="days"
      :series="week"
      :height="200"
      :disabled="locked"
      :format-value="(value) => `${value}k`"
      category-label="Day"
      series-label="Metric"
      missing-label="Nothing"
    />
  </MColumn>
</template>
