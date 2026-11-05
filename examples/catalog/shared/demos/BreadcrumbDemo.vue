<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
import type { BreadcrumbItem } from '@getcortexlabs/mavis-core'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const t = (en: string, br: string) => ((props.lang ?? locale.value) === 'pt' ? br : en)
const destination = ref('—')
const items = computed<BreadcrumbItem[]>(() => [
  {
    key: 'home',
    label: 'Orbit',
    href: '/',
    navigate: (href) => {
      destination.value = href
    },
  },
  {
    key: 'projects',
    label: t('Projects', 'Projetos'),
    href: '/projects',
    navigate: (href) => {
      destination.value = href
    },
  },
  {
    key: 'studio',
    label: 'Studio',
    href: '/projects/studio',
    navigate: (href) => {
      destination.value = href
    },
  },
  {
    key: 'brand',
    label: t('Brand system', 'Sistema de marca'),
    href: '/projects/studio/brand',
    navigate: (href) => {
      destination.value = href
    },
  },
  { key: 'colors', label: t('Color stories', 'Histórias em cores') },
])
</script>

<template>
  <MCard gap="lg" padding="lg">
    <MBreadcrumb
      :items="items"
      :maxItems="3"
      :label="t('Breadcrumb', 'Caminho de navegação')"
      :expandLabel="t('Show full path', 'Mostrar caminho completo')"
    />
    <MSeparator />
    <MRow gap="md"
      ><MIcon name="palette" :size="32" tone="primary" /><MText
        :text="t('Color stories', 'Histórias em cores')"
        variant="title"
        :shrink="1"
    /></MRow>
    <MText
      :text="
        t(
          'Every detail has a place. Find your way back without losing the thread.',
          'Cada detalhe tem seu lugar. Volte sem perder o fio da história.',
        )
      "
      tone="muted"
    />
    <MText id="breadcrumb-value" :text="destination" variant="caption" tone="muted" />
  </MCard>
</template>
