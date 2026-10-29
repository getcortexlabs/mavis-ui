<script setup lang="ts">
import { computed, watch } from 'vue'
import { mavis, midnight } from '@mavis-ui/core'
import { useMavisTheme } from '@mavis-ui/core/vue'
import { findComponent } from '../../catalog/shared/catalog'

const props = defineProps<{ id: string; appearance?: string; lang?: 'en' | 'pt' }>()
const item = computed(() => findComponent(props.id))
const { setTheme } = useMavisTheme()
watch(
  () => props.appearance,
  (value) => setTheme(value === 'midnight' ? midnight : mavis),
  { immediate: true },
)
</script>

<template>
  <component v-if="item?.id === 'screen'" :is="item.demo" :lang="lang" />
  <m-column v-else padding="lg" gap="md" data-testid="component-preview">
    <component v-if="item" :is="item.demo" :lang="lang" />
  </m-column>
</template>
