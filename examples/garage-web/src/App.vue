<script setup lang="ts">
import { useMavisTheme } from '@mavis-ui/core/vue'

const { theme } = useMavisTheme()
</script>

<template>
  <div class="garage-shell" :style="{ backgroundColor: theme.colors.background }">
    <div class="garage-content">
      <router-view />
    </div>
  </div>
</template>
