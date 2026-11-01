<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
const props = withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: 'pt' })
const pt = computed(() => props.lang === 'pt')
const { theme } = useMavisTheme()
const loading = ref(true)
const animated = ref(true)
</script>

<template>
  <m-column gap="lg">
    <m-column padding="lg" gap="md" radius="lg" :backgroundColor="theme.colors.accentSoft">
      <m-row justify="between" gap="sm">
        <m-text variant="overline" tone="accent">{{
          pt ? 'UMA PRÉVIA DO QUE VEM' : 'A GLIMPSE OF WHAT IS NEXT'
        }}</m-text>
        <m-icon name="book-open" tone="accent" />
      </m-row>
      <m-text variant="title">{{ pt ? 'O próximo capítulo.' : 'The next chapter.' }}</m-text>
      <m-text tone="muted">{{
        pt ? 'A espera também faz parte da experiência.' : 'Waiting is part of the experience, too.'
      }}</m-text>
    </m-column>
    <m-text variant="caption" tone="muted">{{
      loading
        ? pt
          ? 'Preparando sua leitura…'
          : 'Preparing your reading…'
        : pt
          ? 'Sua leitura está pronta.'
          : 'Your reading is ready.'
    }}</m-text>
    <m-card gap="lg">
      <m-column v-if="loading" gap="lg">
        <m-row gap="md">
          <m-skeleton :width="48" :height="48" radius="full" :shrink="0" :animated="animated" />
          <m-column :width="0" :grow="1" gap="sm">
            <m-skeleton width="70%" :animated="animated" />
            <m-skeleton width="45%" :height="12" :animated="animated" />
          </m-column>
        </m-row>
        <m-skeleton :height="152" radius="md" :animated="animated" />
        <m-column gap="sm">
          <m-skeleton width="85%" :height="24" :animated="animated" />
          <m-skeleton :animated="animated" />
          <m-skeleton width="65%" :animated="animated" />
        </m-column>
      </m-column>
      <m-column v-else gap="lg">
        <m-row gap="md">
          <m-column
            :width="48"
            :height="48"
            :shrink="0"
            radius="full"
            align="center"
            justify="center"
            :backgroundColor="theme.colors.primarySoft"
          >
            <m-icon name="sparkles" tone="primary" />
          </m-column>
          <m-column :width="0" :grow="1" gap="xs">
            <m-text variant="heading">Mavis Studio</m-text>
            <m-text variant="caption" tone="muted">{{
              pt ? '4 minutos de inspiração' : '4 minutes of inspiration'
            }}</m-text>
          </m-column>
        </m-row>
        <m-column
          :height="152"
          padding="lg"
          radius="md"
          justify="between"
          :backgroundColor="theme.colors.primarySoft"
        >
          <m-text variant="overline" tone="primary"
            >01 / {{ pt ? 'PERSPECTIVAS' : 'PERSPECTIVES' }}</m-text
          >
          <m-text variant="title" tone="primary">{{
            pt ? 'Menos ruído.\nMais espaço.' : 'Less noise.\nMore space.'
          }}</m-text>
        </m-column>
        <m-text variant="heading">{{
          pt ? 'Ideias precisam respirar.' : 'Ideas need room to breathe.'
        }}</m-text>
        <m-text tone="muted">{{
          pt
            ? 'Uma pausa, um novo olhar e espaço para descobrir o que importa.'
            : 'A pause, a fresh perspective and room to discover what matters.'
        }}</m-text>
      </m-column>
    </m-card>
    <m-button @click="loading = !loading">{{
      loading
        ? pt
          ? 'Mostrar conteúdo'
          : 'Show content'
        : pt
          ? 'Carregar novamente'
          : 'Load again'
    }}</m-button>
    <m-switch v-model="animated" :label="pt ? 'Animar placeholders' : 'Animate placeholders'" />
  </m-column>
</template>
