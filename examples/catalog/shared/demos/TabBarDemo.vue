<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const t = (en: string, br: string) => (pt.value ? br : en)
import type { NavigationItem } from '@getcortexlabs/mavis-core'
const current = ref('home')
const items = computed<NavigationItem[]>(() => [
  {
    value: 'home',
    label: t('Home', 'Início'),
    href: '/home',
    icon: 'house',
    navigate: async () => {
      current.value = 'home'
    },
  },
  {
    value: 'saved',
    label: t('Saved', 'Salvos'),
    href: '/saved',
    icon: 'bookmark',
    badge: 3,
    navigate: async () => {
      current.value = 'saved'
    },
  },
  {
    value: 'profile',
    label: t('Profile', 'Perfil'),
    href: '/profile',
    icon: 'user',
    navigate: async () => {
      current.value = 'profile'
    },
  },
])
</script>

<template>
  <MColumn gap="md">
    <MText
      :text="
        t('A destination for every part of your day.', 'Um destino para cada parte do seu dia.')
      "
    />
    <MTabBar
      :modelValue="current"
      :items="items"
      :label="t('Main navigation', 'Navegação principal')"
      :currentLabel="t('Current page', 'Página atual')"
    />
    <MText id="tab-bar-current" :text="current" tone="muted" />
  </MColumn>
</template>
