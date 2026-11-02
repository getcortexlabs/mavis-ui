<script setup lang="ts">
import { useCatalogLocale } from '../locale'
import { computed, ref } from 'vue'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'

const { t, locale } = useCatalogLocale(() => props.lang)

const props = withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: undefined })

const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const { theme } = useMavisTheme()
const design = ref(true)
const code = ref(false)
const count = computed(() => Number(design.value) + Number(code.value))
const tags = ref(['Vue', 'NativeScript', 'Web'])
</script>
<template>
  <m-column gap="lg">
    <m-column padding="lg" gap="lg" radius="lg" :backgroundColor="theme.colors.primarySoft">
      <m-text variant="overline" tone="primary">{{
        t(pt ? 'SIGA SUA CURIOSIDADE' : 'FOLLOW YOUR CURIOSITY')
      }}</m-text>
      <m-text variant="title">{{ t(pt ? 'O que move você?' : 'What moves you?') }}</m-text>
      <m-text tone="muted">{{
        t(
          pt
            ? 'Escolha os assuntos que merecem um lugar no seu dia.'
            : 'Make room for the subjects that brighten your day.',
        )
      }}</m-text>
      <m-row gap="sm" wrap>
        <m-chip v-model="design" selectable :label="t('Design')" icon="palette" />
        <m-chip
          v-model="code"
          selectable
          :label="t(pt ? 'Código' : 'Code')"
          icon="code"
          tone="accent"
        />
      </m-row>
      <m-text variant="caption" tone="muted">{{
        t(
          pt
            ? `${count} ${count === 1 ? 'assunto selecionado' : 'assuntos selecionados'}`
            : `${count} ${count === 1 ? 'topic' : 'topics'} selected`,
        )
      }}</m-text>
    </m-column>
    <m-card gap="md">
      <m-text variant="overline" tone="muted">{{
        t(pt ? 'SUA CAIXA DE FERRAMENTAS' : 'YOUR TOOLBOX')
      }}</m-text>
      <m-row gap="sm" wrap>
        <m-chip
          v-for="tag in tags"
          :key="tag"
          :label="t(tag)"
          removable
          :removeLabel="pt ? `Remover ${tag}` : `Remove ${tag}`"
          @remove="tags = tags.filter((value) => value !== tag)"
        />
      </m-row>
      <m-text v-if="!tags.length" tone="muted">{{
        t(pt ? 'Espaço para novas ideias.' : 'Room for new ideas.')
      }}</m-text>
      <m-button variant="ghost" size="sm" @click="tags = ['Vue', 'NativeScript', 'Web']">{{
        t(pt ? 'Restaurar tags' : 'Restore tags')
      }}</m-button>
    </m-card>
    <m-card gap="md">
      <m-text variant="overline" tone="muted">{{
        t(pt ? 'DETALHES QUE CONTAM' : 'DETAILS THAT MATTER')
      }}</m-text>
      <m-row gap="sm" wrap>
        <m-chip :label="t('Editorial')" icon="book-open" />
        <m-chip
          :label="t(pt ? 'Em breve' : 'Coming soon')"
          selectable
          :modelValue="true"
          disabled
          tone="accent"
        />
      </m-row>
    </m-card>
  </m-column>
</template>
