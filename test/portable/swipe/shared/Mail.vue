<script setup lang="ts">
import { reactive } from 'vue'
import type { SwipeAction } from './types'

const state = reactive({
  side: undefined as string | undefined,
  locked: false as boolean,
  last: 'none' as string,
  start: [
    {
      value: 'archive',
      label: 'Archive',
      icon: 'archive',
      destructive: undefined,
      disabled: undefined,
    },
  ] as SwipeAction[],
  end: [
    { value: 'delete', label: 'Delete', destructive: true, icon: undefined, disabled: undefined },
    { value: 'pin', label: 'Pin', disabled: true, icon: undefined, destructive: undefined },
  ] as SwipeAction[],
})
</script>

<template>
  <MColumn gap="md">
    <MSwipeActions
      label="Message actions"
      :modelValue="state.side"
      @update:modelValue="(value) => (state.side = value)"
      :start="state.start"
      :end="state.end"
      :disabled="state.locked"
      @action="(action) => (state.last = action.value)"
    >
      <MText>Design review</MText>
    </MSwipeActions>
    <MRow gap="sm">
      <MButton text="Show start" @click="() => (state.side = 'start')" />
      <MButton text="Show end" @click="() => (state.side = 'end')" />
      <MButton
        :text="state.locked ? 'Unlock' : 'Lock'"
        @click="() => (state.locked = !state.locked)"
      />
    </MRow>
    <MText>{{ `Side: ${state.side ?? 'closed'}` }}</MText>
    <MText>{{ `Action: ${state.last}` }}</MText>
  </MColumn>
</template>
