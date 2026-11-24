<script setup lang="ts">
import { reactive, ref } from 'vue'

const codeRef = ref<{ focus(): void; blur(): void }>()
const state = reactive({
  code: '' as string,
  done: 'nothing yet' as string,
  get problem(): string {
    return state.code === '00000' ? 'That code has expired' : ''
  },
  finish(next: string): void {
    state.done = next
  },
  edit(): void {
    codeRef.value?.focus()
  },
})
</script>

<template>
  <MColumn gap="md">
    <MPinInput
      ref="codeRef"
      label="Code"
      :modelValue="state.code"
      @update:modelValue="(value) => (state.code = value)"
      @complete="(next) => state.finish(next)"
      :length="5"
      helperText="Five digits"
      :error="state.problem"
    />
    <MText>{{ `Code ${state.code} done ${state.done}` }}</MText>
    <MButton text="Edit code" @click="() => state.edit()" />
  </MColumn>
</template>
