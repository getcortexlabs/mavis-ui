<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
import type { CommandItem, ChoiceValue } from '@getcortexlabs/mavis-core'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const t = (en: string, br: string) => ((props.lang ?? locale.value) === 'pt' ? br : en)
const open = ref(false)
const selected = ref<ChoiceValue>('—')
const items = computed<CommandItem[]>(() => [
  {
    value: 'overview',
    label: t('Open overview', 'Abrir visão geral'),
    icon: 'layout-dashboard',
    group: t('Go somewhere', 'Explore'),
    keywords: ['dashboard'],
    shortcut: 'G O',
  },
  {
    value: 'insights',
    label: t('Explore insights', 'Explorar análises'),
    icon: 'chart-no-axes-combined',
    group: t('Go somewhere', 'Explore'),
    description: t('A fresh perspective on your workspace.', 'Um novo olhar para seu espaço.'),
  },
  {
    value: 'invite',
    label: t('Invite a teammate', 'Convidar alguém'),
    icon: 'user-plus',
    group: t('Make something happen', 'Faça acontecer'),
    description: t('Good work starts with good company.', 'Bom trabalho começa com boa companhia.'),
    keywords: ['team', 'equipe'],
    shortcut: 'I',
  },
  {
    value: 'export',
    label: t('Export report', 'Exportar relatório'),
    icon: 'download',
    group: t('Make something happen', 'Faça acontecer'),
    disabled: true,
  },
])
</script>

<template>
  <MCard padding="xl" gap="lg">
    <MRow justify="between" gap="md"
      ><MBadge text="ORBIT / STUDIO" tone="primary" /><MIcon
        name="command"
        :size="32"
        tone="primary"
    /></MRow>
    <MText :text="t('Less searching. More doing.', 'Encontre. Faça. Continue.')" variant="title" />
    <MText
      :text="
        t('Your workspace, one command away.', 'Seu espaço de trabalho a um comando de distância.')
      "
      tone="muted"
    />
    <MButton
      id="command-trigger"
      :accessibilityLabel="`${t('Find an action', 'Encontrar uma ação')} ⌘ K`"
      :text="t('Find an action', 'Encontrar uma ação')"
      icon="search"
      @click="open = true"
      ><template #trailing><MBadge text="⌘ K" /></template
    ></MButton>
    <MText id="command-result" :text="String(selected)" variant="caption" tone="muted" />
  </MCard>
  <MCommandPalette
    v-model:open="open"
    :items="items"
    :label="t('Your next move', 'Seu próximo passo')"
    :searchLabel="t('Search commands', 'Buscar comandos')"
    :placeholder="t('Try invite or insights…', 'Tente convidar ou análises…')"
    :emptyLabel="t('No matching commands', 'Nenhum comando encontrado')"
    :closeLabel="t('Close commands', 'Fechar comandos')"
    shortcut
    returnFocus="command-trigger"
    @select="(key) => (selected = key)"
  />
</template>
