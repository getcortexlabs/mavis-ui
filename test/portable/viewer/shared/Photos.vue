<script setup lang="ts">
import { reactive } from 'vue'
import type { ViewerImage } from './types'

const state = reactive({
  images: [
    {
      key: 'one',
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAGCAIAAABxZ0isAAAAAXNSR0IArs4c6QAAABFJREFUeJxjqLL/hBUxDKQEAGAfUBGNy+PwAAAAAElFTkSuQmCC',
      alt: 'Blue morning',
      caption: 'Before sunrise',
      thumbnail: undefined,
      aspectRatio: undefined,
    },
    {
      key: 'two',
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAGCAIAAABxZ0isAAAAAXNSR0IArs4c6QAAABFJREFUeJxjqLL/hBUxDKQEAGAfUBGNy+PwAAAAAElFTkSuQmCC',
      alt: 'Evening light',
      caption: 'After sunset',
      thumbnail: undefined,
      aspectRatio: undefined,
    },
  ] as ViewerImage[],
  selected: undefined as string | undefined,
  open: false as boolean,
  reason: 'none' as string,
})
</script>

<template>
  <MColumn gap="md">
    <MImageViewer
      label="Portfolio"
      :images="state.images"
      :modelValue="state.selected"
      @update:modelValue="(value) => (state.selected = value)"
      :open="state.open"
      @update:open="(value) => (state.open = value)"
      @close="(reason) => (state.reason = reason)"
      :maxZoom="3"
    />
    <MText>{{ `Selected: ${state.selected ?? 'none'}` }}</MText>
    <MText>{{ `Closed: ${state.reason}` }}</MText>
  </MColumn>
</template>
