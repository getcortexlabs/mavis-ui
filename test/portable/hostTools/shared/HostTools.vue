<script setup lang="ts">
import { reactive } from 'vue'
import Scheduled from './Scheduled.vue'
import * as mavisUtilities from './shared/utilities'

const tools = mavisUtilities.useUtilities()
const state = reactive({
  shown: false as boolean,
})
</script>

<template>
  <MColumn gap="md">
    <MText>{{ tools.summary.value }}</MText>
    <MText>{{
      `${tools.timer.value}; completed ${tools.completed.value}; cancelled ${tools.cancelled.value}`
    }}</MText>
    <MButton text="Use platform tools" @click="() => tools.demonstrate()" />
    <MButton text="Run short timer" @click="() => tools.run(25)" />
    <MButton text="Show scheduled child" @click="() => (state.shown = true)" />
    <MButton text="Hide scheduled child" @click="() => (state.shown = false)" />
    <template v-if="state.shown">
      <Scheduled />
    </template>
  </MColumn>
</template>
