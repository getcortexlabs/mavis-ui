<script setup lang="ts">
import { ref } from 'vue'
import { MCard } from '@getcortexlabs/mavis-web'
const kind = ref('git')
</script>
<template>
  <div>
    <MCard
      interactive
      accessibility-label="Git"
      :aria-pressed="kind === 'git'"
      @click="kind = 'git'"
      >Git</MCard
    >
    <MCard
      interactive
      accessibility-label="Image"
      :aria-pressed="kind === 'image'"
      @click="kind = 'image'"
      >Image</MCard
    >
    <PreferenceEditor :profile="{ name: 'Studio', email: 'studio@example.com' }" />
  </div>
</template>
