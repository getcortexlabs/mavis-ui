<script setup lang="ts">
import { reactive } from 'vue'
import type { SparklinePoint } from './types'

const state = reactive({
  replies: [
    { id: 'mon', label: 'Mon', value: 12 },
    { id: 'tue', label: 'Tue', value: 18 },
    { id: 'wed', label: 'Wed', value: undefined },
    { id: 'thu', label: 'Thu', value: 9 },
    { id: 'fri', label: 'Fri', value: 24 },
  ] as SparklinePoint[],
  level: 0 as number,
  quiet: [] as SparklinePoint[],
  get flat(): SparklinePoint[] {
    return [
      { id: 'start', label: 'Start', value: state.level },
      { id: 'end', label: 'End', value: state.level },
    ]
  },
  get broken(): SparklinePoint[] {
    return [
      { id: 'left', label: 'Left', value: 0 },
      { id: 'middle', label: 'Middle', value: undefined },
      { id: 'right', label: 'Right', value: 0 },
    ]
  },
  raise(): void {
    state.level = state.level === 0 ? 10 : 0
  },
  next(): void {
    state.replies = [
      { id: 'mon', label: 'Mon', value: 30 },
      { id: 'tue', label: 'Tue', value: undefined },
      { id: 'wed', label: 'Wed', value: 21.5 },
    ]
  },
  hear(): void {
    state.quiet = [{ id: 'only', label: 'Only', value: 7 }]
  },
})
</script>

<template>
  <MColumn id="page" gap="lg">
    <MBox id="level" :height="180" backgroundColor="#FFF4D6">
      <MColumn>
        <MSparkline
          label="Level"
          :points="state.flat.map((entry) => ({ ...entry, value: entry.value ?? null }))"
          :domain="[0, 10]"
          :height="100"
          color="#2F7D6B"
          dataLabel="Level data"
        />
      </MColumn>
    </MBox>
    <MBox id="plain" :height="180" backgroundColor="#FFF4D6">
      <MColumn>
        <MSparkline
          label="Plain"
          :points="state.flat.map((entry) => ({ ...entry, value: entry.value ?? null }))"
          :domain="[0, 10]"
          :height="100"
          :animated="false"
          dataLabel="Plain data"
        />
      </MColumn>
    </MBox>
    <MBox id="gap" :height="180" backgroundColor="#FFF4D6">
      <MColumn>
        <MSparkline
          label="Gap"
          :points="state.broken.map((entry) => ({ ...entry, value: entry.value ?? null }))"
          :domain="[0, 10]"
          :height="100"
          color="#2F7D6B"
          dataLabel="Gap data"
        />
      </MColumn>
    </MBox>
    <MRow gap="sm" :wrap="true">
      <MButton text="Raise" @click="() => state.raise()" />
      <MButton text="Next week" variant="secondary" @click="() => state.next()" />
      <MButton text="Hear" variant="secondary" @click="() => state.hear()" />
    </MRow>
    <MSparkline
      id="replies"
      label="Replies"
      :points="state.replies.map((entry) => ({ ...entry, value: entry.value ?? null }))"
      :formatValue="(value) => `${value} ms`"
    />
    <MSparkline
      label="Quiet"
      :points="state.quiet.map((entry) => ({ ...entry, value: entry.value ?? null }))"
      :showData="true"
      emptyLabel="Nothing yet"
      dataLabel="Quiet data"
    />
  </MColumn>
</template>
