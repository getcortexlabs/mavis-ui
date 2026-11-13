<script setup lang="ts">
import { ref } from 'vue'
import type { SwipeSide, SwipeAction } from '#mavis'
const side = ref<SwipeSide>(null)
const locked = ref(false)
const last = ref('none')
const start = ref<SwipeAction[]>([{ value: 'archive', label: 'Archive', icon: 'archive' }])
const end = ref<SwipeAction[]>([
  { value: 'delete', label: 'Delete', destructive: true },
  { value: 'pin', label: 'Pin', disabled: true },
])
</script>
<template>
  <MColumn gap="md">
    <MSwipeActions
      label="Message actions"
      v-model="side"
      :start="start"
      :end="end"
      :disabled="locked"
      @action="(action) => (last = action.value)"
    >
      <MText>Design review</MText>
    </MSwipeActions>
    <MRow gap="sm">
      <MButton text="Show start" @click="side = 'start'" />
      <MButton text="Show end" @click="side = 'end'" />
      <MButton :text="locked ? 'Unlock' : 'Lock'" @click="locked = !locked" />
    </MRow>
    <MText>Side: {{ side ?? 'closed' }}</MText>
    <MText>Action: {{ last }}</MText>
  </MColumn>
</template>
