<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
import type { NavigationGroup, ChoiceValue } from '@getcortexlabs/mavis-core'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const t = (en: string, br: string) => ((props.lang ?? locale.value) === 'pt' ? br : en)
const current = ref<ChoiceValue>('overview')
const collapsed = ref(false)
const groups = computed<NavigationGroup[]>(() => [
  {
    key: 'workspace',
    label: t('Workspace', 'Seu espaço'),
    items: [
      {
        value: 'overview',
        label: t('Overview', 'Visão geral'),
        href: '/overview',
        icon: 'layout-dashboard',
        navigate: () => {
          current.value = 'overview'
        },
      },
      {
        value: 'projects',
        label: t('Projects', 'Projetos'),
        href: '/projects',
        icon: 'layers',
        badge: 8,
        navigate: () => {
          current.value = 'projects'
        },
      },
      {
        value: 'insights',
        label: t('Insights', 'Análises'),
        href: '/insights',
        icon: 'chart-no-axes-combined',
        navigate: () => {
          current.value = 'insights'
        },
      },
    ],
  },
  {
    key: 'people',
    label: t('Together', 'Em companhia'),
    items: [
      {
        value: 'team',
        label: t('Team', 'Equipe'),
        href: '/team',
        icon: 'users',
        badge: 4,
        navigate: () => {
          current.value = 'team'
        },
      },
      {
        value: 'settings',
        label: t('Settings', 'Preferências'),
        href: '/settings',
        icon: 'settings-2',
        navigate: () => {
          current.value = 'settings'
        },
      },
    ],
  },
])
</script>

<template>
  <MNavigationRail
    v-model:collapsed="collapsed"
    :modelValue="current"
    :groups="groups"
    :label="t('Studio navigation', 'Navegação do estúdio')"
    :collapseLabel="t('Collapse navigation', 'Recolher navegação')"
    :expandLabel="t('Expand navigation', 'Expandir navegação')"
  >
    <template #header="{ collapsed: compact }"
      ><MRow padding="sm" gap="sm" justify="center"
        ><MIcon name="orbit" :size="28" tone="primary" /><MText
          v-if="!compact"
          text="Orbit"
          variant="heading" /></MRow
    ></template>
    <template #footer="{ collapsed: compact }"
      ><MRow padding="sm" gap="sm" justify="center"
        ><MAvatar name="Alex Morgan" size="sm" /><MText
          v-if="!compact"
          text="Alex Morgan"
          variant="caption" /></MRow
    ></template>
  </MNavigationRail>
  <MText id="rail-value" :text="String(current)" variant="caption" tone="muted" />
</template>
