<script setup lang="ts">
import { ref } from 'vue'

const split = ref(40)
const settled = ref(0)
</script>

<template>
  <MColumn gap="md">
    <MResizablePanels
      v-model="split"
      label="Workspace split"
      collapsible
      :height="160"
      @resize="(value) => (settled = value)"
    >
      <template #primary>
        <MText>Shelves</MText>
      </template>
      <template #secondary>
        <MText>Pages</MText>
      </template>
    </MResizablePanels>
    <MText>Split {{ split }}</MText>
    <MText>Settled {{ settled }}</MText>
  </MColumn>
</template>
