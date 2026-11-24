<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  cards: 0 as number,
  children: 0 as number,
  note: 'draft' as string,
  disabled: false as boolean,
})
</script>

<template>
  <MColumn gap="sm" :width="400">
    <MCard
      accessibilityLabel="Open collection"
      interactive
      @click="() => (state.cards += 1)"
      :disabled="state.disabled"
      gap="sm"
    >
      <MButton text="Nested action" @click="() => (state.children += 1)" />
      <MInput
        label="Note"
        :modelValue="state.note"
        @update:modelValue="(value) => (state.note = value)"
      />
      <MColumn :height="220" />
    </MCard>
    <MButton text="Lock card" @click="() => (state.disabled = true)" />
    <MText>{{
      'Cards ' + state.cards + ' / Children ' + state.children + ' / ' + state.note
    }}</MText>
  </MColumn>
</template>
