<script setup lang="ts">
import { ref } from 'vue'
import type { ViewerImage } from '@getcortexlabs/mavis-core'
const images = ref<ViewerImage[]>([
  {
    key: 'one',
    src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAGCAIAAABxZ0isAAAAAXNSR0IArs4c6QAAABFJREFUeJxjqLL/hBUxDKQEAGAfUBGNy+PwAAAAAElFTkSuQmCC',
    alt: 'Blue morning',
    caption: 'Before sunrise',
  },
  {
    key: 'two',
    src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAGCAIAAABxZ0isAAAAAXNSR0IArs4c6QAAABFJREFUeJxjqLL/hBUxDKQEAGAfUBGNy+PwAAAAAElFTkSuQmCC',
    alt: 'Evening light',
    caption: 'After sunset',
  },
])
const selected = ref<string | undefined>(undefined)
const open = ref(false)
const reason = ref('none')
</script>
<template>
  <MColumn gap="md">
    <MImageViewer
      label="Portfolio"
      :images="images"
      v-model="selected"
      v-model:open="open"
      @close="(value) => (reason = value)"
      :max-zoom="3"
    />
    <MText>Selected: {{ selected ?? 'none' }}</MText>
    <MText>Closed: {{ reason }}</MText>
  </MColumn>
</template>
