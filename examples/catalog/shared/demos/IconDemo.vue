<script setup lang="ts">
import { useCatalogLocale } from '../locale'
import { computed } from 'vue'

const { t, locale } = useCatalogLocale(() => props.lang)

const props = withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: undefined })

const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const names = ['search', 'heart', 'bell', 'settings', 'camera', 'map-pin', 'sun', 'moon'] as const
</script>

<template>
  <m-column gap="lg">
    <m-row gap="md" wrap>
      <m-icon
        v-for="name in names"
        :key="name"
        :name="name"
        size="lg"
        tone="primary"
        :label="t(name)"
      />
    </m-row>
    <m-row gap="sm" align="center">
      <m-icon name="search" tone="muted" />
      <m-text>{{ t(pt ? 'Buscar' : 'Search') }}</m-text>
    </m-row>
    <m-row gap="md" align="center">
      <m-icon name="star" size="sm" tone="accent" />
      <m-icon name="star" tone="accent" />
      <m-icon name="star" size="lg" tone="accent" />
      <m-icon name="star" :size="32" tone="accent" />
      <m-text variant="caption" tone="muted">{{ t('sm · md · lg · 32') }}</m-text>
    </m-row>
    <m-card padding="md" gap="sm">
      <m-row gap="sm" align="center">
        <m-icon name="circle-check" tone="success" :label="t(pt ? 'Concluído' : 'Done')" />
        <m-text>{{ t(pt ? 'Sessão salva.' : 'Session saved.') }}</m-text>
      </m-row>
      <m-row gap="sm" align="center">
        <m-icon name="triangle-alert" tone="danger" :label="t(pt ? 'Atenção' : 'Warning')" />
        <m-text>{{ t(pt ? 'Confira o e-mail.' : 'Check the email.') }}</m-text>
      </m-row>
      <m-row gap="sm" align="center">
        <m-icon name="info" tone="muted" />
        <m-text variant="caption" tone="muted">{{
          t(pt ? 'Sem label, o ícone é decorativo.' : 'Without a label, the icon is decorative.')
        }}</m-text>
      </m-row>
    </m-card>
  </m-column>
</template>
