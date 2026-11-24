<script setup lang="ts">
import { reactive } from 'vue'
import type { ChartCategory, ChartSelection, ChartSeries } from './types'

const state = reactive({
  categories: [
    { key: 'mon', label: 'Mon' },
    { key: 'tue', label: 'Tue' },
  ] as ChartCategory[],
  series: [
    { key: 'visits', label: 'Visits', values: [20, 60], color: undefined },
    { key: 'saves', label: 'Saves', values: [80, undefined], color: undefined },
  ] as ChartSeries[],
  picked: undefined as ChartSelection | undefined,
  hidden: [] as string[],
  bars: false as boolean,
  disabled: false as boolean,
  changes: 0 as number,
})
</script>

<template>
  <MColumn gap="sm">
    <MText id="outside">Outside plot</MText>
    <MChart
      id="hover-chart"
      label="Hover chart"
      description="Overview"
      :categories="state.categories"
      :series="
        state.series.map((entry) => ({
          ...entry,
          values: entry.values.map((value) => value ?? null),
        }))
      "
      :domain="[0, 100]"
      :height="200"
      :type="state.bars ? 'bar' : 'line'"
      :modelValue="state.picked ?? null"
      @update:modelValue="
        (next) =>
          ((next) => {
            state.picked = next
            state.changes += 1
          })(next ? { category: String(next.category), series: String(next.series) } : undefined)
      "
      :disabled="state.disabled"
      :hiddenSeries="state.hidden"
      @update:hiddenSeries="(keys) => ((keys) => (state.hidden = keys))(keys.map(String))"
    />
    <MText>{{
      `Picked ${state.picked?.category ?? 'none'}/${state.picked?.series ?? 'none'}`
    }}</MText>
    <MText>{{ `Changes ${state.changes}` }}</MText>
    <MButton text="Bars" @click="() => (state.bars = !state.bars)" />
    <MButton text="Lock" @click="() => (state.disabled = !state.disabled)" />
    <MButton
      text="Pin Tuesday"
      @click="() => (state.picked = { category: 'tue', series: 'visits' })"
    />
  </MColumn>
</template>
