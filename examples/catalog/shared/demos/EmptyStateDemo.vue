<script setup lang="ts">
import { useCatalogLocale } from '../locale'
import { computed, ref } from 'vue'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'

const { t, locale } = useCatalogLocale(() => props.lang)

const props = withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: undefined })

const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const { theme } = useMavisTheme()
const created = ref(false)
</script>
<template>
  <m-column gap="lg">
    <m-column padding="lg" gap="sm" radius="lg" :backgroundColor="theme.colors.accentSoft">
      <m-text variant="overline" tone="accent">{{
        t(pt ? 'TODO COMEÇO TEM ESPAÇO' : 'ROOM FOR A BEGINNING')
      }}</m-text>
      <m-text variant="title">{{
        t(pt ? 'A próxima ideia é sua.' : 'Your next idea starts here.')
      }}</m-text>
    </m-column>
    <m-card padding="none">
      <m-empty-state
        v-if="!created"
        :title="t(pt ? 'Uma coleção à sua espera.' : 'A collection waiting for you.')"
        :description="
          t(
            pt
              ? 'Guarde referências, descobertas e tudo o que vale uma segunda olhada.'
              : 'Keep references, discoveries and everything worth a second look.',
          )
        "
        icon="bookmark"
        tone="accent"
      >
        <template #actions
          ><m-button icon="plus" @click="created = true">{{
            t(pt ? 'Criar coleção' : 'Create collection')
          }}</m-button></template
        >
      </m-empty-state>
      <m-column v-else padding="lg" gap="md">
        <m-icon name="check" tone="accent" size="lg" />
        <m-text variant="heading">{{
          t(pt ? 'Primeira coleção criada.' : 'First collection created.')
        }}</m-text>
        <m-button variant="ghost" @click="created = false">{{
          t(pt ? 'Recomeçar' : 'Start again')
        }}</m-button>
      </m-column>
    </m-card>
    <m-card padding="none">
      <m-empty-state
        compact
        :title="t(pt ? 'Nenhum resultado por enquanto.' : 'No results yet.')"
        :description="
          t(
            pt
              ? 'Uma palavra diferente pode abrir novos caminhos.'
              : 'A different word can open new paths.',
          )
        "
        icon="search"
      />
    </m-card>
    <m-empty-state
      compact
      :title="t(pt ? 'Seu próximo capítulo.' : 'Your next chapter.')"
      :description="
        t(
          pt
            ? 'Uma ilustração própria também pode contar essa história.'
            : 'Your own illustration can tell this story too.',
        )
      "
    >
      <template #illustration>
        <m-row gap="sm" align="end">
          <m-box :width="28" :height="48" radius="sm" :backgroundColor="theme.colors.primarySoft" />
          <m-box :width="28" :height="64" radius="sm" :backgroundColor="theme.colors.primary" />
          <m-box :width="28" :height="40" radius="sm" :backgroundColor="theme.colors.accent" />
        </m-row>
      </template>
    </m-empty-state>
  </m-column>
</template>
