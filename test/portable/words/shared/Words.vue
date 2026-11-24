<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  input: '  Mavis UI  ' as string,
  emoji: 'Hi 👋🏽' as string,
  done: false as boolean,
  get trimmed(): string {
    return state.input.trim()
  },
  get summary(): string {
    return `${state.trimmed.length}/${state.emoji.length} ${state.trimmed.toUpperCase()} ${state.done}`
  },
  get checks(): string {
    return (
      (state.trimmed.includes('UI') ? 'has UI' : 'no UI') +
      ', ' +
      (state.trimmed.startsWith('Mav') && state.trimmed.endsWith('UI'))
    )
  },
})
</script>

<template>
  <MColumn gap="sm">
    <MText>{{ `[${state.trimmed}]` }}</MText>
    <MText>{{ state.summary }}</MText>
    <MText>{{ state.checks }}</MText>
    <MText>{{ 'x' + 1 + true }}</MText>
    <MColumn gap="xs">
      <MButton text="Unicode spaces" @click="() => (state.input = '  Ünïcode﻿　')" />
      <MButton
        text="Append"
        @click="
          () => {
            state.input += '!'
            state.done = !state.done
          }
        "
      />
      <MButton text="Lowercase" @click="() => (state.input = state.input.toLowerCase())" />
      <MButton text="Blank" @click="() => (state.input = '   ')" />
      <MButton text="Next line" @click="() => (state.input = 'Next')" />
    </MColumn>
  </MColumn>
</template>
