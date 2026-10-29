<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMavisTheme } from '@mavis-ui/core/vue'

const { theme } = useMavisTheme()
const route = useRoute()
const wide = computed(
  () => route.path === '/' || route.path === '/showcase' || route.path.startsWith('/components/'),
)
</script>

<template>
  <div class="catalog-shell" :style="{ backgroundColor: theme.colors.background }">
    <div class="catalog-content" :class="{ 'catalog-content--wide': wide }">
      <router-view />
    </div>
  </div>
</template>
