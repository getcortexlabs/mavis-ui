<script setup lang="ts">
import { reactive } from 'vue'
import type { ChartCategory, ChartSelection, ChartSeries } from './types'

const state = reactive({
  now: [{ key: 'now', label: 'Now' }] as ChartCategory[],
  load: [{ key: 'cpu', label: 'CPU', values: [100], color: undefined }] as ChartSeries[],
  days: [
    { key: 'mon', label: 'Mon' },
    { key: 'tue', label: 'Tue' },
    { key: 'wed', label: 'Wed' },
    { key: 'thu', label: 'Thu' },
  ] as ChartCategory[],
  week: [
    { key: 'visits', label: 'Visits', values: [20, 40, 30, 10], color: undefined },
    { key: 'saves', label: 'Saves', values: [10, undefined, 20, 5], color: '#2F7D6B' },
  ] as ChartSeries[],
  picked: undefined as ChartSelection | undefined,
  hidden: [] as string[],
  bars: false as boolean,
  locked: false as boolean,
  drop(): void {
    state.load = [{ key: 'cpu', label: 'CPU', values: [10], color: undefined }]
  },
  rise(): void {
    state.load = [{ key: 'cpu', label: 'CPU', values: [100], color: '#2F7D6B' }]
  },
  next(): void {
    state.week = [
      { key: 'visits', label: 'Visits', values: [60, 80, 20, 40], color: undefined },
      { key: 'saves', label: 'Saves', values: [30, 50, undefined, 25], color: '#2F7D6B' },
    ]
  },
  tue(): void {
    state.picked = { category: 'tue', series: 'visits' }
  },
  saves(): void {
    state.picked = { category: 'tue', series: 'saves' }
  },
})
</script>

<template>
  <MColumn id="page" gap="lg">
    <MColumn :height="640">
      <MBox id="bar" :height="420" backgroundColor="#FFF4D6">
        <MColumn>
          <MChart
            label="Load"
            type="bar"
            :categories="state.now"
            :series="
              state.load.map((entry) => ({
                ...entry,
                values: entry.values.map((value) => value ?? null),
              }))
            "
            :domain="[0, 100]"
          />
        </MColumn>
      </MBox>
    </MColumn>
    <MRow gap="sm" :wrap="true">
      <MButton text="Drop" @click="() => state.drop()" />
      <MButton text="Rise" variant="secondary" @click="() => state.rise()" />
      <MButton text="Next week" variant="secondary" @click="() => state.next()" />
      <MButton text="Pick tue" variant="secondary" @click="() => state.tue()" />
      <MButton text="Pick saves" variant="secondary" @click="() => state.saves()" />
      <MButton text="Bars" variant="secondary" @click="() => (state.bars = !state.bars)" />
      <MButton text="Lock" variant="secondary" @click="() => (state.locked = !state.locked)" />
    </MRow>
    <MText>{{
      `Picked: ${state.picked?.category ?? 'none'}/${state.picked?.series ?? 'none'}`
    }}</MText>
    <MText>{{ `Hidden: ${state.hidden.join(', ')}.` }}</MText>
    <MChart
      id="activity"
      label="Activity"
      description="Four days"
      :type="state.bars ? 'bar' : 'line'"
      :categories="state.days"
      :series="
        state.week.map((entry) => ({
          ...entry,
          values: entry.values.map((value) => value ?? null),
        }))
      "
      :height="200"
      :modelValue="state.picked ?? null"
      @update:modelValue="
        (next) =>
          ((value) => (state.picked = value))(
            next ? { category: String(next.category), series: String(next.series) } : undefined,
          )
      "
      :hiddenSeries="state.hidden"
      @update:hiddenSeries="(keys) => ((value) => (state.hidden = value))(keys.map(String))"
      :disabled="state.locked"
      :formatValue="(value) => `${value}k`"
      categoryLabel="Day"
      seriesLabel="Metric"
      missingLabel="Nothing"
    />
  </MColumn>
</template>
