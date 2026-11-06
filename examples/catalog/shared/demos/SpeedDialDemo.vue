<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const t = (en: string, br: string) => (pt.value ? br : en)
const open = ref(false),
  selected = ref(''),
  down = ref(false)
const actions = computed(() => [
  { value: 'note', label: t('Write a note', 'Escrever uma nota'), icon: 'pencil' as const },
  { value: 'photo', label: t('Add a photo', 'Adicionar uma foto'), icon: 'image' as const },
  { value: 'invite', label: t('Invite someone', 'Convidar alguém'), icon: 'users' as const },
  { value: 'publish', label: t('Publish', 'Publicar'), icon: 'send' as const, disabled: true },
])
</script>
<template>
  <MColumn gap="lg">
    <MText text="MAKE SOMETHING / TOGETHER" variant="overline" tone="primary" />
    <MText
      :text="t('A small action. A new possibility.', 'Uma pequena ação. Uma nova possibilidade.')"
      variant="title"
    />
    <MCard gap="lg" padding="lg"
      ><MText
        :text="
          t('Your next chapter is still unwritten.', 'Seu próximo capítulo ainda está em branco.')
        "
        tone="muted" /><MBox :height="80" /><MRow justify="end"
        ><MSpeedDial
          v-model:open="open"
          :label="t('Create something', 'Criar algo')"
          :closeLabel="t('Close actions', 'Fechar ações')"
          :actions="actions"
          :direction="down ? 'down' : 'up'"
          @select="(value) => (selected = String(value))" /></MRow
    ></MCard>
    <MSwitch v-model="down" :label="t('Open downward', 'Abrir para baixo')" />
    <MText id="dial-selection" :text="selected || '—'" variant="caption" tone="muted" />
  </MColumn>
</template>
