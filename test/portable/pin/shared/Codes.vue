<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  code: '' as string,
  done: 'nothing yet' as string,
  get problem(): string {
    return state.code === '00000' ? 'That code has expired' : ''
  },
  finish(next: string): void {
    state.done = next
  },
})
</script>

<template>
  <MColumn gap="md">
    <MPinInput
      id="code"
      label="Code"
      :modelValue="state.code"
      @update:modelValue="(value) => (state.code = value)"
      @complete="(next) => state.finish(next)"
      :length="5"
      helperText="Five digits"
      :error="state.problem"
    />
    <MText id="code-text">{{ `Code ${state.code} done ${state.done}` }}</MText>
    <MRow gap="sm">
      <MButton text="Fill" variant="secondary" @click="() => (state.code = '12345')" />
      <MButton text="Expire" variant="secondary" @click="() => (state.code = '00000')" />
      <MButton text="Clear" variant="ghost" @click="() => (state.code = '')" />
    </MRow>
    <MPinInput
      label="Backup code"
      modelValue="42"
      @update:modelValue="(value) => (state.code = value)"
      :length="4"
      :disabled="true"
    />
  </MColumn>
</template>
