<script setup lang="ts">
import { reactive } from 'vue'
import type { HeatmapValue } from './types'

const state = reactive({
  level: 10 as number,
  picked: undefined as string | undefined,
  read: undefined as string | undefined,
  locked: false as boolean,
  week: [
    { date: '2026-09-06', value: 2, label: 'Sunday', disabled: undefined },
    { date: '2026-09-07', value: 0, label: 'Monday', disabled: undefined },
    { date: '2026-09-08', value: undefined, label: 'Tuesday', disabled: undefined },
    { date: '2026-09-09', value: 4, label: 'Wednesday', disabled: true },
  ] as HeatmapValue[],
  get days(): HeatmapValue[] {
    return [
      { date: '2026-09-02', value: 10, label: undefined, disabled: undefined },
      { date: '2026-09-09', value: state.level, label: undefined, disabled: undefined },
    ]
  },
  set(next: number): void {
    state.level = next
  },
})
</script>

<template>
  <MColumn id="page" gap="lg">
    <MColumn :height="520">
      <MBox id="cell" :width="128" :height="298" backgroundColor="#FFF4D6">
        <MColumn>
          <MHeatmap
            label="Days"
            start="2026-09-01"
            end="2026-09-14"
            :values="state.days.map((entry) => ({ ...entry, value: entry.value ?? null }))"
            :modelValue="state.picked ?? null"
            @update:modelValue="(value) => (state.picked = value)"
            :colors="['#FFFFFF', '#88C0A8', '#2F7D6B']"
          />
        </MColumn>
      </MBox>
    </MColumn>
    <MRow gap="sm" :wrap="true">
      <MButton text="Half" @click="() => state.set(5)" />
      <MButton text="Zero" variant="secondary" @click="() => state.set(0)" />
      <MButton text="Full" variant="secondary" @click="() => state.set(10)" />
      <MButton text="Lock" variant="secondary" @click="() => (state.locked = !state.locked)" />
    </MRow>
    <MText>{{ `Picked: ${state.picked ?? 'none'}` }}</MText>
    <MText>{{ `Read: ${state.read ?? 'none'}` }}</MText>
    <MHeatmap
      id="reading"
      label="Reading"
      start="2026-09-06"
      end="2026-09-12"
      :values="state.week.map((entry) => ({ ...entry, value: entry.value ?? null }))"
      :modelValue="state.read ?? null"
      @update:modelValue="(value) => (state.read = value)"
      :weekStartsOn="0"
      :cellSize="32"
      :animated="false"
      :disabled="state.locked"
      missingLabel="None"
      dataLabel="Week data"
      lessLabel="Fewer"
      moreLabel="Most"
      :formatValue="(value) => `${value} h`"
    />
  </MColumn>
</template>
