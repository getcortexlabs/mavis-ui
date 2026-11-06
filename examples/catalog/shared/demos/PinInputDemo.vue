<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogLocale } from '../locale'
const props = defineProps<{ lang?: 'en' | 'pt' }>()
const { locale } = useCatalogLocale(() => props.lang)
const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const t = (en: string, br: string) => (pt.value ? br : en)
function clearCode() {
  code.value = ''
  complete.value = ''
}
const code = ref(''),
  complete = ref(''),
  error = ref(false),
  disabled = ref(false)
</script>
<template>
  <MColumn gap="lg">
    <MText text="ONE LAST STEP" variant="overline" tone="primary" />
    <MText :text="t('Welcome back.', 'Bom ter você de volta.')" variant="title" />
    <MText
      :text="
        t(
          'Enter the six-digit code sent to your email.',
          'Digite o código de seis dígitos enviado ao seu e-mail.',
        )
      "
      tone="muted"
    />
    <MPinInput
      v-model="code"
      :label="t('Verification code', 'Código de verificação')"
      :disabled="disabled"
      :error="
        error
          ? t('This code has expired. Request another.', 'O código expirou. Solicite outro.')
          : undefined
      "
      :helperText="t('You can paste the entire code.', 'Você pode colar o código inteiro.')"
      @complete="(value) => (complete = value)"
    />
    <MRow gap="sm" wrap
      ><MButton
        :text="t('Try a pasted code', 'Testar um código')"
        variant="secondary"
        :disabled="disabled"
        @click="code = '012345'" /><MButton
        :text="t('Clear', 'Limpar')"
        variant="ghost"
        @click="clearCode"
    /></MRow>
    <MRow gap="sm" wrap
      ><MSwitch v-model="error" :label="t('Show error', 'Mostrar erro')" /><MSwitch
        v-model="disabled"
        :label="t('Disable input', 'Desabilitar campo')"
    /></MRow>
    <MText id="pin-complete" :text="complete || '—'" variant="caption" tone="muted" />
  </MColumn>
</template>
