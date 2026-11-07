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
    route.path === '/showcase/atlas' ||
    route.path.startsWith('/showcase/morrow') ||
    route.path.startsWith('/components/') ||
    route.path.startsWith('/checks/') ||
    /^\/preview\/(tree-select|masonry|heatmap|image-cropper|scheduler|notification-center|kanban|donut-chart|sparkline|gradient-background|particle-field|confetti)$/.test(
      route.path,
    ),
)
</script>

<template>
  <div class="catalog-shell" :style="{ backgroundColor: theme.colors.background }">
    <div class="catalog-content" :class="{ 'catalog-content--wide': wide }">
      <router-view />
    </div>
  </div>
</template>
