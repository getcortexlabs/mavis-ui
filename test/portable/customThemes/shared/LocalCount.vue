<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  count: 0 as number,
})
</script>

<template>
  <MColumn gap="xs">
    <MText>{{ `Local ${state.count}` }}</MText>
    <MButton text="Add local" @click="() => (state.count += 1)" />
  </MColumn>
</template>
