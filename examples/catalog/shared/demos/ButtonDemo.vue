<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'

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
      <m-button @click="clicks++">Primary</m-button>
      <m-button variant="secondary" @click="clicks++">Secondary</m-button>
      <m-button variant="ghost" @click="clicks++">Ghost</m-button>
    </m-row>
    <m-text variant="caption" tone="muted"
      >{{ clicks }}
      {{
        lang === 'pt' ? (clicks === 1 ? 'clique' : 'cliques') : clicks === 1 ? 'click' : 'clicks'
      }}</m-text
    >
    <m-row gap="sm" align="center" wrap>
      <m-button size="sm" variant="secondary">Small</m-button>
      <m-button size="md" variant="secondary">Medium</m-button>
      <m-button size="lg" variant="secondary">Large</m-button>
    </m-row>
    <m-row gap="sm" align="center" wrap>
      <m-button icon="plus">{{ lang === 'pt' ? 'Adicionar' : 'Add' }}</m-button>
      <m-button variant="secondary" trailingIcon="arrow-right">{{
        lang === 'pt' ? 'Avançar' : 'Next'
      }}</m-button>
      <m-button
        variant="ghost"
        icon="heart"
        :accessibilityLabel="lang === 'pt' ? 'Favoritar' : 'Favorite'"
      />
    </m-row>
    <m-row gap="sm" wrap>
      <m-button
        :loading="loading"
        :loadingText="lang === 'pt' ? 'Salvando…' : 'Saving…'"
        @click="save"
      >
        {{ saved ? (lang === 'pt' ? 'Salvo' : 'Saved') : lang === 'pt' ? 'Salvar' : 'Save' }}
      </m-button>
      <m-button disabled variant="secondary">{{
        lang === 'pt' ? 'Indisponível' : 'Unavailable'
      }}</m-button>
    </m-row>
  </m-column>
</template>
