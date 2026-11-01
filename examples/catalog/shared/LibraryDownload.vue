<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'

defineEmits<{ open: [] }>()
const { theme } = useMavisTheme()
type Phase = 'idle' | 'preparing' | 'downloading' | 'complete' | 'error' | 'cancelled'
const phase = ref<Phase>('idle')
const value = ref(0)
const notice = ref(true)
let timer: ReturnType<typeof setTimeout> | undefined
const busy = computed(() => phase.value === 'preparing' || phase.value === 'downloading')
const caption = computed(
  () =>
    ({
      idle: 'PRONTA PARA IR',
      preparing: 'PREPARANDO',
      downloading: 'BAIXANDO',
      complete: 'CONCLUÍDO',
      error: 'INTERROMPIDO',
      cancelled: 'CANCELADO',
    })[phase.value],
)
function stop() {
  clearTimeout(timer)
  timer = undefined
}
function advance() {
  value.value = Math.min(100, value.value + 10)
  if (value.value === 100) {
    phase.value = 'complete'
    timer = undefined
    return
  }
  timer = setTimeout(advance, 550)
}
function start() {
  stop()
  value.value = 0
  notice.value = true
  phase.value = 'preparing'
  timer = setTimeout(() => {
    phase.value = 'downloading'
    advance()
  }, 900)
}
function interrupt(next: 'error' | 'cancelled') {
  stop()
  phase.value = next
  notice.value = true
}
onBeforeUnmount(stop)
</script>

<template>
  <m-column gap="md" id="library-download">
    <m-card gap="lg" :backgroundColor="theme.colors.accentSoft" :style="{ borderWidth: 0 }">
      <m-row justify="between" gap="sm">
        <m-row gap="sm"
          ><m-icon name="download" tone="accent" /><m-text variant="overline" tone="accent"
            >LEVE COM VOCÊ</m-text
          ></m-row
        >
        <m-badge text="03 LEITURAS" tone="accent" size="sm" />
      </m-row>
      <m-column gap="sm">
        <m-text variant="title">Boas ideias também viajam.</m-text>
        <m-text tone="muted">Prepare sua coleção para ler no seu tempo.</m-text>
      </m-column>
      <m-column gap="sm">
        <m-row justify="between" gap="md">
          <m-text variant="overline" tone="accent">{{ caption }}</m-text>
          <m-text variant="heading" tone="accent">{{
            phase === 'preparing' ? '…' : `${value}%`
          }}</m-text>
        </m-row>
        <m-progress
          id="library-download-progress"
          :value="value"
          :indeterminate="phase === 'preparing'"
          label="Download da biblioteca"
          indeterminateLabel="Preparando coleção"
          tone="accent"
          size="lg"
        />
      </m-column>
      <m-row gap="sm" wrap>
        <m-button v-if="!busy" icon="download" @click="start">{{
          phase === 'idle' ? 'Baixar coleção' : 'Baixar novamente'
        }}</m-button>
        <m-button v-if="busy" size="sm" variant="secondary" @click="interrupt('cancelled')"
          >Cancelar download</m-button
        >
        <m-button v-if="busy" size="sm" variant="ghost" @click="interrupt('error')"
          >Simular falha</m-button
        >
      </m-row>
    </m-card>
    <m-alert
      v-if="notice && phase === 'error'"
      title="A conexão foi interrompida."
      description="Tente novamente para preparar a coleção desde o início. Suas leituras salvas continuam aqui."
      tone="error"
      announce
      dismissible
      closeLabel="Fechar erro do download"
      @close="notice = false"
    >
      <template #actions
        ><m-button size="sm" variant="secondary" @click="start"
          >Tentar novamente</m-button
        ></template
      >
    </m-alert>
    <m-alert
      v-if="notice && phase === 'complete'"
      title="Coleção preparada."
      description="Tudo pronto nesta demonstração. Explore suas leituras salvas."
      tone="success"
      announce
      dismissible
      closeLabel="Fechar confirmação do download"
      @close="notice = false"
    >
      <template #actions
        ><m-button size="sm" variant="secondary" @click="$emit('open')"
          >Ver salvos</m-button
        ></template
      >
    </m-alert>
    <m-alert
      v-if="notice && phase === 'cancelled'"
      title="Download cancelado."
      description="Você pode começar de novo quando quiser."
      tone="warning"
      announce
      dismissible
      closeLabel="Fechar aviso de cancelamento"
      @close="notice = false"
    />
    <m-text variant="caption" tone="muted"
      >Download simulado. Nenhum arquivo é transferido ou salvo no dispositivo.</m-text
    >
  </m-column>
</template>
