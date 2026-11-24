<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  show: false as boolean,
  name: '' as string,
})
</script>

<template>
  <MColumn gap="lg">
    <MButton
      :text="state.show ? 'Hide details' : 'Show details'"
      @click="() => (state.show = !state.show)"
    />
    <MReveal :show="state.show" gap="sm" padding="md" backgroundColor="#eef3e8" radius="md">
      <MText id="reveal-title">Details</MText>
      <MText id="reveal-note">A column with its own spacing</MText>
      <MInput
        label="Name"
        :modelValue="state.name"
        @update:modelValue="(value) => (state.name = value)"
      />
      <MButton text="Close details" @click="() => (state.show = false)" />
    </MReveal>
    <MText>Tail</MText>
  </MColumn>
</template>
