<script setup lang="ts">
import { ref } from 'vue'
const cards = ref(0)
const children = ref(0)
const note = ref('draft')
const disabled = ref(false)
</script>
<template>
  <MColumn gap="sm" :width="400">
    <MCard
      interactive
      accessibilityLabel="Open collection"
      @click="cards++"
      :disabled="disabled"
      gap="sm"
    >
      <MButton text="Nested action" @click="children++" />
      <MInput label="Note" v-model="note" />
      <MColumn :height="220" />
    </MCard>
    <MButton text="Lock card" @click="disabled = true" />
    <MText>{{ 'Cards ' + cards + ' / Children ' + children + ' / ' + note }}</MText>
  </MColumn>
</template>
