<script setup lang="ts">
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'
import { mountains, coast, lake } from '../atlas/photos'
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
const { theme } = useMavisTheme()
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const t = (en: string, pt: string) => ((props.lang ?? locale.value) === 'pt' ? pt : en)
const query = ref('')
const submitted = ref('')
function cancel() {
  query.value = ''
  submitted.value = ''
}
const archive = computed(() => [
  {
    id: 'shore',
    photo: coast,
    title: t('Atlantic tides', 'Marés do Atlântico'),
    place: t('Atlantic coast', 'Costa atlântica'),
  },
  {
    id: 'ridge',
    photo: mountains,
    title: t('First light on the ridge', 'Primeira luz na serra'),
    place: t('Alpine peaks', 'Picos alpinos'),
  },
  {
    id: 'lake',
    photo: lake,
    title: t('The still lake', 'O lago sereno'),
    place: t('Alpine lakes', 'Lagos alpinos'),
  },
])
const normalize = (v: string) =>
  v
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
const matches = computed(() =>
  archive.value.filter((row) =>
    normalize(row.title + ' ' + row.place).includes(normalize(query.value)),
  ),
)
</script>
<template>
  <MColumn id="search-bar-preview" :backgroundColor="theme.colors.background" gap="lg">
    <MText variant="title" :text="t('Photo archive', 'Arquivo fotográfico')" />
    <MSearchBar
      v-model="query"
      :label="t('Find a photo', 'Buscar uma foto')"
      :placeholder="t('Title or location', 'Título ou lugar')"
      :showCancel="Boolean(query)"
      :clearLabel="t('Clear search', 'Limpar busca')"
      :cancelLabel="t('Cancel', 'Cancelar')"
      @submit="submitted = $event"
      @clear="submitted = ''"
      @cancel="cancel"
    />
    <MText
      v-if="submitted && submitted === query"
      variant="caption"
      tone="muted"
      :text="t('Results for ', 'Resultados para ') + '“' + submitted + '”'"
    />
    <MColumn gap="md">
      <MRow v-for="entry in matches" :key="entry.id" align="center" gap="md">
        <MImage :src="entry.photo" :height="76" :width="100" fit="cover" radius="md" alt="" />
        <MColumn :width="0" :grow="1" gap="xs"
          ><MText variant="heading" :text="entry.title" /><MText
            variant="caption"
            tone="muted"
            :text="entry.place"
        /></MColumn>
      </MRow>
      <MText
        v-if="!matches.length"
        :text="t('No photographs match this search.', 'Nenhuma foto corresponde à busca.')"
      />
    </MColumn>
  </MColumn>
</template>
