<script setup lang="ts">
import { useCatalogLocale } from '../locale'
import { computed, ref } from 'vue'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'

const { t, locale } = useCatalogLocale(() => props.lang)

const props = withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: undefined })

const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const { theme } = useMavisTheme()
const selected = ref('')
const saved = ref(false)
</script>

<template>
  <m-column gap="lg">
    <m-column padding="lg" gap="md" radius="lg" :backgroundColor="theme.colors.accentSoft">
      <m-text variant="overline" tone="accent">{{
        t(pt ? 'CADA LINHA, UMA HISTÓRIA' : 'A STORY IN EVERY ROW')
      }}</m-text>
      <m-text variant="title">{{
        t(pt ? 'Tudo encontra seu lugar.' : 'Everything in its place.')
      }}</m-text>
      <m-text tone="muted">{{
        t(pt ? 'Pessoas, ideias e próximos passos.' : 'People, ideas and next steps.')
      }}</m-text>
    </m-column>
    <m-card :padding="0">
      <m-list-item
        :title="t('Marina Costa')"
        :description="t('Design · São Paulo')"
        interactive
        :accessibilityLabel="
          t(pt ? 'Abrir Marina Costa, Design, disponível' : 'Open Marina Costa, Design, available')
        "
        @click="selected = 'Marina Costa'"
      >
        <template #leading><m-avatar name="Marina Costa" :accessibilityHidden="true" /></template>
        <template #trailing
          ><m-badge :text="t(pt ? 'Disponível' : 'Available')" tone="success" size="sm"
        /></template>
      </m-list-item>
      <m-separator inset="md" />
      <m-list-item
        :title="t(pt ? 'Biblioteca de ideias' : 'Idea library')"
        :description="t(pt ? 'Um lugar para o que inspira você.' : 'A home for what inspires you.')"
        interactive
        @click="selected = pt ? 'Biblioteca de ideias' : 'Idea library'"
      >
        <template #leading><m-icon name="book-open" tone="accent" /></template>
      </m-list-item>
      <m-separator inset="md" />
      <m-list-item
        :title="t(pt ? 'Arquivo da equipe' : 'Team archive')"
        :description="t(pt ? 'Disponível em breve.' : 'Coming soon.')"
        interactive
        disabled
        @click="selected = 'disabled'"
      >
        <template #leading><m-icon name="archive" tone="muted" /></template>
      </m-list-item>
    </m-card>
    <m-text id="list-selection" variant="caption" tone="muted">{{
      t(
        selected
          ? pt
            ? `Selecionado: ${selected}`
            : `Selected: ${selected}`
          : pt
            ? 'Escolha uma linha para continuar.'
            : 'Choose a row to continue.',
      )
    }}</m-text>
    <m-list-item
      :title="t(pt ? 'Guarde para depois' : 'Save for later')"
      :description="t(pt ? 'A ação fica no botão ao lado.' : 'The button owns this action.')"
    >
      <template #trailing>
        <m-button
          variant="ghost"
          size="sm"
          :icon="saved ? 'check' : 'bookmark'"
          :accessibilityLabel="
            t(
              saved
                ? pt
                  ? 'Remover favorito'
                  : 'Remove favorite'
                : pt
                  ? 'Favoritar'
                  : 'Add favorite',
            )
          "
          @click="saved = !saved"
        />
      </template>
    </m-list-item>
  </m-column>
</template>
