<script setup lang="ts">
import { useCatalogLocale } from '../locale'
import { computed, ref } from 'vue'
import { useFileSelection } from '@getcortexlabs/mavis-core/vue'
import type { InputHandle } from '@getcortexlabs/mavis-core'

const { t, locale } = useCatalogLocale(() => props.lang)

const props = withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: undefined })
const picker = ref<InputHandle>()
defineExpose({
  focus: () => picker.value?.focus(),
  blur: () => picker.value?.blur(),
} satisfies InputHandle)
const failNext = ref(false)
const copy = computed(() =>
  (props.lang ?? locale.value) === 'pt'
    ? {
        title: 'Documentos para a sua próxima viagem.',
        label: 'Documentos e imagens',
        choose: 'Escolher arquivos',
        upload: 'Simular envio',
        cancel: 'Cancelar',
        retry: 'Tentar novamente',
        remove: 'Remover',
        empty: 'Nenhum arquivo selecionado',
        pending: 'Preparando',
        description:
          'Até três imagens ou PDFs, com no máximo 5 MB cada. O envio é uma simulação local; nenhum arquivo sai do dispositivo.',
        failure: 'O envio simulado falhou. Tente novamente.',
        fail: 'Falhar no próximo envio',
        statuses: {
          selected: 'Pronto',
          uploading: 'Enviando',
          uploaded: 'Concluído',
          failed: 'Falhou',
          cancelled: 'Cancelado',
        },
        errors: {
          picker: 'Não foi possível abrir os arquivos.',
          type: 'Escolha uma imagem ou um PDF.',
          count: 'Escolha no máximo três arquivos.',
          size: 'Um arquivo ultrapassa 5 MB.',
        },
      }
    : {
        title: 'Documents for your next journey.',
        label: 'Documents and images',
        choose: 'Choose files',
        upload: 'Simulate upload',
        cancel: 'Cancel',
        retry: 'Retry',
        remove: 'Remove',
        empty: 'No files selected',
        pending: 'Preparing',
        description:
          'Up to three images or PDFs, at most 5 MB each. Upload is a local simulation; no file leaves the device.',
        failure: 'The simulated upload failed. Try again.',
        fail: 'Fail the next upload',
        statuses: {
          selected: 'Ready',
          uploading: 'Uploading',
          uploaded: 'Uploaded',
          failed: 'Failed',
          cancelled: 'Cancelled',
        },
        errors: {
          picker: 'Could not open the files.',
          type: 'Choose an image or PDF.',
          count: 'Choose at most three files.',
          size: 'A file exceeds 5 MB.',
        },
      },
)
const selection = useFileSelection({
  multiple: true,
  maxCount: 3,
  maxSize: 5 * 1024 * 1024,
  accept: ['image/*', '.pdf'],
  // Demonstration transport only. A real application injects its own request here.
  upload: ({ progress, cancellation }) =>
    new Promise<void>((resolve, reject) => {
      const shouldFail = failNext.value
      failNext.value = false
      let step = 0
      const timer = setInterval(() => {
        step++
        if (step > 2) progress(step - 2, 8)
        if (shouldFail && step === 4) {
          clearInterval(timer)
          unsubscribe()
          reject(new Error(copy.value.failure))
        } else if (step === 10) {
          clearInterval(timer)
          unsubscribe()
          resolve()
        }
      }, 250)
      const unsubscribe = cancellation.onCancel(() => {
        clearInterval(timer)
        resolve()
      })
    }),
})
</script>

<template>
  <m-column gap="lg" id="file-picker-demo">
    <m-text variant="heading">{{ t(copy.title) }}</m-text>
    <m-text tone="muted">{{ t(copy.description) }}</m-text>
    <m-file-picker
      ref="picker"
      :selection="selection"
      :label="t(copy.label)"
      :chooseLabel="copy.choose"
      :uploadLabel="copy.upload"
      :cancelLabel="copy.cancel"
      :retryLabel="copy.retry"
      :removeLabel="copy.remove"
      :emptyLabel="t(copy.empty)"
      :pendingLabel="copy.pending"
      :statusLabels="copy.statuses"
      :errorLabels="copy.errors"
    />
    <m-switch v-model="failNext" :label="t(copy.fail)" />
  </m-column>
</template>
