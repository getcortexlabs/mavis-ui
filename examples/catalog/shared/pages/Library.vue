<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import type { ChoiceValue, IconName } from '@getcortexlabs/mavis-core'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { useCatalog } from '../context'
import ThemeSwitch from '../ThemeSwitch.vue'
import LibraryDownload from '../LibraryDownload.vue'

const { navigation } = useCatalog()
const { theme } = useMavisTheme()
const topics = [
  { id: 'design', label: 'Design', icon: 'palette' as IconName },
  { id: 'development', label: 'Desenvolvimento', icon: 'code' as IconName },
  { id: 'product', label: 'Produto', icon: 'lightbulb' as IconName },
]
const articles = [
  {
    id: 1,
    topic: 'design',
    title: 'O espaço também fala.',
    description: 'Ritmo e respiro em interfaces que convidam a ficar.',
    time: '6 MIN',
    number: '01',
    accent: false,
  },
  {
    id: 2,
    topic: 'development',
    title: 'Pequenos detalhes. Grande diferença.',
    description: 'Estados e interações que tornam um componente completo.',
    time: '8 MIN',
    number: '02',
    accent: true,
  },
  {
    id: 3,
    topic: 'product',
    title: 'Antes da próxima tela.',
    description: 'Encontre a pergunta certa antes de desenhar a resposta.',
    time: '4 MIN',
    number: '03',
    accent: false,
  },
]
const loading = ref(false)
let loadingTimer: ReturnType<typeof setTimeout> | undefined
function refresh() {
  if (loading.value) return
  loading.value = true
  loadingTimer = setTimeout(() => {
    loading.value = false
    loadingTimer = undefined
  }, 1500)
}
onBeforeUnmount(() => clearTimeout(loadingTimer))
const activeTab = ref<ChoiceValue | null>('explore')
const savedArticles = ref([1])
const tabs = computed(() => [
  { value: 'explore', label: 'Explorar' },
  { value: 'saved', label: `Salvos (${savedArticles.value.length})` },
])
function bookmark(id: number) {
  savedArticles.value = savedArticles.value.includes(id)
    ? savedArticles.value.filter((value) => value !== id)
    : [...savedArticles.value, id]
}
const query = ref('')
const search = computed(() => normalize(query.value.trim()))
function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}
function clearFilters() {
  query.value = ''
  toggleAll(true)
}
const selected = ref(['design', 'development'])
const all = computed(() => selected.value.length === topics.length)
const mixed = computed(() => selected.value.length > 0 && !all.value)
const visible = computed(() =>
  articles.filter((article) =>
    activeTab.value === 'saved'
      ? savedArticles.value.includes(article.id)
      : selected.value.includes(article.topic) &&
        normalize(`${article.title} ${article.description}`).includes(search.value),
  ),
)
function toggle(id: string, checked: boolean) {
  selected.value = checked
    ? [...selected.value, id]
    : selected.value.filter((value) => value !== id)
}
function toggleAll(checked: boolean) {
  selected.value = checked ? topics.map((topic) => topic.id) : []
}
</script>

<template>
  <m-screen scroll>
    <m-column padding="lg" gap="lg" class="showcase-container">
      <m-row justify="between" gap="sm">
        <m-button size="sm" variant="ghost" @click="navigation.back('/showcase')"
          >← Showcase</m-button
        >
        <ThemeSwitch />
      </m-row>
      <m-column gap="sm" paddingY="lg">
        <m-text variant="overline" tone="primary">MAVIS / BIBLIOTECA</m-text>
        <m-text as="h1" variant="display">Boas ideias. Por perto.</m-text>
        <m-text tone="muted"
          >Um lugar para alimentar a curiosidade. Comece pelo que move você.</m-text
        >
      </m-column>
      <LibraryDownload @open="activeTab = 'saved'" />
      <m-button variant="secondary" icon="refresh-cw" :disabled="loading" @click="refresh"
        >Atualizar coleção</m-button
      >
      <m-tabs v-model="activeTab" :tabs="tabs" label="Biblioteca">
        <template #default="{ value }">
          <m-column gap="lg">
            <m-card v-if="value === 'explore'" gap="md">
              <m-row justify="between" gap="md">
                <m-text as="h2" variant="heading">Seus assuntos</m-text>
                <m-icon name="sliders-horizontal" tone="primary" />
              </m-row>
              <m-checkbox
                :modelValue="all"
                :indeterminate="mixed"
                label="Todos os assuntos"
                indeterminateLabel="Seleção parcial"
                :helperText="`${selected.length} de 3 selecionados`"
                @update:modelValue="toggleAll"
              />
              <m-box :height="1" :backgroundColor="theme.colors.border" />
              <m-row gap="sm" wrap>
                <m-chip
                  v-for="topic in topics"
                  :key="topic.id"
                  :label="topic.label"
                  :icon="topic.icon"
                  selectable
                  :modelValue="selected.includes(topic.id)"
                  @update:modelValue="toggle(topic.id, $event)"
                />
              </m-row>
              <m-input
                v-model="query"
                label="Buscar leituras"
                placeholder="Uma ideia, uma palavra…"
              />
            </m-card>
            <m-row justify="between" gap="md">
              <m-text as="h2" variant="heading">{{
                value === 'saved' ? 'Para ler com calma' : 'Para explorar'
              }}</m-text>
              <m-text variant="caption" tone="muted">{{ visible.length }} de 3</m-text>
            </m-row>
            <m-column v-if="loading" gap="lg">
              <m-text tone="muted">Buscando novas leituras…</m-text>
              <m-card v-for="n in 2" :key="n">
                <m-column gap="lg">
                  <m-row gap="md">
                    <m-skeleton :width="48" :height="48" radius="full" :shrink="0" />
                    <m-column :width="0" :grow="1" gap="sm">
                      <m-skeleton width="70%" />
                      <m-skeleton width="45%" :height="12" />
                    </m-column>
                  </m-row>
                  <m-skeleton :height="28" width="85%" />
                  <m-skeleton />
                  <m-skeleton width="65%" />
                </m-column>
              </m-card>
            </m-column>
            <template v-else>
              <m-column
                v-for="article in visible"
                :key="article.id"
                padding="lg"
                gap="lg"
                radius="lg"
                :backgroundColor="
                  article.accent ? theme.colors.accentSoft : theme.colors.primarySoft
                "
              >
                <m-row justify="between" gap="md">
                  <m-text variant="display" :tone="article.accent ? 'accent' : 'primary'">{{
                    article.number
                  }}</m-text>
                  <m-column gap="xs" align="end">
                    <m-text variant="overline" :tone="article.accent ? 'accent' : 'primary'">{{
                      topics.find((topic) => topic.id === article.topic)?.label
                    }}</m-text>
                    <m-text variant="caption" tone="muted">{{ article.time }}</m-text>
                  </m-column>
                </m-row>
                <m-column gap="sm">
                  <m-text as="h3" variant="title">{{ article.title }}</m-text>
                  <m-text tone="muted">{{ article.description }}</m-text>
                </m-column>
                <m-button
                  variant="ghost"
                  :icon="savedArticles.includes(article.id) ? 'check' : 'bookmark'"
                  @click="bookmark(article.id)"
                  >{{
                    savedArticles.includes(article.id) ? 'Remover dos salvos' : 'Salvar leitura'
                  }}</m-button
                >
              </m-column>
              <m-card v-if="!visible.length" padding="none">
                <m-empty-state
                  :title="
                    value === 'saved'
                      ? 'Guarde uma boa ideia.'
                      : search
                        ? 'Nenhuma ideia por aqui.'
                        : 'Uma página em branco.'
                  "
                  :description="
                    value === 'saved'
                      ? 'Salve uma leitura em Explorar para encontrá-la aqui.'
                      : search
                        ? 'Tente outra palavra ou abra espaço para todos os assuntos.'
                        : 'Selecione um assunto para encontrar novas ideias.'
                  "
                  :icon="value === 'saved' ? 'bookmark' : search ? 'search' : 'book-open'"
                  :tone="value === 'saved' ? 'primary' : 'accent'"
                >
                  <template #actions>
                    <m-button
                      v-if="value === 'saved'"
                      variant="secondary"
                      @click="activeTab = 'explore'"
                      >Explorar leituras</m-button
                    >
                    <m-button v-else variant="secondary" @click="clearFilters">{{
                      search ? 'Limpar filtros' : 'Mostrar todos'
                    }}</m-button>
                  </template>
                </m-empty-state>
              </m-card>
            </template>
          </m-column>
        </template>
      </m-tabs>
      <m-text variant="caption" tone="muted" align="center"
        >Coleção demonstrativa, com carregamento simulado. Os filtros e salvos são locais e
        reiniciam ao sair da tela.</m-text
      >
    </m-column>
  </m-screen>
</template>
