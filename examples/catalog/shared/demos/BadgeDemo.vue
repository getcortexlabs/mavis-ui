<script setup lang="ts">
import { useCatalogLocale } from '../locale'
import { computed, ref } from 'vue'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import type { BadgeTone } from '@getcortexlabs/mavis-core'

const { t, locale } = useCatalogLocale(() => props.lang)

const props = withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: undefined })

const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const { theme } = useMavisTheme()
const count = ref(3)
const tones: BadgeTone[] = ['neutral', 'primary', 'accent', 'success', 'warning', 'danger']
const labels = computed(() =>
  pt.value
    ? ['Rascunho', 'Destaque', 'Design', 'Publicado', 'Em revisão', 'Precisa de atenção']
    : ['Draft', 'Featured', 'Design', 'Published', 'In review', 'Needs attention'],
)
</script>

<template>
  <m-column gap="lg">
    <m-column padding="lg" gap="lg" radius="lg" :backgroundColor="theme.colors.primarySoft">
      <m-row justify="between" gap="sm">
        <m-text variant="overline" tone="primary">{{
          t(pt ? 'PEQUENOS SINAIS' : 'SMALL SIGNALS')
        }}</m-text>
        <m-badge :text="t(pt ? 'Novo' : 'New')" tone="primary" />
      </m-row>
      <m-text variant="title">{{ t(pt ? 'Cada detalhe conta.' : 'Every detail counts.') }}</m-text>
      <m-text tone="muted">{{
        t(
          pt
            ? 'Contexto, estado e prioridade. Em poucas palavras.'
            : 'Context, status and priority. In a few words.',
        )
      }}</m-text>
    </m-column>
    <m-card gap="lg">
      <m-text variant="overline" tone="muted">{{
        t(pt ? 'UMA PALETA DE SIGNIFICADOS' : 'A PALETTE OF MEANING')
      }}</m-text>
      <m-row gap="sm" wrap>
        <m-badge
          v-for="(tone, index) in tones"
          :key="tone"
          :tone="tone"
          :text="t(labels[index]!)"
        />
      </m-row>
    </m-card>
    <m-card gap="lg">
      <m-row gap="md">
        <m-avatar name="Mavis Studio" shape="square" />
        <m-column :width="0" :grow="1" gap="xs">
          <m-text variant="heading">{{ t('Mavis Studio') }}</m-text>
          <m-text variant="caption" tone="muted">{{
            t(pt ? 'Sua caixa de ideias' : 'Your idea inbox')
          }}</m-text>
        </m-column>
        <m-badge
          id="badge-count"
          :text="t(count)"
          tone="accent"
          :accessibilityLabel="t(pt ? `${count} ideias não lidas` : `${count} unread ideas`)"
        />
      </m-row>
      <m-row gap="sm" wrap>
        <m-button size="sm" variant="secondary" @click="count++">{{
          t(pt ? 'Nova ideia' : 'New idea')
        }}</m-button>
        <m-button size="sm" variant="ghost" @click="count = 0">{{
          t(pt ? 'Marcar como lidas' : 'Mark as read')
        }}</m-button>
      </m-row>
    </m-card>
    <m-row gap="md" wrap>
      <m-badge :text="t('Small')" size="sm" tone="primary" />
      <m-badge :text="t('Medium')" tone="primary" />
      <m-badge
        :text="t('99+')"
        size="sm"
        :accessibilityLabel="t(pt ? 'Mais de 99 mensagens' : 'More than 99 messages')"
      />
    </m-row>
  </m-column>
</template>
