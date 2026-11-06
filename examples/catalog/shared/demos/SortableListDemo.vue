<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const t = (en: string, br: string) => (pt.value ? br : en)
const entries = [
  { id: 'morning', title: 'Morning light', artist: 'Luna Park', time: '3:42' },
  { id: 'coast', title: 'Coast to coast', artist: 'The Other Side', time: '4:18' },
  { id: 'blue', title: 'Blue hour', artist: 'Nocturne', time: '2:56' },
  { id: 'home', title: 'The way home', artist: 'Sunday Club', time: '5:07' },
]
const tracks = ref([...entries])
const disabled = ref(false)
</script>
<template>
  <MCard padding="lg" gap="md">
    <MRow justify="between" align="center"
      ><MColumn gap="xs"
        ><MText text="SIDE A" variant="overline" tone="primary" /><MText
          :text="t('A slower kind of Sunday.', 'Um domingo sem pressa.')"
          variant="title" /></MColumn
      ><MIcon name="headphones" :size="32" tone="primary"
    /></MRow>
    <MText
      :text="t('Set the mood. Change the order.', 'Encontre o clima. Mude a ordem.')"
      tone="muted"
    />
    <MSortableList
      v-model="tracks"
      :label="t('Sunday playlist', 'Playlist de domingo')"
      :itemLabel="(item) => item.title"
      :height="420"
      :disabled="disabled"
      :handleLabel="t('Reorder', 'Reordenar')"
      :moveUpLabel="t('Move up', 'Mover para cima')"
      :moveDownLabel="t('Move down', 'Mover para baixo')"
    >
      <template #default="{ item, index }"
        ><MRow gap="md" align="center"
          ><MText
            :text="String(index + 1).padStart(2, '0')"
            variant="overline"
            tone="muted" /><MColumn :grow="1" gap="xs"
            ><MText :text="item.title" weight="600" /><MText
              :text="`${item.artist} · ${item.time}`"
              variant="caption"
              tone="muted" /></MColumn></MRow
      ></template>
    </MSortableList>
    <MRow gap="sm" wrap
      ><MButton
        :text="t('Reverse playlist', 'Inverter playlist')"
        variant="secondary"
        @click="tracks = [...tracks].reverse()" /><MButton
        :text="disabled ? t('Unlock', 'Desbloquear') : t('Lock order', 'Travar ordem')"
        variant="ghost"
        @click="disabled = !disabled"
    /></MRow>
    <MText
      id="sort-order"
      :text="tracks.map((item) => item.id).join(',')"
      variant="caption"
      tone="muted"
    />
  </MCard>
</template>
