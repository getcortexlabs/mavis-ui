<script setup lang="ts">
import { ref } from 'vue'
import { useMavisTheme } from '@getcortexlabs/mavis-core/vue'

withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: 'pt' })
const { theme } = useMavisTheme()
const notifications = ref(true)
const digest = ref(false)
const changes = ref(0)
function reset() {
  notifications.value = true
  digest.value = false
}
</script>

<template>
  <m-column gap="lg">
    <m-column gap="sm" padding="lg" radius="lg" :backgroundColor="theme.colors.primarySoft">
      <m-row gap="sm">
        <m-icon name="bell" tone="primary" />
        <m-text variant="overline" tone="primary">{{
          lang === 'pt' ? 'NO SEU RITMO' : 'AT YOUR PACE'
        }}</m-text>
      </m-row>
      <m-text variant="heading">{{
        lang === 'pt' ? 'Só o que importa.' : 'Just what matters.'
      }}</m-text>
      <m-text variant="caption" tone="muted">{{
        lang === 'pt' ? 'Escolha o que chega até você.' : 'Choose what reaches you.'
      }}</m-text>
    </m-column>
    <m-column gap="sm">
      <m-switch
        id="notifications"
        v-model="notifications"
        :label="lang === 'pt' ? 'Notificações' : 'Notifications'"
        :helperText="
          lang === 'pt'
            ? 'Novidades das pessoas que você acompanha.'
            : 'Updates from the people you follow.'
        "
        @update:modelValue="changes++"
      />
      <m-box :height="1" :backgroundColor="theme.colors.border" />
      <m-switch
        id="digest"
        v-model="digest"
        :label="lang === 'pt' ? 'Resumo semanal por e-mail' : 'Weekly email digest'"
        :helperText="
          lang === 'pt'
            ? 'Uma seleção para ler com calma, uma vez por semana.'
            : 'A thoughtful selection to read once a week.'
        "
        @update:modelValue="changes++"
      />
      <m-box :height="1" :backgroundColor="theme.colors.border" />
      <m-switch
        :modelValue="true"
        disabled
        :label="lang === 'pt' ? 'Alertas de segurança' : 'Security alerts'"
        :helperText="
          lang === 'pt'
            ? 'Esta preferência é gerenciada pela sua equipe.'
            : 'Your team manages this preference.'
        "
      />
      <m-switch disabled :label="lang === 'pt' ? 'Acesso antecipado' : 'Early access'" />
    </m-column>
    <m-row justify="between" gap="sm" wrap>
      <m-text variant="caption" tone="muted">{{
        lang === 'pt'
          ? `${changes} ${changes === 1 ? 'alteração' : 'alterações'}`
          : `${changes} ${changes === 1 ? 'change' : 'changes'}`
      }}</m-text>
      <m-button variant="ghost" size="sm" @click="reset">{{
        lang === 'pt' ? 'Restaurar' : 'Reset'
      }}</m-button>
    </m-row>
  </m-column>
</template>
