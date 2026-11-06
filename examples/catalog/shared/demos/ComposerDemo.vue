<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ComposerAttachment, ComposerMessage } from '@getcortexlabs/mavis-core'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const t = (en: string, br: string) => (pt.value ? br : en)
const draft = ref(''),
  attachments = ref<ComposerAttachment[]>([]),
  messages = ref<string[]>([]),
  loading = ref(false)
let serial = 0
function attach() {
  attachments.value.push({ id: String(++serial), name: `field-notes-${serial}.pdf` })
}
async function send(message: ComposerMessage) {
  if (loading.value) return
  loading.value = true
  await new Promise((resolve) => setTimeout(resolve, 450))
  messages.value.push(message.text || message.attachments[0]?.name || '')
  draft.value = ''
  attachments.value = []
  loading.value = false
}
</script>
<template>
  <MColumn gap="lg">
    <MRow gap="md" align="center"
      ><MAvatar name="Clara" /><MColumn gap="xs"
        ><MText text="FIELD NOTES" variant="overline" tone="primary" /><MText
          :text="t('Good ideas start here.', 'Boas ideias começam aqui.')"
          variant="heading" /></MColumn
    ></MRow>
    <MCard gap="sm"
      ><MText text="Clara" variant="caption" tone="primary" /><MText
        :text="
          t(
            'What if we took the scenic route this time?',
            'E se dessa vez a gente fosse pelo caminho mais bonito?',
          )
        "
    /></MCard>
    <MCard v-for="(message, i) in messages" :key="i" gap="xs"
      ><MText :text="t('You', 'Você')" variant="caption" tone="primary" /><MText :text="message"
    /></MCard>
    <MComposer
      v-model="draft"
      v-model:attachments="attachments"
      :label="t('Your message', 'Sua mensagem')"
      :placeholder="t('Add a thought…', 'Compartilhe uma ideia…')"
      :loading="loading"
      :attachLabel="t('Add attachment', 'Adicionar anexo')"
      :removeLabel="t('Remove attachment', 'Remover anexo')"
      :sendLabel="t('Send message', 'Enviar mensagem')"
      :sendingLabel="t('Sending', 'Enviando')"
      @attach="attach"
      @submit="send"
    />
    <MText id="composer-sent" :text="String(messages.length)" variant="caption" tone="muted" />
  </MColumn>
</template>
