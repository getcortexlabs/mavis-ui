<script setup lang="ts">
import { reactive, onMounted, onUnmounted, type PropType } from 'vue'
import * as mavisWork from './shared/work'

const work = mavisWork.useWork()
const props = defineProps({
  onComplete: { type: Function as PropType<() => void>, required: true },
  onDisposed: { type: Function as PropType<() => void>, required: true },
})
const state = reactive({
  active: true as boolean,
})
onMounted(async () => {
  await work.load()
  if (state.active) {
    props.onComplete()
  }
})
onUnmounted(() => {
  state.active = false
  work.cancel()
  props.onDisposed()
})
</script>

<template>
  <MText>Working child</MText>
</template>
