<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ChoiceValue, ViewerImage } from '@getcortexlabs/mavis-core'
import { mountains, lake, coast } from '../atlas/photos'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const t = (en: string, br: string) => (pt.value ? br : en)
const current = ref<ChoiceValue>('mountains')
const open = ref(false)
const images = computed<ViewerImage[]>(() => [
  {
    key: 'mountains',
    src: mountains,
    alt: t('Above the clouds', 'Acima das nuvens'),
    caption: t('Leave a little room for wonder.', 'Deixe espaço para se surpreender.'),
  },
  {
    key: 'lake',
    src: lake,
    alt: t('Still waters', 'Águas tranquilas'),
    caption: t('Some places ask you to slow down.', 'Alguns lugares pedem calma.'),
  },
  {
    key: 'coast',
    src: coast,
    alt: t('The long way home', 'O caminho mais bonito'),
    caption: t('Follow the coastline a little further.', 'Siga o litoral um pouco mais.'),
  },
])
</script>
<template>
  <MColumn gap="lg">
    <MRow justify="between" align="center" wrap gap="md"
      ><MColumn gap="xs"
        ><MText text="POSTCARDS / VOL. 01" variant="overline" tone="primary" /><MText
          :text="t('A little further.', 'Um pouco mais longe.')"
          variant="title" /></MColumn
      ><MBadge :text="t('3 moments', '3 momentos')"
    /></MRow>
    <MText
      :text="
        t(
          'Open a photograph. Look closer. Find your way back.',
          'Abra uma fotografia. Veja de perto. Encontre o caminho de volta.',
        )
      "
      tone="muted"
    />
    <MImageViewer
      v-model="current"
      v-model:open="open"
      :images="images"
      :label="t('Postcards', 'Cartões-postais')"
      :closeLabel="t('Close viewer', 'Fechar galeria')"
      :previousLabel="t('Previous image', 'Imagem anterior')"
      :nextLabel="t('Next image', 'Próxima imagem')"
      :zoomInLabel="t('Zoom in', 'Ampliar')"
      :zoomOutLabel="t('Zoom out', 'Reduzir')"
      :resetLabel="t('Reset zoom', 'Restaurar zoom')"
      :errorLabel="t('Image unavailable', 'Imagem indisponível')"
    />
    <MText id="viewer-value" :text="`${current}:${open}`" variant="caption" tone="muted" />
  </MColumn>
</template>
