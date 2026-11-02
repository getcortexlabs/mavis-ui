<script setup lang="ts">
import { useCatalogLocale } from '../locale'
import { ref, onBeforeUnmount } from 'vue'

const { t } = useCatalogLocale()

withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: 'pt' })
const clicks = ref(0)
const loading = ref(false)
const saved = ref(false)
let timer: ReturnType<typeof setTimeout>
function save() {
  loading.value = true
  timer = setTimeout(() => {
    loading.value = false
    saved.value = true
  }, 900)
}
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <m-column gap="lg">
    <m-row gap="sm" wrap>
      <m-button @click="clicks++">{{ t('Primary') }}</m-button>
      <m-button variant="secondary" @click="clicks++">{{ t('Secondary') }}</m-button>
      <m-button variant="ghost" @click="clicks++">{{ t('Ghost') }}</m-button>
    </m-row>
    <m-text variant="caption" tone="muted"
      >{{ t(clicks) }}
      {{
        t(lang === 'pt' ? (clicks === 1 ? 'clique' : 'cliques') : clicks === 1 ? 'click' : 'clicks')
      }}</m-text
    >
    <m-row gap="sm" align="center" wrap>
      <m-button size="sm" variant="secondary">{{ t('Small') }}</m-button>
      <m-button size="md" variant="secondary">{{ t('Medium') }}</m-button>
      <m-button size="lg" variant="secondary">{{ t('Large') }}</m-button>
    </m-row>
    <m-row gap="sm" align="center" wrap>
      <m-button icon="plus">{{ t(lang === 'pt' ? 'Adicionar' : 'Add') }}</m-button>
      <m-button variant="secondary" trailingIcon="arrow-right">{{
        t(lang === 'pt' ? 'Avançar' : 'Next')
      }}</m-button>
      <m-button
        variant="ghost"
        icon="heart"
        :accessibilityLabel="t(lang === 'pt' ? 'Favoritar' : 'Favorite')"
      />
    </m-row>
    <m-row gap="sm" wrap>
      <m-button
        :loading="loading"
        :loadingText="t(lang === 'pt' ? 'Salvando…' : 'Saving…')"
        @click="save"
      >
        {{ t(saved ? (lang === 'pt' ? 'Salvo' : 'Saved') : lang === 'pt' ? 'Salvar' : 'Save') }}
      </m-button>
      <m-button disabled variant="secondary">{{
        t(lang === 'pt' ? 'Indisponível' : 'Unavailable')
      }}</m-button>
    </m-row>
  </m-column>
</template>
