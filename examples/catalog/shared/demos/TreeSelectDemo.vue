<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const t = (en: string, pt: string) => ((props.lang ?? locale.value) === 'pt' ? pt : en)
const animated = ref(true)

const selection = ref<string[]>(['lettering']),
  expanded = ref(['studio'])
const nodes = computed(() => [
  {
    id: 'studio',
    label: t('Creative studio', 'Estúdio criativo'),
    selectable: false,
    children: [
      {
        id: 'identity',
        label: t('Brand identity', 'Identidade visual'),
        selectable: false,
        children: [
          { id: 'lettering', label: 'Lettering' },
          { id: 'color', label: t('Color systems', 'Sistemas de cor') },
        ],
      },
      {
        id: 'editorial',
        label: 'Editorial',
        selectable: false,
        children: [
          { id: 'print', label: t('Print editions', 'Edições impressas') },
          { id: 'digital', label: t('Digital stories', 'Histórias digitais') },
        ],
      },
      { id: 'archive', label: t('Archive · locked', 'Arquivo · bloqueado'), disabled: true },
    ],
  },
])
</script>
<template>
  <MColumn gap="lg">
    <MText text="THE FIELD GUIDE / 01" variant="overline" tone="primary" />
    <MText
      :text="t('Find your corner of the studio.', 'Encontre seu canto no estúdio.')"
      variant="title"
    />
    <MText
      :text="
        t(
          'A little structure. Endless possibilities.',
          'Um pouco de estrutura. Possibilidades sem fim.',
        )
      "
      tone="muted"
    />
    <MCard padding="lg"
      ><MTreeSelect
        id="studio-tree-select"
        v-model="selection"
        v-model:expanded="expanded"
        :nodes="nodes"
        multiple
        :animated="animated"
        :label="t('Your disciplines', 'Suas disciplinas')"
        :searchLabel="t('Find a discipline', 'Buscar disciplina')"
        :placeholder="t('Choose disciplines', 'Escolher disciplinas')"
        :clearLabel="t('Clear selection', 'Limpar seleção')"
        :emptyLabel="t('No matches', 'Nenhum resultado')"
        :expandLabel="t('Expand', 'Expandir')"
        :collapseLabel="t('Collapse', 'Recolher')"
    /></MCard>
    <MText id="tree-select-value" :text="selection.join(',')" variant="caption" tone="muted" />

    <MSwitch v-model="animated" :label="t('Animate changes', 'Animar mudanças')" />
  </MColumn>
</template>
