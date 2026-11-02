<script setup lang="ts">
import { ref } from 'vue'
const active = ref(true)
</script>
<template>
  <div>
    <button @click="active = !active">
      {{ active ? 'Deactivate orchestration' : 'Activate orchestration' }}
    </button>
    <NuxtLink to="/">Leave orchestration</NuxtLink>
    <KeepAlive><OrchestrationScene v-if="active" /></KeepAlive>
  </div>
</template>
