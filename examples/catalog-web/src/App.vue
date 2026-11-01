<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'

const { theme } = useMavisTheme()
const route = useRoute()
const wide = computed(
  () =>
    route.path === '/' ||
    route.path === '/showcase' ||
    route.path === '/showcase/studio' ||
    route.path.startsWith('/components/') ||
    route.path.startsWith('/checks/'),
)
</script>

<template>
  <div class="catalog-shell" :style="{ backgroundColor: theme.colors.background }">
    <div class="catalog-content" :class="{ 'catalog-content--wide': wide }">
      <router-view />
    </div>
  </div>
</template>
