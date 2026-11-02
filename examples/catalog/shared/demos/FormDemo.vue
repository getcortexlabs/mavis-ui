<script setup lang="ts">
import { useCatalogLocale } from '../locale'
import { computed, onScopeDispose, ref, shallowRef } from 'vue'
import type { InputHandle } from '@getcortexlabs/mavis-core'
import { useFormController, useFormField } from '@getcortexlabs/mavis-core/vue'

const { t, locale } = useCatalogLocale(() => props.lang)

const props = withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: undefined })

const pt = computed(() => (props.lang ?? locale.value) === 'pt')
const name = ref('')
const email = ref('')
const nameInput = ref<InputHandle>()
const emailInput = ref<InputHandle>()
const form = useFormController()
const state = shallowRef(form.state)
const saved = ref(false)
onScopeDispose(
  form.subscribe((next) => {
    state.value = next
  }),
)
useFormField(form, {
  name: 'name',
  label: pt.value ? 'Nome' : 'Name',
  target: () => nameInput.value,
})
useFormField(form, { name: 'email', label: 'Email', target: () => emailInput.value })
const error = (field: string) =>
  state.value.errors.find((error) => error.field === field)?.message ?? ''
async function submit() {
  const result = await form.validate(async () => [
    ...(!name.value.trim()
      ? [{ field: 'name', message: pt.value ? 'Informe seu nome.' : 'Enter your name.' }]
      : []),
    ...(!email.value.includes('@')
      ? [{ field: 'email', message: pt.value ? 'Revise seu email.' : 'Check your email.' }]
      : []),
  ])
  saved.value = result === 'valid'
  if (result === 'invalid') await form.focusFirstError()
}
function edit() {
  saved.value = false
  form.invalidate()
}
</script>
<template>
  <m-column gap="lg">
    <m-form-errors :form="form" :title="t(pt ? 'Revise seus dados' : 'Review your details')" />
    <m-form-group
      :label="t(pt ? 'Vamos manter contato' : 'Let’s stay in touch')"
      :description="
        t(
          pt
            ? 'Seus dados permanecem nesta demonstração.'
            : 'Your details stay in this demonstration.',
        )
      "
    >
      <m-input
        ref="nameInput"
        v-model="name"
        :label="t(pt ? 'Nome' : 'Name')"
        autocomplete="name"
        :error="t(error('name'))"
        @update:modelValue="edit"
      />
      <m-input
        ref="emailInput"
        v-model="email"
        :label="t('Email')"
        type="email"
        autocomplete="email"
        :error="t(error('email'))"
        @update:modelValue="edit"
      />
    </m-form-group>
    <m-button :loading="state.validating" @click="submit">{{
      t(pt ? 'Revisar cadastro' : 'Review registration')
    }}</m-button>
    <m-text v-if="saved" tone="primary">{{
      t(pt ? 'Tudo certo para continuar.' : 'Ready to continue.')
    }}</m-text>
  </m-column>
</template>
