<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const t = (en: string, br: string) => (pt.value ? br : en)
const size = ref(38)
const title = ref('The quiet hours')
const vertical = ref(false)
</script>
<template>
  <MColumn gap="md">
    <MRow justify="between" gap="md" wrap
      ><MColumn gap="xs"
        ><MText text="FIELD NOTES / 03" variant="overline" tone="primary" /><MText
          :text="t('Room to think.', 'Espaço para pensar.')"
          variant="title" /></MColumn
      ><MButton
        :text="vertical ? t('Side by side', 'Lado a lado') : t('Stack panels', 'Empilhar painéis')"
        variant="secondary"
        @click="vertical = !vertical"
    /></MRow>
    <MResizablePanels
      v-model="size"
      :label="t('Notebook layout', 'Layout do caderno')"
      :height="420"
      :orientation="vertical ? 'vertical' : 'horizontal'"
      collapsible
      :primaryLabel="t('Notes', 'Notas')"
      :secondaryLabel="t('Editor', 'Editor')"
      :collapseLabel="t('Hide notes', 'Ocultar notas')"
      :expandLabel="t('Show notes', 'Mostrar notas')"
    >
      <template #primary
        ><MColumn padding="md" gap="lg"
          ><MText
            :text="t('YOUR NOTEBOOK', 'SEU CADERNO')"
            variant="overline"
            tone="muted" /><MColumn gap="sm"
            ><MText text="01 / The quiet hours" weight="600" /><MText
              text="02 / Places to go"
              tone="muted" /><MText text="03 / A different pace" tone="muted" /></MColumn
          ><MText
            :text="
              t(
                'Drag the divider to make this space yours.',
                'Arraste a divisão e encontre seu espaço.',
              )
            "
            variant="caption"
            tone="muted" /></MColumn
      ></template>
      <template #secondary
        ><MColumn padding="lg" gap="lg"
          ><MBadge :text="t('Draft', 'Rascunho')" /><MInput
            v-model="title"
            :label="t('Note title', 'Título da nota')" /><MText
            :text="
              t(
                'There is a particular kind of light at the end of a long afternoon. A reminder to leave a little room for nothing at all.',
                'Existe uma luz especial no fim de uma tarde longa. Um lembrete para deixar um pouco de espaço sem nada marcado.',
              )
            " /><MText
            :text="
              t(
                'Your draft stays here when the panels change.',
                'Seu rascunho continua aqui quando os painéis mudam.',
              )
            "
            variant="caption"
            tone="muted" /></MColumn
      ></template>
    </MResizablePanels>
    <MText id="panel-value" :text="String(size)" variant="caption" tone="muted" />
  </MColumn>
</template>
