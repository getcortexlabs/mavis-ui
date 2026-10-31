<script setup lang="ts">
import { computed, ref } from 'vue'
import type { SheetCloseReason } from '@getcortexlabs/mavis-core'

const props = withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: 'pt' })
const pt = computed(() => props.lang === 'pt')
const open = ref(false)
const tall = ref(false)
const held = ref(false)
const name = ref('')
const last = ref<SheetCloseReason>()
const reasons: Record<SheetCloseReason, [string, string]> = {
  button: ['the close button', 'o botão de fechar'],
  backdrop: ['the scrim', 'o fundo'],
  escape: ['the Escape key', 'a tecla Escape'],
  back: ['the back gesture', 'o gesto de voltar'],
  swipe: ['a swipe down', 'um arrasto para baixo'],
  program: ['the app', 'o app'],
}
</script>

<template>
  <m-column gap="md">
    <m-row gap="sm" wrap>
      <m-button @click="open = true">{{ pt ? 'Abrir sheet' : 'Open sheet' }}</m-button>
      <m-button variant="secondary" @click="tall = true">{{
        pt ? 'Tela inteira' : 'Full screen'
      }}</m-button>
      <m-button variant="ghost" @click="held = true">{{
        pt ? 'Sem dispensar' : 'Not dismissible'
      }}</m-button>
    </m-row>
    <m-text v-if="last" variant="caption" tone="muted">{{
      pt ? `Fechado por ${reasons[last][1]}.` : `Closed by ${reasons[last][0]}.`
    }}</m-text>

    <m-sheet
      v-model:open="open"
      :title="pt ? 'Filtros' : 'Filters'"
      :closeLabel="pt ? 'Fechar' : 'Close'"
      gap="md"
      @close="last = $event"
    >
      <m-text tone="muted">{{
        pt
          ? 'O conteúdo fica acima da tela e pode rolar. Arraste a alça, toque fora ou use o botão.'
          : 'Content sits above the screen and can scroll. Drag the handle, tap outside or use the button.'
      }}</m-text>
      <m-input v-model="name" :label="pt ? 'Buscar' : 'Search'" icon="search" />
      <m-row gap="sm" justify="end">
        <m-button variant="ghost" @click="open = false">{{ pt ? 'Cancelar' : 'Cancel' }}</m-button>
        <m-button @click="open = false">{{ pt ? 'Aplicar' : 'Apply' }}</m-button>
      </m-row>
    </m-sheet>

    <m-sheet
      v-model:open="tall"
      :title="pt ? 'Detalhes' : 'Details'"
      :closeLabel="pt ? 'Fechar' : 'Close'"
      fullscreen
      gap="md"
      @close="last = $event"
    >
      <m-text v-for="n in 12" :key="n" tone="muted">{{
        pt ? `Linha ${n} de um conteúdo longo.` : `Line ${n} of a long body.`
      }}</m-text>
      <m-button @click="tall = false">{{ pt ? 'Concluir' : 'Done' }}</m-button>
    </m-sheet>

    <m-sheet
      v-model:open="held"
      :title="pt ? 'Confirmar' : 'Confirm'"
      :dismissible="false"
      gap="md"
      @close="last = $event"
    >
      <m-text tone="muted">{{
        pt
          ? 'Esta sheet só fecha pelas ações abaixo.'
          : 'This sheet closes only through the actions below.'
      }}</m-text>
      <m-row gap="sm" justify="end">
        <m-button variant="secondary" @click="held = false">{{
          pt ? 'Agora não' : 'Not now'
        }}</m-button>
        <m-button @click="held = false">{{ pt ? 'Confirmar' : 'Confirm' }}</m-button>
      </m-row>
    </m-sheet>
  </m-column>
</template>
