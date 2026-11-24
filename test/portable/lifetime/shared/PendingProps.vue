<script setup lang="ts">
import { reactive } from 'vue'
import * as mavisWork from './shared/work'

const work = mavisWork.useWork()
const props = defineProps({
  id: { type: String, required: true },
})
const state = reactive({
  status: 'No pending draft' as string,
  async wait(): Promise<void> {
    const before = props.id
    state.status = 'Waiting for ' + before
    await work.load()
    state.status = props.id === before ? 'Applied ' + before : 'Ignored ' + before
  },
})
</script>

<template>
  <MColumn gap="md">
    <MText>{{ state.status }}</MText>
    <MButton text="Wait with current id" @click="() => state.wait()" />
  </MColumn>
</template>
