<script setup lang="ts">
import { reactive } from 'vue'
import * as mavisCalculations from './shared/calculations'

const state = reactive({
  runs: 0 as number,
})
</script>

<template>
  <MColumn gap="sm">
    <MText>{{ mavisCalculations.setSummary() }}</MText>
    <MText>{{ mavisCalculations.mapSummary() }}</MText>
    <MText>{{ mavisCalculations.keySummary() }}</MText>
    <MText>{{ `Runs ${state.runs}` }}</MText>
    <MButton text="Calculate again" @click="() => (state.runs += 1)" />
  </MColumn>
</template>
