<script setup lang="ts">
import { useCatalogLocale } from '../locale'
import { computed, ref } from 'vue'
import type { InputHandle } from '@getcortexlabs/mavis-core'

const { t, locale } = useCatalogLocale(() => props.lang)

const props = withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: undefined })

const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const name = ref('Marina Costa')
const email = ref('marina@')
const password = ref('mavis-demo')
const passwordVisible = ref(false)
const bio = ref('Design, café e boas ideias.')
const checked = ref(false)
const submitted = ref('')
const field = ref<InputHandle>()
const error = computed(() =>
  checked.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
    ? pt.value
      ? 'Confira o endereço de e-mail.'
      : 'Check the email address.'
    : '',
)

function reset() {
  name.value = 'Marina Costa'
  email.value = 'marina@'
  password.value = 'mavis-demo'
  passwordVisible.value = false
  bio.value = 'Design, café e boas ideias.'
  checked.value = false
  submitted.value = ''
}
</script>

<template>
  <m-column gap="lg">
    <m-input
      ref="field"
      id="demo-name"
      v-model="name"
      :label="t(pt ? 'Nome' : 'Name')"
      :placeholder="t(pt ? 'Como podemos chamar você?' : 'What should we call you?')"
      autocapitalize="words"
      :helperText="t(pt ? 'Seu nome, do seu jeito.' : 'Your name, your way.')"
      @submit="submitted = $event"
    />
    <m-input
      v-model="email"
      :label="t(pt ? 'E-mail' : 'Email')"
      type="email"
      icon="mail"
      :placeholder="t('voce@exemplo.com')"
      :error="t(error)"
      :helperText="
        t(pt ? 'A validação pertence à sua aplicação.' : 'Your application owns validation.')
      "
      @blur="checked = true"
    />
    <m-input
      v-model="password"
      :label="t(pt ? 'Senha' : 'Password')"
      :type="passwordVisible ? 'text' : 'password'"
      icon="lock"
      autocapitalize="none"
      :autocorrect="false"
      :trailingAction="{
        icon: passwordVisible ? 'eye-off' : 'eye',
        label: passwordVisible
          ? pt
            ? 'Ocultar senha'
            : 'Hide password'
          : pt
            ? 'Mostrar senha'
            : 'Show password',
      }"
      @action="passwordVisible = !passwordVisible"
      :helperText="t(pt ? 'Exemplo de campo protegido.' : 'A secure field example.')"
    />
    <m-input
      v-model="bio"
      :label="t('Bio')"
      multiline
      :maxLength="160"
      :helperText="t(`${bio.length}/160`)"
    />
    <m-input
      modelValue="@marina"
      :label="t(pt ? 'Identificador' : 'Handle')"
      readonly
      :helperText="t(pt ? 'Somente leitura.' : 'Read only.')"
    />
    <m-input
      :modelValue="pt ? 'Em breve' : 'Coming soon'"
      :label="t(pt ? 'Convite' : 'Invitation')"
      disabled
    />
    <m-row gap="sm" wrap>
      <m-button size="sm" @click="checked = true">{{
        t(pt ? 'Validar e-mail' : 'Validate email')
      }}</m-button>
      <m-button size="sm" variant="secondary" @click="field?.focus()">{{
        t(pt ? 'Focar nome' : 'Focus name')
      }}</m-button>
      <m-button size="sm" variant="ghost" @click="reset">{{
        t(pt ? 'Restaurar' : 'Reset')
      }}</m-button>
    </m-row>
    <m-text v-if="submitted" variant="caption" tone="primary"
      >{{ t(pt ? 'Enviado' : 'Submitted') }}: {{ t(submitted) }}</m-text
    >
  </m-column>
</template>
