<script setup>
import { computed, watch } from 'vue'
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { mavis, midnight } from '@getcortexlabs/mavis-core'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import {
  componentCategories,
  componentUpdates,
  statusLabel,
  statusDescription,
} from '../catalog.mjs'
import OrbitSignature from './OrbitSignature.vue'
import DevelopmentBadge from './DevelopmentBadge.vue'
import CatalogLegend from './CatalogLegend.vue'

const { page, lang, isDark } = useData()
const { setTheme } = useMavisTheme()
watch(isDark, (dark) => setTheme(dark ? midnight : mavis), { immediate: true })
const pt = computed(() => lang.value === 'pt-BR')
const prefix = computed(() => (pt.value ? '/pt-BR' : ''))
const id = computed(() => page.value.relativePath.match(/(?:^|\/)components\/([^/]+)\.md$/)?.[1])
const category = computed(() =>
  componentCategories.find((group) => group.items.some(([key]) => key === id.value)),
)
</script>

<template>
  <DefaultTheme.Layout>
    <template #nav-bar-title-after><DevelopmentBadge /></template>
    <template #sidebar-nav-after><CatalogLegend /></template>
    <template #doc-before>
      <div v-if="category" class="doc-masthead">
        <a :href="`${prefix}/components/`">{{ pt ? 'BIBLIOTECA' : 'LIBRARY' }}</a
        ><span aria-hidden="true">/</span><span>{{ category.name[pt ? 1 : 0] }}</span>
        <span
          v-if="componentUpdates[id]"
          class="catalog-status"
          :class="componentUpdates[id]"
          :title="statusDescription(id, pt)"
          >{{ statusLabel(id, pt) }}</span
        >
      </div>
    </template>
    <template #layout-bottom><OrbitSignature /></template>
  </DefaultTheme.Layout>
</template>
