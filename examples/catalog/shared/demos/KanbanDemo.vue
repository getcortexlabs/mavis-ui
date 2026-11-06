<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const t = (en: string, br: string) => ((props.lang ?? locale.value) === 'pt' ? br : en)
import type { KanbanCard } from '@getcortexlabs/mavis-core'
const query = ref(''),
  animated = ref(true),
  disabled = ref(false)
const columns = computed(() => [
  { id: 'ideas', title: t('Ideas', 'Ideias') },
  { id: 'making', title: t('Making', 'Em criação'), limit: 2 },
  { id: 'done', title: t('Published', 'Publicado') },
])
const cards = ref<KanbanCard[]>([
  {
    id: 'identity',
    column: 'ideas',
    title: 'Botanical identity',
    description: 'A living visual language for the next chapter.',
  },
  {
    id: 'editorial',
    column: 'ideas',
    title: 'Field notes',
    description: 'Stories collected along the way.',
  },
  {
    id: 'web',
    column: 'making',
    title: 'Studio website',
    description: 'Room for the work to breathe.',
  },
  {
    id: 'print',
    column: 'done',
    title: 'Spring edition',
    description: 'Printed, folded, ready for the world.',
  },
])
const lastMove = ref('')
function reverse() {
  cards.value = [...cards.value].reverse()
}
</script>
<template>
  <MColumn gap="lg">
    <MText text="FORMA STUDIO / WORK IN PROGRESS" variant="overline" tone="primary" />
    <MText
      :text="t('Good ideas deserve room to grow.', 'Boas ideias merecem espaço para crescer.')"
      variant="title"
    />
    <MInput v-model="query" :label="t('Filter projects', 'Filtrar projetos')" />
    <MKanban
      id="studio-kanban"
      v-model="cards"
      :columns="columns"
      :query="query"
      :animated="animated"
      :disabled="disabled"
      :label="t('The studio board', 'O quadro do estúdio')"
      :moveLabel="t('Move card', 'Mover cartão')"
      :upLabel="t('Move up', 'Mover para cima')"
      :downLabel="t('Move down', 'Mover para baixo')"
      :emptyLabel="t('An open possibility.', 'Uma possibilidade em aberto.')"
      :fullLabel="t('At capacity', 'No limite')"
      @move="lastMove = $event.id + ':' + $event.to"
    />
    <MRow gap="md" wrap
      ><MSwitch v-model="animated" :label="t('Animate layout', 'Animar layout')" /><MSwitch
        v-model="disabled"
        :label="t('Lock board', 'Travar quadro')" /><MButton
        :text="t('Reverse order', 'Inverter ordem')"
        variant="secondary"
        @click="reverse"
    /></MRow>
    <MText
      id="kanban-order"
      :text="cards.map((c) => c.id + ':' + c.column).join(',')"
      variant="caption"
      tone="muted"
    />
    <MText id="kanban-result" :text="lastMove" variant="caption" />
  </MColumn>
</template>
