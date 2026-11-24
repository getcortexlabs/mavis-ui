<script setup lang="ts">
import { reactive, type PropType } from 'vue'
import Marker from './Marker.vue'

const props = defineProps({
  title: { type: String, required: false },
  onDone: { type: Function as PropType<() => void>, required: false },
})
const state = reactive({
  last: 'none' as string,
  taps: 0 as number,
  tap(label: string): void {
    state.last = label
    state.taps += 1
    props.onDone?.()
  },
})
</script>

<template>
  <MColumn gap="md">
    <MText variant="title">{{ props.title ?? 'Untitled' }}</MText>
    <Marker
      :label="'First'"
      :strong="state.taps > 1"
      :count="state.taps"
      :onTap="(label) => state.tap(label)"
    />
    <Marker :label="'Second'" :strong="false" :onTap="() => {}" />
    <Marker :label="'Third'" :onTap="(label) => state.tap(label)" />
    <MText>{{ `Last ${state.last}, ${state.taps}` }}</MText>
  </MColumn>
</template>
