<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const t = (en: string, pt: string) => ((props.lang ?? locale.value) === 'pt' ? pt : en)
const animated = ref(true)

import { mountains, coast } from '../atlas/photos'
const reverse = ref(false),
  query = ref(''),
  notes = ref<Record<string, string>>({})
const source = computed(() => [
  {
    id: 'horizon',
    title: t('Chasing the horizon', 'Em busca do horizonte'),
    image: mountains,
    height: 210,
  },
  {
    id: 'thought',
    title: t('Collect moments, not things.', 'Colecione momentos, não coisas.'),
    quote: true,
    height: 140,
  },
  {
    id: 'shore',
    title: t('Where the land exhales', 'Onde a terra respira'),
    image: coast,
    height: 290,
  },
  {
    id: 'note',
    title: t('A place for the unfinished', 'Um lugar para o inacabado'),
    note: true,
    height: 170,
  },
  {
    id: 'palette',
    title: t('The colors we carry', 'As cores que levamos'),
    palette: true,
    height: 100,
  },
  {
    id: 'small',
    title: t('Leave room for a surprise.', 'Deixe espaço para uma surpresa.'),
    quote: true,
    height: 100,
  },
])
const items = computed(() => {
  const rows = source.value.filter((x) => x.title.toLowerCase().includes(query.value.toLowerCase()))
  return reverse.value ? [...rows].reverse() : rows
})
const entry = (id: string) => source.value.find((x) => x.id === id)!
</script>
<template>
  <MColumn gap="lg">
    <MText text="THE FIELD GUIDE / 02" variant="overline" tone="primary" />
    <MText
      :text="t('A collection with its own rhythm.', 'Uma coleção com seu próprio ritmo.')"
      variant="title"
    />
    <MRow gap="sm" wrap
      ><MInput v-model="query" :label="t('Filter collection', 'Filtrar coleção')" /><MButton
        :text="t('Reverse collection', 'Inverter coleção')"
        variant="secondary"
        @click="reverse = !reverse"
    /></MRow>
    <MMasonry
      id="studio-masonry"
      :items="items"
      :columns="3"
      :minColumnWidth="210"
      :animated="animated"
      :label="t('Collected inspirations', 'Inspirações colecionadas')"
    >
      <template #item="{ item }"
        ><MCard :id="'masonry-' + item.id" padding="none"
          ><MColumn gap="none">
            <MImage
              v-if="entry(item.id).image"
              :src="entry(item.id).image!"
              :height="entry(item.id).height"
              :alt="entry(item.id).title"
            />
            <MBox v-if="entry(item.id).quote" padding="lg" :height="entry(item.id).height"
              ><MText :text="entry(item.id).title" variant="heading"
            /></MBox>
            <MColumn padding="md" gap="md"
              ><MText v-if="!entry(item.id).quote" :text="entry(item.id).title" variant="heading" />
              <MRow v-if="entry(item.id).palette" gap="xs"
                ><MBox
                  v-for="color in ['#809587', '#E6B68B', '#A48086', '#D7CEB9']"
                  :key="color"
                  :backgroundColor="color"
                  :width="36"
                  :height="70"
                  radius="sm"
              /></MRow>
              <MInput
                v-if="entry(item.id).note"
                v-model="notes[item.id]"
                :label="t('A thought to keep', 'Uma ideia para guardar')" />
              <MText
                :text="t('From the studio journal', 'Do caderno do estúdio')"
                variant="caption"
                tone="muted"
            /></MColumn> </MColumn></MCard
      ></template>
    </MMasonry>

    <MSwitch v-model="animated" :label="t('Animate changes', 'Animar mudanças')" />
  </MColumn>
</template>
