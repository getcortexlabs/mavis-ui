<script setup lang="ts">
import { reactive, type PropType } from 'vue'

const props = defineProps({
  name: { type: [String, Number] as PropType<string | number>, required: true },
})
const state = reactive({
  count: 0 as number,
})
</script>

<template>
  <MRow gap="sm">
    <MText>{{ `${props.name} ${state.count}` }}</MText>
    <MButton
      :text="`Add to ${props.name}`"
      variant="secondary"
      size="sm"
      @click="() => (state.count = state.count + 1)"
    />
  </MRow>
</template>
