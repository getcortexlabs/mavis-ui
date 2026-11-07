<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const t = (en: string, pt: string) => ((props.lang ?? locale.value) === 'pt' ? pt : en)
const animated = ref(true)

import type { MavisNotification } from '@getcortexlabs/mavis-core'
const filter = ref<'all' | 'unread'>('all'),
  action = ref('')
const items = ref<MavisNotification[]>([
  {
    id: 'edition',
    title: 'The autumn edition is ready',
    description: 'Your stories, photographs and small discoveries. All in one place.',
    group: 'Today',
    time: '09:41',
    actionLabel: 'Open edition',
    read: false,
  },
  {
    id: 'feedback',
    title: 'A fresh pair of eyes',
    description: 'Mara left a thoughtful note on your latest collection.',
    group: 'Today',
    time: '08:20',
    read: false,
  },
  {
    id: 'welcome',
    title: 'A good beginning',
    description: 'Your studio is ready. Make something worth keeping.',
    group: 'Earlier',
    time: 'Yesterday',
    read: true,
    dismissible: false,
  },
])
let serial = 0
function add() {
  items.value = [
    {
      id: 'new-' + serial++,
      title: 'A new invitation',
      description: 'A little space for something unexpected.',
      group: 'Today',
      read: false,
    },
    ...items.value,
  ]
}
</script>
<template>
  <MColumn gap="lg">
    <MText text="THE FIELD GUIDE / 06" variant="overline" tone="primary" />
    <MText
      :text="t('A little less noise. More meaning.', 'Menos ruído. Mais significado.')"
      variant="title"
    />
    <MNotificationCenter
      id="studio-notifications"
      v-model="items"
      v-model:filter="filter"
      :animated="animated"
      :label="t('Your studio inbox', 'A caixa de entrada do estúdio')"
      :allLabel="t('All', 'Todas')"
      :unreadLabel="t('Unread', 'Não lidas')"
      :readLabel="t('Mark as read', 'Marcar como lida')"
      :unreadActionLabel="t('Mark as unread', 'Marcar como não lida')"
      :readAllLabel="t('Mark all as read', 'Marcar todas como lidas')"
      :dismissLabel="t('Dismiss', 'Dispensar')"
      :emptyLabel="
        t('A quiet moment. You are all caught up.', 'Um momento tranquilo. Tudo em dia.')
      "
      @action="action = $event"
    />
    <MButton
      :text="t('Receive an invitation', 'Receber um convite')"
      variant="secondary"
      @click="add"
    />
    <MText
      id="notification-state"
      :text="items.map((x) => x.id + ':' + !!x.read).join(',')"
      variant="caption"
      tone="muted"
    /><MText id="notification-action" :text="action" variant="caption" />

    <MSwitch v-model="animated" :label="t('Animate changes', 'Animar mudanças')" />
  </MColumn>
</template>
