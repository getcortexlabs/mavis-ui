<script setup lang="ts">
import { computed, watch, provide } from 'vue'
import { mavis, midnight } from '@getcortexlabs/mavis-core'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { findComponent } from '../../catalog/shared/catalog'

import { createCatalogLocale, catalogLocaleKey } from '../../catalog/shared/locale'
const previewLocale = createCatalogLocale()
provide(catalogLocaleKey, previewLocale)
const props = defineProps<{ id: string; appearance?: string; lang?: 'en' | 'pt' }>()
watch(
  () => props.lang,
  (value) => previewLocale.setLanguage(value === 'en' ? 'en' : 'pt'),
  { immediate: true },
)
const advanced = computed(() =>
  [
    'tree-select',
    'masonry',
    'heatmap',
    'image-cropper',
    'scheduler',
    'notification-center',
  ].includes(props.id),
)
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
  <m-column
    v-else
    padding="lg"
    gap="md"
    data-testid="component-preview"
    :style="advanced ? { width: '100%', maxWidth: '1200px', marginInline: 'auto' } : undefined"
  >
    <component v-if="item" :is="item.demo" :lang="lang" />
  </m-column>
</template>
