<script setup lang="ts">
import { computed, ref } from 'vue'
import type { AlertTone } from '@getcortexlabs/mavis-core'
const props = withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: 'pt' })
const pt = computed(() => props.lang === 'pt')
const tone = ref<AlertTone>('info')
const visible = ref(true)
const announce = ref(false)
const actions = ref(0)
const options = computed(
  () =>
    [
      { value: 'info', label: pt.value ? 'Informação' : 'Information' },
      { value: 'success', label: pt.value ? 'Sucesso' : 'Success' },
      { value: 'warning', label: pt.value ? 'Atenção' : 'Warning' },
      { value: 'error', label: pt.value ? 'Erro' : 'Error' },
    ] as const,
)
function selectTone(value: AlertTone) {
  tone.value = value
  visible.value = true
}
const messages = computed(() =>
  pt.value
    ? {
        info: {
          title: 'Suas leituras vão com você.',
          description: 'Prepare uma coleção para os momentos em que a conexão fica para depois.',
        },
        success: {
          title: 'Tudo pronto para continuar.',
          description: 'As alterações foram salvas. Você pode seguir de onde parou.',
        },
        warning: {
          title: 'Um detalhe antes de sair.',
          description:
            'Há alterações que ainda não foram salvas. Revise os detalhes para não perder seu trabalho.',
        },
        error: {
          title: 'Não foi possível concluir.',
          description:
            'A conexão foi interrompida. Seus dados continuam aqui; tente novamente quando estiver pronto.',
        },
      }
    : {
        info: {
          title: 'Your readings go with you.',
          description: 'Prepare a collection for moments when the connection can wait.',
        },
        success: {
          title: 'Ready to carry on.',
          description: 'Your changes are saved. Pick up where you left off.',
        },
        warning: {
          title: 'One detail before you leave.',
          description: 'Some changes have not been saved. Review the details to keep your work.',
        },
        error: {
          title: 'Could not finish.',
          description:
            'The connection was interrupted. Your data is still here; try again when you are ready.',
        },
      },
)
</script>

<template>
  <m-column gap="lg" id="alert-demo">
    <m-column gap="sm">
      <m-text variant="overline" tone="accent">{{
        pt ? 'CLAREZA, NO CONTEXTO' : 'CLARITY, IN CONTEXT'
      }}</m-text>
      <m-text variant="title">{{
        pt ? 'A mensagem certa. No lugar certo.' : 'The right message. In the right place.'
      }}</m-text>
      <m-text tone="muted">{{
        pt
          ? 'Um aviso acompanha a tarefa sem tirar você dela.'
          : 'A notice follows the task without taking you away from it.'
      }}</m-text>
    </m-column>
    <m-row gap="sm" wrap>
      <m-button
        v-for="option in options"
        :key="option.value"
        size="sm"
        :variant="tone === option.value ? 'primary' : 'secondary'"
        @click="selectTone(option.value)"
        >{{ option.label }}</m-button
      >
    </m-row>
    <m-alert
      v-if="visible"
      id="alert-example"
      v-bind="messages[tone]"
      :tone="tone"
      dismissible
      :closeLabel="pt ? 'Fechar aviso' : 'Dismiss notice'"
      :announce="announce"
      @close="visible = false"
    >
      <template #actions>
        <m-button size="sm" variant="secondary" @click="actions++">{{
          pt ? 'Ver detalhes' : 'View details'
        }}</m-button>
      </template>
    </m-alert>
    <m-button v-else variant="secondary" @click="visible = true">{{
      pt ? 'Mostrar aviso' : 'Show notice'
    }}</m-button>
    <m-text variant="caption" tone="muted">{{
      actions
        ? pt
          ? `Detalhes abertos ${actions} vez(es).`
          : `Details opened ${actions} time(s).`
        : pt
          ? 'A ação e o fechamento são controlados por esta tela.'
          : 'This screen controls actions and dismissal.'
    }}</m-text>
    <m-switch
      v-model="announce"
      :label="pt ? 'Anunciar atualizações' : 'Announce updates'"
      :helperText="
        pt
          ? 'Ative para avisar leitores de tela sobre uma mensagem nova.'
          : 'Enable to notify screen readers about a new message.'
      "
    />
    <m-alert
      :title="pt ? 'Sem pressa para desaparecer.' : 'No rush to disappear.'"
      :description="
        pt
          ? 'Este aviso permanece no conteúdo, sem temporizador e sem botão de fechar.'
          : 'This notice stays in the content, with no timeout or close button.'
      "
      tone="info"
    />
  </m-column>
</template>
