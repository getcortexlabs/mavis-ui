<script setup lang="ts">
import { computed, ref } from 'vue'
import type { InputHandle } from '@getcortexlabs/mavis-core'

const props = withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: 'pt' })
const pt = computed(() => props.lang === 'pt')
const name = ref('Marina Costa')
const email = ref('marina@')
const password = ref('mavis-demo')
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
      :label="pt ? 'Nome' : 'Name'"
      :placeholder="pt ? 'Como podemos chamar você?' : 'What should we call you?'"
      autocapitalize="words"
      :helperText="pt ? 'Seu nome, do seu jeito.' : 'Your name, your way.'"
      @submit="submitted = $event"
    />
    <m-input
      v-model="email"
      :label="pt ? 'E-mail' : 'Email'"
      type="email"
      icon="mail"
      placeholder="voce@exemplo.com"
      :error="error"
      :helperText="
        pt ? 'A validação pertence à sua aplicação.' : 'Your application owns validation.'
      "
      @blur="checked = true"
    />
    <m-input
      v-model="password"
      :label="pt ? 'Senha' : 'Password'"
      type="password"
      icon="lock"
      trailingIcon="eye-off"
      :helperText="pt ? 'Exemplo de campo protegido.' : 'A secure field example.'"
    />
    <m-input
      v-model="bio"
      label="Bio"
      multiline
      :maxLength="160"
      :helperText="`${bio.length}/160`"
    />
    <m-input
      modelValue="@marina"
      :label="pt ? 'Identificador' : 'Handle'"
      readonly
      :helperText="pt ? 'Somente leitura.' : 'Read only.'"
    />
    <m-input
      :modelValue="pt ? 'Em breve' : 'Coming soon'"
      :label="pt ? 'Convite' : 'Invitation'"
      disabled
    />
    <m-row gap="sm" wrap>
      <m-button size="sm" @click="checked = true">{{
        pt ? 'Validar e-mail' : 'Validate email'
      }}</m-button>
      <m-button size="sm" variant="secondary" @click="field?.focus()">{{
        pt ? 'Focar nome' : 'Focus name'
      }}</m-button>
      <m-button size="sm" variant="ghost" @click="reset">{{ pt ? 'Restaurar' : 'Reset' }}</m-button>
    </m-row>
    <m-text v-if="submitted" variant="caption" tone="primary"
      >{{ pt ? 'Enviado' : 'Submitted' }}: {{ submitted }}</m-text
    >
  </m-column>
</template>
