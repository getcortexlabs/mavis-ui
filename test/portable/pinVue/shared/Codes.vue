<script setup lang="ts">
import { computed, ref } from 'vue'

const code = ref('')
const done = ref('nothing yet')
const problem = computed(() => (code.value === '00000' ? 'That code has expired' : ''))

function finish(next: string) {
  done.value = next
}
</script>

<template>
  <MColumn gap="md">
    <MPinInput
      id="code"
      v-model="code"
      label="Code"
      :length="5"
      helper-text="Five digits"
      :error="problem"
      @complete="finish"
    />
    <MText id="code-text">Code {{ code }} done {{ done }}</MText>
    <MRow gap="sm">
      <MButton variant="secondary" @click="code = '12345'">Fill</MButton>
      <MButton variant="secondary" @click="code = '00000'">Expire</MButton>
      <MButton variant="ghost" @click="code = ''">Clear</MButton>
    </MRow>
    <m-pin-input
      label="Backup code"
      model-value="42"
      :length="4"
      disabled
      @update:model-value="(value) => (code = value)"
    />
  </MColumn>
</template>
