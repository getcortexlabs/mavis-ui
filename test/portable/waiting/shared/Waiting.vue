<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  count: 0 as number,
  busy: false as boolean,
  offline: false as boolean,
  note: 'Nothing yet' as string,
  async verify(): Promise<void> {
    if (state.offline) {
      throw new Error('Offline')
    }
    state.count += 1
  },
  async check(): Promise<void> {
    state.busy = true
    state.note = 'Checking'
    try {
      await state.verify()
      await state.verify()
      state.note = `Checked ${state.count}`
    } catch {
      state.note = 'Check failed'
    } finally {
      state.busy = false
    }
  },
  async attempt(): Promise<void> {
    try {
      await state.verify()
    } finally {
      state.note = `Tried ${state.count}`
    }
  },
  async guarded(): Promise<void> {
    try {
      await state.attempt()
    } catch {
      state.note = `${state.note}, caught`
    }
  },
  start(): void {
    state.check()
  },
})
</script>

<template>
  <MColumn gap="md">
    <MText>{{ `Count ${state.count}` }}</MText>
    <MText>{{ state.busy ? 'Busy' : 'Ready' }}</MText>
    <MText>{{ state.note }}</MText>
    <MRow gap="sm" :wrap="true">
      <MButton @click="() => state.check()" text="Check" />
      <MButton @click="() => state.start()" text="Start" />
      <MButton @click="() => state.guarded()" text="Try" />
      <MButton
        @click="() => (state.offline = !state.offline)"
        :text="state.offline ? 'Go online' : 'Go offline'"
      />
    </MRow>
  </MColumn>
</template>
