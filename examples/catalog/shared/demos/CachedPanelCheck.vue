<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from '@getcortexlabs/mavis-core/vue'
const draft = ref(''),
  sheet = ref(false),
  dialog = ref(false),
  count = ref(0)
const toast = useToast()
</script>

<template>
  <m-column gap="sm">
    <m-input v-model="draft" label="Cached draft" />
    <m-button id="cached-press" @click="count++">Cached action: {{ count }}</m-button>
    <m-button @click="sheet = true">Open cached Sheet</m-button>
    <m-button @click="dialog = true">Open cached Dialog</m-button>
    <m-button @click="toast.show({ message: 'Local cached notice', duration: 0 })"
      >Show cached notice</m-button
    >
    <m-reveal :show="true"><m-text>Cached reveal</m-text></m-reveal>
    <m-sheet v-model:open="sheet" title="Cached Sheet"><m-text>Sheet content</m-text></m-sheet>
    <m-dialog v-model:open="dialog" title="Cached Dialog" confirmLabel="Done"
      ><m-text>Dialog content</m-text></m-dialog
    >
    <m-toast :controller="toast" />
  </m-column>
</template>
