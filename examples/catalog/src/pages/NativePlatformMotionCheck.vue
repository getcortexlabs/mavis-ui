<script setup lang="ts">
import { onBeforeUnmount, provide } from 'vue'
import { useRouter, useRoute } from 'vue-router-ns'
import { createMavisNavigation } from '@getcortexlabs/mavis/vue'
import { navigationKey } from '@getcortexlabs/mavis-core/vue'
import Screen from '../../shared/pages/PlatformMotionCheck.vue'
const router = useRouter(),
  route = useRoute()
const stop = router.beforeEach((to) => (to.path === '/checks/portable/blocked' ? false : undefined))
provide(
  navigationKey,
  createMavisNavigation(router, { transition: { name: 'slide', duration: 160 } }),
)
onBeforeUnmount(stop)
</script>
<template><Screen :detail="route.params.view === 'detail'" /></template>
