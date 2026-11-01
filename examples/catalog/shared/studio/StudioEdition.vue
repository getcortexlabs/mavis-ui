<script setup lang="ts">
import { ref } from 'vue'
import { useMavisTheme, useToast } from '@getcortexlabs/mavis-core/vue'
import { atelierNight } from './theme'

const { theme, setAppearance } = useMavisTheme()
const email = ref('')
const sheet = ref(false)
const dialog = ref(false)
const subscribed = ref(false)
const toast = useToast()
function subscribe() {
  subscribed.value = true
  dialog.value = false
  toast.show({
    title: 'Seu lugar está guardado.',
    message: 'Uma boa leitura chega no domingo.',
    tone: 'success',
  })
}
</script>

<template>
  <m-column
    id="studio-edition"
    padding="lg"
    gap="xl"
    radius="lg"
    :backgroundColor="theme.colors.background"
  >
    <m-row justify="between" gap="md" wrap>
      <m-text variant="heading" weight="600">atelier.</m-text>
      <m-button
        size="sm"
        variant="ghost"
        @click="setAppearance(theme.appearance === 'light' ? 'dark' : 'light')"
      >
        {{ theme.appearance === 'light' ? 'Edição noturna' : 'Edição diurna' }}
      </m-button>
    </m-row>
    <m-separator />
    <m-row gap="xl" align="start" wrap>
      <m-column :width="280" :grow="1" gap="lg" paddingY="md">
        <m-text variant="overline" tone="primary">UM POUCO DE ESPAÇO PARA VOCÊ</m-text>
        <m-text id="studio-headline" as="h1" variant="display"
          >Menos pressa. <m-span emphasis="em" tone="primary">Mais presença.</m-span></m-text
        >
        <m-text tone="muted"
          >Histórias, ideias e pequenos rituais para olhar o cotidiano com mais atenção.</m-text
        >
        <m-row gap="md" wrap>
          <m-button @click="sheet = true">Conheça a edição</m-button>
          <m-text variant="caption" tone="muted">Aos domingos. No seu tempo.</m-text>
        </m-row>
      </m-column>
      <m-card id="studio-feature" :width="280" :grow="1" gap="lg">
        <m-row justify="between">
          <m-text variant="overline" tone="primary">CADERNO 01</m-text>
          <m-badge text="8 min" />
        </m-row>
        <m-column
          :height="158"
          justify="center"
          align="center"
          radius="lg"
          :backgroundColor="theme.colors.primarySoft"
        >
          <m-text variant="display" tone="primary">Aa.</m-text>
          <m-text variant="overline" tone="primary">O PRAZER DAS PEQUENAS COISAS</m-text>
        </m-column>
        <m-text variant="title">O que fica quando a gente desacelera?</m-text>
        <m-text tone="muted">Uma conversa sobre tempo, escolha e a beleza de estar aqui.</m-text>
        <m-button variant="secondary" @click="sheet = true">Abrir o caderno</m-button>
      </m-card>
    </m-row>
    <m-row gap="lg" align="start" wrap>
      <m-column :width="280" :grow="1" gap="md">
        <m-text variant="overline" tone="primary">UMA CARTA, NÃO MAIS RUÍDO</m-text>
        <m-text variant="heading">Um encontro com boas ideias.</m-text>
        <m-input
          v-model="email"
          label="Seu e-mail"
          placeholder="voce@exemplo.com"
          type="email"
          autocomplete="email"
          name="studio-email"
          helperText="Uma carta por semana. Sem pressa, sem excessos."
        />
        <m-button :disabled="!email.trim() || subscribed" @click="dialog = true">{{
          subscribed ? 'Você está na lista' : 'Quero receber a carta'
        }}</m-button>
      </m-column>
      <m-theme-provider :theme="atelierNight">
        <m-card id="studio-note" :width="280" :grow="1" gap="lg">
          <m-text variant="overline" tone="primary">PARA LEVAR COM VOCÊ</m-text>
          <m-text variant="title"
            >“A vida acontece <m-span emphasis="em" tone="primary">nos intervalos.</m-span>”</m-text
          >
          <m-text variant="caption" tone="muted">Notas de uma manhã sem despertador.</m-text>
        </m-card>
      </m-theme-provider>
    </m-row>
    <m-sheet v-model:open="sheet" title="Nesta edição" closeLabel="Fechar edição" gap="md">
      <m-text variant="title"
        >Uma pausa <m-span emphasis="em" tone="primary">bem-vinda.</m-span></m-text
      >
      <m-text>Três histórias sobre o tempo que escolhemos guardar.</m-text>
      <m-text variant="caption" tone="muted"
        >01 · Um café sem tela. 02 · A caminhada mais longa. 03 · Uma carta escrita à mão.</m-text
      >
      <m-button @click="sheet = false">Voltar à edição</m-button>
    </m-sheet>
    <m-dialog
      v-model:open="dialog"
      title="Um lugar na sua semana"
      description="Podemos guardar este e-mail para a nossa carta de domingo?"
      confirmLabel="Sim, quero receber"
      cancelLabel="Agora não"
      @confirm="subscribe"
    />
    <m-toast :controller="toast" />
  </m-column>
</template>
