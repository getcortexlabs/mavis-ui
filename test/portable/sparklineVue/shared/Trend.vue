<script setup lang="ts">
import { computed, ref } from 'vue'
import type { SparklinePoint } from '#mavis'

const replies = ref<SparklinePoint[]>([
  { id: 'mon', label: 'Mon', value: 12 },
  { id: 'tue', label: 'Tue', value: 18 },
  { id: 'wed', label: 'Wed', value: null },
  { id: 'thu', label: 'Thu', value: 9 },
  { id: 'fri', label: 'Fri', value: 24 },
])
const level = ref(0)
const quiet = ref<SparklinePoint[]>([])
const flat = computed<SparklinePoint[]>(() => [
  { id: 'start', label: 'Start', value: level.value },
  { id: 'end', label: 'End', value: level.value },
])
const broken = computed<SparklinePoint[]>(() => [
  { id: 'left', label: 'Left', value: 0 },
  { id: 'middle', label: 'Middle', value: null },
  { id: 'right', label: 'Right', value: 0 },
])

function raise() {
  level.value = level.value === 0 ? 10 : 0
}

function next() {
  replies.value = [
    { id: 'mon', label: 'Mon', value: 30 },
    { id: 'tue', label: 'Tue', value: null },
    { id: 'wed', label: 'Wed', value: 21.5 },
  ]
}

function hear() {
  quiet.value = [{ id: 'only', label: 'Only', value: 7 }]
}
</script>

<template>
  <MColumn id="page" gap="lg">
    <MBox id="level" :height="180" background-color="#FFF4D6">
      <MColumn>
        <MSparkline
          label="Level"
          :points="flat"
          :domain="[0, 10]"
          :height="100"
          color="#2F7D6B"
          data-label="Level data"
        />
      </MColumn>
    </MBox>
    <MBox id="plain" :height="180" background-color="#FFF4D6">
      <MColumn>
        <m-sparkline
          label="Plain"
          :points="flat"
          :domain="[0, 10]"
          :height="100"
          :animated="false"
          data-label="Plain data"
        />
      </MColumn>
    </MBox>
    <MBox id="gap" :height="180" background-color="#FFF4D6">
      <MColumn>
        <MSparkline
          label="Gap"
          :points="broken"
          :domain="[0, 10]"
          :height="100"
          color="#2F7D6B"
          data-label="Gap data"
        />
      </MColumn>
    </MBox>
    <MRow gap="sm" wrap>
      <MButton text="Raise" @click="raise" />
      <MButton text="Next week" variant="secondary" @click="next" />
      <MButton text="Hear" variant="secondary" @click="hear" />
    </MRow>
    <MSparkline
      id="replies"
      label="Replies"
      :points="replies"
      :format-value="(value) => `${value} ms`"
    />
    <MSparkline
      label="Quiet"
      :points="quiet"
      show-data
      empty-label="Nothing yet"
      data-label="Quiet data"
    />
  </MColumn>
</template>
