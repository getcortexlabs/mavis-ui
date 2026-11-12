<script setup lang="ts">
import { computed, ref } from 'vue'
import type { InputHandle } from '#mavis'

const codeRef = ref<InputHandle | null>(null)
const code = ref('')
const done = ref('nothing yet')
const problem = computed(() => (code.value === '00000' ? 'That code has expired' : ''))

function finish(next: string) {
  done.value = next
}

function edit() {
  codeRef.value?.focus()
}
</script>

<template>
  <MColumn gap="md">
    <MPinInput
      ref="codeRef"
      v-model="code"
      label="Code"
      :length="5"
      helper-text="Five digits"
      :error="problem"
      @complete="finish"
    />
    <MText>Code {{ code }} done {{ done }}</MText>
    <MButton @click="edit">Edit code</MButton>
  </MColumn>
</template>
