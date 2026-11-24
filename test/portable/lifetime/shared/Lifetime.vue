<script setup lang="ts">
import { reactive } from 'vue'
import PendingProps from './PendingProps.vue'
import Working from './Working.vue'
import * as mavisWork from './shared/work'

const work = mavisWork.useWork()
const state = reactive({
  shown: true as boolean,
  completed: 0 as number,
  disposed: 0 as number,
  currentId: 'first' as string,
})
</script>

<template>
  <MColumn gap="md">
    <MText>{{ work.status.value }}</MText>
    <MText>{{ `Cancelled ${work.cancelled.value}, committed ${work.committed.value}` }}</MText>
    <MText>{{ `Completed ${state.completed}, disposed ${state.disposed}` }}</MText>
    <MButton text="Hide child" @click="() => (state.shown = false)" />
    <MButton text="Show child" @click="() => (state.shown = true)" />
    <MButton text="Finish pending work" @click="() => work.finish()" />
    <template v-if="state.shown">
      <Working
        :onComplete="() => (state.completed += 1)"
        :onDisposed="() => (state.disposed += 1)"
      />
    </template>
    <MButton text="Change current id" @click="() => (state.currentId = 'second')" />
    <PendingProps :id="state.currentId" />
  </MColumn>
</template>
