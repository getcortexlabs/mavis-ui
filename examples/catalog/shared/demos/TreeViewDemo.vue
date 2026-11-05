<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const t = (en: string, br: string) => (pt.value ? br : en)
import type { ChoiceValue, TreeNode } from '@getcortexlabs/mavis-core'
const selected = ref<ChoiceValue | null>('brand')
const expanded = ref<ChoiceValue[]>(['studio'])
const loading = ref<ChoiceValue[]>([])
const nodes = ref<TreeNode[]>([
  {
    key: 'studio',
    label: 'Studio',
    children: [
      { key: 'brand', label: 'Brand system' },
      { key: 'website', label: 'Website' },
      { key: 'archive', label: 'Archive', disabled: true },
    ],
  },
  { key: 'research', label: 'Research', hasChildren: true },
  { key: 'notes', label: 'Field notes' },
])
async function load(node: TreeNode) {
  loading.value = [...loading.value, node.key]
  await new Promise((resolve) => setTimeout(resolve, 250))
  nodes.value = nodes.value.map((item) =>
    item.key === node.key
      ? {
          ...item,
          children: [
            { key: 'interviews', label: 'Interviews' },
            { key: 'insights', label: 'Insights' },
          ],
        }
      : item,
  )
  loading.value = loading.value.filter((key) => key !== node.key)
}
</script>

<template>
  <MCard padding="lg" gap="md">
    <MText variant="overline" :text="t('ROOM TO GROW', 'ESPAÇO PARA CRESCER')" tone="primary" />
    <MTreeView
      v-model="selected"
      v-model:expanded="expanded"
      :nodes="nodes"
      :loadingKeys="loading"
      :label="t('Ideas, organized', 'Ideias organizadas')"
      @load="load"
    />
    <MSeparator /><MText
      id="tree-value"
      :text="String(selected ?? '')"
      tone="muted"
      variant="caption"
    />
  </MCard>
</template>
