<script setup lang="ts">
import { onBeforeUnmount, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createMavisNavigation } from '@getcortexlabs/mavis-web'
import { navigationKey } from '@getcortexlabs/mavis-core/vue'
import Screen from '../../catalog/shared/pages/PlatformMotionCheck.vue'
const router = useRouter(),
  route = useRoute()
const stop = router.beforeEach((to) => (to.path === '/checks/portable/blocked' ? false : undefined))
const navigation = createMavisNavigation(router, {
  transition: { name: 'slide', duration: 160 },
  focus: () => document.getElementById('portable-heading'),
})
provide(navigationKey, navigation)
onBeforeUnmount(() => {
  stop()
  navigation.dispose()
})
</script>
<template><Screen :detail="route.params.view === 'detail'" /></template>
