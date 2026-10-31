<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: 'pt' })
const { theme } = useMavisTheme()
const topics = [
  { id: 'design', pt: 'Design de interfaces', en: 'Interface design' },
  { id: 'development', pt: 'Desenvolvimento', en: 'Development' },
  { id: 'product', pt: 'Produto e pesquisa', en: 'Product and research' },
]
const selected = ref(['design'])
const all = computed(() => selected.value.length === topics.length)
const mixed = computed(() => selected.value.length > 0 && !all.value)
const changes = ref(0)
function toggle(id: string, checked: boolean) {
  selected.value = checked
    ? [...selected.value, id]
    : selected.value.filter((value) => value !== id)
  changes.value++
}
function toggleAll(checked: boolean) {
  selected.value = checked ? topics.map((topic) => topic.id) : []
  changes.value++
}
</script>

<template>
  <m-column gap="lg">
    <m-column padding="lg" gap="sm" radius="lg" :backgroundColor="theme.colors.accentSoft">
      <m-text variant="overline" tone="accent">{{
        lang === 'pt' ? 'SUA SELEÇÃO' : 'YOUR SELECTION'
      }}</m-text>
      <m-text variant="heading">{{
        lang === 'pt' ? 'Ideias que combinam.' : 'Ideas that fit.'
      }}</m-text>
      <m-text variant="caption" tone="muted">{{
        lang === 'pt'
          ? 'Escolha os assuntos que despertam sua curiosidade.'
          : 'Choose the topics that spark your curiosity.'
      }}</m-text>
    </m-column>
    <m-column gap="sm">
      <m-checkbox
        id="all-topics"
        :modelValue="all"
        :indeterminate="mixed"
        :label="lang === 'pt' ? 'Todos os assuntos' : 'All topics'"
        :helperText="
          lang === 'pt'
            ? `${selected.length} de 3 selecionados`
            : `${selected.length} of 3 selected`
        "
        :indeterminateLabel="lang === 'pt' ? 'Seleção parcial' : 'Partially selected'"
        @update:modelValue="toggleAll"
      />
      <m-box :height="1" :backgroundColor="theme.colors.border" />
      <m-checkbox
        v-for="topic in topics"
        :key="topic.id"
        :id="topic.id"
        :modelValue="selected.includes(topic.id)"
        :label="lang === 'pt' ? topic.pt : topic.en"
        @update:modelValue="toggle(topic.id, $event)"
      />
      <m-box :height="1" :backgroundColor="theme.colors.border" />
      <m-checkbox
        :modelValue="true"
        disabled
        :label="lang === 'pt' ? 'Conteúdo da equipe' : 'Team content'"
        :helperText="
          lang === 'pt' ? 'Incluído pela sua organização.' : 'Included by your organization.'
        "
      />
      <m-checkbox disabled :label="lang === 'pt' ? 'Conteúdo arquivado' : 'Archived content'" />
      <m-checkbox
        indeterminate
        disabled
        :label="lang === 'pt' ? 'Coleção compartilhada' : 'Shared collection'"
        :indeterminateLabel="lang === 'pt' ? 'Seleção parcial' : 'Partially selected'"
      />
    </m-column>
    <m-row justify="between" gap="sm" wrap>
      <m-text variant="caption" tone="muted">{{
        lang === 'pt'
          ? `${changes} ${changes === 1 ? 'alteração' : 'alterações'}`
          : `${changes} ${changes === 1 ? 'change' : 'changes'}`
      }}</m-text>
      <m-button size="sm" variant="ghost" @click="selected = ['design']">{{
        lang === 'pt' ? 'Restaurar' : 'Reset'
      }}</m-button>
    </m-row>
  </m-column>
</template>
