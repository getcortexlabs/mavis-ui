<script setup lang="ts">
import { useCatalogLocale } from '../locale'
import { computed, ref } from 'vue'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import type { ChoiceValue, TabOption } from '@getcortexlabs/mavis-core'

const { t, locale } = useCatalogLocale(() => props.lang)

const props = withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: undefined })

const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const { theme } = useMavisTheme()
const active = ref<ChoiceValue | null>('overview')
const tabs = computed<TabOption[]>(() => [
  { value: 'overview', label: pt.value ? 'Visão geral' : 'Overview' },
  { value: 'activity', label: pt.value ? 'Atividade' : 'Activity' },
  { value: 'favorites', label: pt.value ? 'Favoritos' : 'Favorites' },
  { value: 'soon', label: pt.value ? 'Em breve' : 'Coming soon', disabled: true },
])
</script>
<template>
  <m-column gap="lg">
    <m-column padding="lg" gap="md" radius="lg" :backgroundColor="theme.colors.accentSoft">
      <m-row justify="between" gap="sm"
        ><m-text variant="overline" tone="accent">{{
          t(pt ? 'SEU PEQUENO UNIVERSO' : 'YOUR LITTLE UNIVERSE')
        }}</m-text
        ><m-icon name="sparkles" tone="accent"
      /></m-row>
      <m-text variant="title">{{ t(pt ? 'Mude a perspectiva.' : 'A fresh perspective.') }}</m-text>
      <m-text tone="muted">{{
        t(
          pt
            ? 'Histórias, encontros e ideias. Cada coisa tem o seu lugar.'
            : 'Stories, encounters and ideas. Everything has its place.',
        )
      }}</m-text>
    </m-column>
    <m-tabs v-model="active" :tabs="tabs" :label="t(pt ? 'Seu espaço' : 'Your space')">
      <template #default="{ value }">
        <m-column v-if="value === 'overview'" gap="md">
          <m-card gap="md" :backgroundColor="theme.colors.primarySoft">
            <m-row justify="between" gap="sm"
              ><m-text variant="overline" tone="primary">{{
                t(pt ? 'ESTA SEMANA' : 'THIS WEEK')
              }}</m-text
              ><m-icon name="heart" tone="primary"
            /></m-row>
            <m-text variant="display" tone="primary">12</m-text>
            <m-text variant="heading">{{
              t(pt ? 'Ideias que ficaram.' : 'Ideas worth keeping.')
            }}</m-text>
            <m-text tone="muted">{{
              t(
                pt
                  ? 'Pequenas descobertas que merecem uma segunda visita.'
                  : 'Small discoveries that deserve a second look.',
              )
            }}</m-text>
          </m-card>
        </m-column>
        <m-column v-else-if="value === 'activity'" gap="md">
          <m-text variant="heading">{{
            t(pt ? 'Aconteceu por aqui.' : 'Around here lately.')
          }}</m-text>
          <m-card
            v-for="(label, index) in pt
              ? [
                  'Uma nova coleção começou.',
                  'Você guardou uma boa ideia.',
                  'Uma conversa virou inspiração.',
                ]
              : [
                  'A new collection began.',
                  'You saved a good idea.',
                  'A conversation became inspiration.',
                ]"
            :key="index"
            gap="sm"
          >
            <m-text variant="overline" tone="accent">0{{ t(index + 1) }}</m-text>
            <m-text>{{ t(label) }}</m-text>
          </m-card>
        </m-column>
        <m-card v-else gap="lg" :backgroundColor="theme.colors.accentSoft">
          <m-icon name="bookmark" tone="accent" size="lg" />
          <m-text variant="title">{{ t(pt ? 'Para voltar depois.' : 'For another day.') }}</m-text>
          <m-text tone="muted">{{
            t(
              pt
                ? 'Um lugar para as coisas que você quer ter por perto.'
                : 'A home for the things you want to keep close.',
            )
          }}</m-text>
        </m-card>
      </template>
    </m-tabs>
    <m-button variant="ghost" @click="active = 'overview'">{{
      t(pt ? 'Voltar à visão geral' : 'Back to overview')
    }}</m-button>
  </m-column>
</template>
