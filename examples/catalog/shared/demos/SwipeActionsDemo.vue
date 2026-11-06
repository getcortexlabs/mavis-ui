<script setup lang="ts">
import { computed, ref } from 'vue'
import type { SwipeAction, SwipeSide } from '@getcortexlabs/mavis-core'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const t = (en: string, br: string) => (pt.value ? br : en)
const side = ref<SwipeSide>(null)
const result = ref('')
const archived = ref(false)
const favorite = ref(false)
const start = computed<SwipeAction[]>(() => [
  {
    value: 'favorite',
    label: favorite.value ? t('Unstar', 'Desmarcar') : t('Star', 'Favoritar'),
    icon: 'star',
  },
])
const end = computed<SwipeAction[]>(() => [
  { value: 'archive', label: t('Archive', 'Arquivar'), icon: 'archive' },
])
function act(action: SwipeAction) {
  result.value = String(action.value)
  if (action.value === 'archive') archived.value = true
  else favorite.value = !favorite.value
}
</script>
<template>
  <MColumn gap="lg">
    <MColumn gap="xs"
      ><MText text="A GOOD KIND OF INBOX" variant="overline" tone="primary" /><MText
        :text="t('Something worth opening.', 'Uma mensagem que vale abrir.')"
        variant="title" /><MText
        :text="
          t('Slide either way. Keep what matters.', 'Deslize para os lados. Guarde o que importa.')
        "
        tone="muted"
    /></MColumn>
    <MSwipeActions
      v-if="!archived"
      v-model="side"
      :label="t('Weekend plans', 'Planos para o fim de semana')"
      :start="start"
      :end="end"
      :actionsLabel="t('Actions', 'Ações')"
      :closeLabel="t('Close actions', 'Fechar ações')"
      @action="act"
    >
      <MColumn gap="md"
        ><MRow justify="between" align="center"
          ><MRow gap="sm" align="center"
            ><MAvatar name="Mia Chen" size="md" /><MColumn
              ><MText text="Mia Chen" weight="600" /><MText
                text="09:41"
                variant="caption"
                tone="muted" /></MColumn></MRow
          ><MIcon v-if="favorite" name="star" tone="primary" /></MRow
        ><MText
          :text="t('The cabin is booked. You in?', 'A cabana está reservada. Bora?')"
          variant="heading" /><MText
          :text="
            t(
              'Fresh air, a long walk, and absolutely no meetings.',
              'Ar puro, uma boa caminhada e nenhuma reunião.',
            )
          "
          tone="muted"
      /></MColumn>
    </MSwipeActions>
    <MEmptyState
      v-else
      :title="t('A little more room.', 'Um pouco mais de espaço.')"
      :description="
        t(
          'Message archived. You can bring it back.',
          'Mensagem arquivada. Você pode trazê-la de volta.',
        )
      "
      icon="check"
      ><template #actions
        ><MButton :text="t('Undo archive', 'Desfazer')" @click="archived = false" /></template
    ></MEmptyState>
    <MText
      id="swipe-result"
      :text="result || t('No action yet', 'Nenhuma ação ainda')"
      variant="caption"
      tone="muted"
    />
  </MColumn>
</template>
