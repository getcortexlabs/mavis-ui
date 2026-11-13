<script setup lang="ts">
import { ref } from 'vue'
import { MButton, MColumn, MInput, MReveal, MText } from '#mavis'
const show = ref(false)
const name = ref('')
</script>
<template>
  <MColumn gap="lg">
    <MButton :text="show ? 'Hide details' : 'Show details'" @click="show = !show" />
    <MReveal :show="show" gap="sm" padding="md" backgroundColor="#eef3e8" radius="md">
      <MText id="reveal-title">Details</MText>
      <MText id="reveal-note">A column with its own spacing</MText>
      <MInput label="Name" v-model="name" />
      <MButton text="Close details" @click="show = false" />
    </MReveal>
    <MText>Tail</MText>
  </MColumn>
</template>
