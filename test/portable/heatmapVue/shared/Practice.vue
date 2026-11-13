<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CivilDate, HeatmapValue } from '#mavis'

const level = ref(10)
const picked = ref<CivilDate | null>(null)
const read = ref<CivilDate | null>(null)
const locked = ref(false)
const week = ref<HeatmapValue[]>([
  { date: '2026-09-06', value: 2, label: 'Sunday' },
  { date: '2026-09-07', value: 0, label: 'Monday' },
  { date: '2026-09-08', value: null, label: 'Tuesday' },
  { date: '2026-09-09', value: 4, label: 'Wednesday', disabled: true },
])
const days = computed<HeatmapValue[]>(() => [
  { date: '2026-09-02', value: 10 },
  { date: '2026-09-09', value: level.value },
])

function set(next: number) {
  level.value = next
}
</script>

<template>
  <MColumn id="page" gap="lg">
    <MColumn :height="520">
      <MBox id="cell" :width="128" :height="298" background-color="#FFF4D6">
        <MColumn>
          <MHeatmap
            v-model="picked"
            label="Days"
            start="2026-09-01"
            end="2026-09-14"
            :values="days"
            :colors="['#FFFFFF', '#88C0A8', '#2F7D6B']"
          />
        </MColumn>
      </MBox>
    </MColumn>
    <MRow gap="sm" wrap>
      <MButton text="Half" @click="set(5)" />
      <MButton text="Zero" variant="secondary" @click="set(0)" />
      <MButton text="Full" variant="secondary" @click="set(10)" />
      <MButton text="Lock" variant="secondary" @click="locked = !locked" />
    </MRow>
    <MText>Picked: {{ picked ?? 'none' }}</MText>
    <MText>Read: {{ read ?? 'none' }}</MText>
    <m-heatmap
      id="reading"
      v-model="read"
      label="Reading"
      start="2026-09-06"
      end="2026-09-12"
      :values="week"
      :week-starts-on="0"
      :cell-size="32"
      :animated="false"
      :disabled="locked"
      missing-label="None"
      data-label="Week data"
      less-label="Fewer"
      more-label="Most"
      :format-value="(value) => `${value} h`"
    />
  </MColumn>
</template>
