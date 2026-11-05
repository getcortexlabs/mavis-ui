<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
import type { TimelineItem } from '@getcortexlabs/mavis-core'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const t = (en: string, br: string) => (pt.value ? br : en)
const delivered = ref(false)
const items = computed<TimelineItem[]>(() => [
  {
    key: 'idea',
    title: t('An idea takes shape', 'Uma ideia ganha forma'),
    description: t(
      'The brief is ready. A new story begins.',
      'O briefing está pronto. Uma nova história começa.',
    ),
    time: '09:00',
    status: 'complete',
    icon: 'sparkles',
  },
  {
    key: 'design',
    title: t('Made with intention', 'Feito com intenção'),
    description: t(
      'Colors, type and every little detail.',
      'Cores, letras e cada pequeno detalhe.',
    ),
    time: '11:30',
    status: 'complete',
    icon: 'pen-tool',
  },
  {
    key: 'review',
    title: t('A fresh pair of eyes', 'Um novo olhar'),
    description: t('Sharing the work with the team.', 'Compartilhando o trabalho com a equipe.'),
    time: '14:00',
    status: delivered.value ? 'complete' : 'current',
    icon: 'message-circle',
  },
  {
    key: 'launch',
    title: t('Ready for the world', 'Pronto para o mundo'),
    time: '16:00',
    status: delivered.value ? 'current' : 'upcoming',
    icon: 'rocket',
  },
])
</script>

<template>
  <MCard padding="lg" gap="lg">
    <MRow justify="between" wrap gap="sm"
      ><MText
        :text="t('From spark to launch.', 'Da ideia ao mundo.')"
        variant="heading"
        :shrink="1" /><MBadge :text="t('TODAY', 'HOJE')" tone="primary"
    /></MRow>
    <MTimeline
      :items="items"
      :label="t('Project activity', 'Atividade do projeto')"
      :statusLabels="
        pt
          ? {
              complete: 'Concluído',
              current: 'Em andamento',
              upcoming: 'A seguir',
              error: 'Precisa de atenção',
            }
          : undefined
      "
    >
      <template #default="{ item }"
        ><MRow v-if="item.key === 'review'" gap="xs"
          ><MAvatar name="Alex Morgan" size="sm" /><MAvatar name="Sam Lee" size="sm" /><MAvatar
            name="Jo Rivera"
            size="sm" /></MRow
      ></template>
    </MTimeline>
    <MButton
      :text="
        delivered ? t('Start again', 'Recomeçar') : t('Approve and continue', 'Aprovar e continuar')
      "
      :icon="delivered ? 'rotate-ccw' : 'arrow-right'"
      variant="secondary"
      @click="delivered = !delivered"
    />
  </MCard>
</template>
