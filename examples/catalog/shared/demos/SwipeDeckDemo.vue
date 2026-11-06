<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const t = (en: string, br: string) => (pt.value ? br : en)
import type { ChoiceValue, SwipeCard, SwipeDecision } from '@getcortexlabs/mavis-core'
const current = ref<ChoiceValue | null>('forest'),
  animated = ref(true)
const history = ref<{ item: SwipeCard; decision: SwipeDecision }[]>([])
const cards = computed(() => [
  {
    id: 'forest',
    title: t('A morning among trees.', 'Uma manhã entre árvores.'),
    description: t(
      'Leave the noise behind. Find a little more green.',
      'Deixe o ruído para trás. Encontre um pouco mais de verde.',
    ),
  },
  {
    id: 'coast',
    title: t('Follow the coastline.', 'Siga a costa.'),
    description: t(
      'Salt in the air. No plans until sunset.',
      'Sal no ar. Sem planos até o pôr do sol.',
    ),
  },
  {
    id: 'city',
    title: t('Get beautifully lost.', 'Perca-se por aí.'),
    description: t(
      'One unfamiliar street. A thousand possibilities.',
      'Uma rua desconhecida. Mil possibilidades.',
    ),
  },
])
function undo() {
  const last = history.value.pop()
  if (last) current.value = last.item.id
}
function restart() {
  current.value = 'forest'
  history.value = []
}
</script>
<template>
  <MColumn gap="lg"
    ><MText text="ELSEWHERE / DISCOVERY CLUB" variant="overline" tone="primary" /><MSwipeDeck
      id="discovery-deck"
      v-model="current"
      :items="cards"
      :label="t('Where to next?', 'Para onde agora?')"
      :animated="animated"
      :canUndo="history.length > 0"
      :acceptLabel="t('Keep', 'Guardar')"
      :rejectLabel="t('Pass', 'Passar')"
      :undoLabel="t('Undo', 'Desfazer')"
      :emptyLabel="t('Your next adventure is waiting.', 'Sua próxima aventura está esperando.')"
      @decide="history.push($event)"
      @undo="undo"
    >
      <template #item="{ item, index }"
        ><MColumn gap="lg"
          ><MText :text="`DESTINATION / 0${index + 1}`" variant="overline" tone="primary" /><MIcon
            :name="index === 0 ? 'trees' : index === 1 ? 'waves-horizontal' : 'compass'"
            :size="40" /><MText :text="item.title" variant="title" /><MText
            :text="item.description"
            tone="muted" /></MColumn
      ></template> </MSwipeDeck
    ><MText
      id="deck-decisions"
      :text="history.map((entry) => `${entry.item.id}:${entry.decision}`).join(', ') || '—'"
      variant="caption" /><MRow gap="md" wrap
      ><MSwitch
        v-model="animated"
        :label="t('Expressive motion', 'Movimento expressivo')" /><MButton
        :text="t('Start again', 'Recomeçar')"
        variant="ghost"
        @click="restart" /></MRow
  ></MColumn>
</template>
