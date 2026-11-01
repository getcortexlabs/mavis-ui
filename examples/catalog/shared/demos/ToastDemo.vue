<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMavisTheme, useToast } from '@getcortexlabs/mavis-core/vue'
import type { ToastOptions, ToastTone } from '@getcortexlabs/mavis-core'
const props = withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: 'pt' })
const pt = computed(() => props.lang === 'pt')
const { theme } = useMavisTheme()
const toast = useToast()
const sent = ref(0)
function show(tone: ToastTone) {
  const messages: Record<ToastTone, [string, string, string, string]> = {
    success: [
      'Tudo no lugar.',
      'Suas alterações foram salvas nesta demonstração.',
      'Right where it belongs.',
      'Your changes were saved in this demo.',
    ],
    error: [
      'Não foi dessa vez.',
      'Não conseguimos concluir. Tente novamente.',
      'Something went wrong.',
      'We could not finish. Please try again.',
    ],
    warning: [
      'Mais um detalhe.',
      'Confira o endereço antes de continuar.',
      'One more detail.',
      'Check the address before continuing.',
    ],
    info: [
      'Uma novidade para você.',
      'A coleção de inverno já está disponível.',
      'Something new for you.',
      'The winter collection is now available.',
    ],
  }
  const copy = messages[tone]
  send({ title: copy[pt.value ? 0 : 2], message: copy[pt.value ? 1 : 3], tone })
}
function send(options: ToastOptions) {
  toast.show(options)
  sent.value++
}
function queue() {
  for (const n of [1, 2, 3])
    send({
      title: pt.value ? `Aviso ${n} de 3` : `Notice ${n} of 3`,
      message: pt.value
        ? 'Um de cada vez, sem interromper o que você está fazendo.'
        : 'One at a time, without interrupting what you are doing.',
      tone: n === 3 ? 'success' : 'info',
      duration: 2000,
    })
}
function persistent() {
  send({
    title: pt.value ? 'No seu tempo.' : 'Take your time.',
    message: pt.value
      ? 'Este aviso fica por aqui até você fechar.'
      : 'This notice stays here until you dismiss it.',
    duration: 0,
  })
}
</script>

<template>
  <m-column gap="lg">
    <m-column padding="lg" gap="md" radius="lg" :backgroundColor="theme.colors.primarySoft">
      <m-row justify="between" gap="sm">
        <m-text variant="overline" tone="primary">{{
          pt ? 'UM SINAL, SEM PAUSA' : 'A SIGNAL, NOT A PAUSE'
        }}</m-text>
        <m-icon name="sparkles" tone="primary" />
      </m-row>
      <m-text variant="heading">{{ pt ? 'No momento certo.' : 'Right on time.' }}</m-text>
      <m-text variant="caption" tone="muted">{{
        pt
          ? 'Uma confirmação. Um cuidado. Uma novidade. E a vida continua.'
          : 'A confirmation. A heads-up. Something new. Then carry on.'
      }}</m-text>
      <m-row padding="md" gap="sm" radius="md" :backgroundColor="theme.colors.surface">
        <m-icon name="circle-check" tone="success" />
        <m-column gap="xs" :grow="1" :width="0">
          <m-text :style="{ fontWeight: '600' }">{{
            pt ? 'Tudo em dia.' : 'All caught up.'
          }}</m-text>
          <m-text variant="caption" tone="muted">{{
            pt ? 'Pequenos avisos, bem resolvidos.' : 'Small notices, thoughtfully done.'
          }}</m-text>
        </m-column>
      </m-row>
    </m-column>
    <m-column gap="sm">
      <m-row gap="sm" wrap>
        <m-button :grow="1" :style="{ width: 0 }" icon="circle-check" @click="show('success')">{{
          pt ? 'Sucesso' : 'Success'
        }}</m-button>
        <m-button
          :grow="1"
          :style="{ width: 0 }"
          variant="secondary"
          icon="circle-alert"
          @click="show('error')"
          >{{ pt ? 'Erro' : 'Error' }}</m-button
        >
      </m-row>
      <m-row gap="sm" wrap>
        <m-button
          :grow="1"
          :style="{ width: 0 }"
          variant="secondary"
          icon="triangle-alert"
          @click="show('warning')"
          >{{ pt ? 'Aviso' : 'Warning' }}</m-button
        >
        <m-button
          :grow="1"
          :style="{ width: 0 }"
          variant="secondary"
          icon="info"
          @click="show('info')"
          >{{ pt ? 'Informação' : 'Information' }}</m-button
        >
      </m-row>
    </m-column>
    <m-button variant="secondary" @click="queue">{{
      pt ? 'Disparar três avisos' : 'Queue three notices'
    }}</m-button>
    <m-button variant="ghost" @click="persistent">{{
      pt ? 'Sem fechar sozinho' : 'Keep it open'
    }}</m-button>
    <m-row gap="sm" justify="between" wrap>
      <m-text variant="caption" tone="muted">{{
        pt ? `${sent} avisos disparados` : `${sent} notices sent`
      }}</m-text>
      <m-button variant="ghost" size="sm" @click="toast.clear()">{{
        pt ? 'Limpar fila' : 'Clear queue'
      }}</m-button>
    </m-row>
    <m-toast :controller="toast" :closeLabel="pt ? 'Fechar aviso' : 'Dismiss notice'" />
  </m-column>
</template>
