<script setup lang="ts">
import { computed, KeepAlive, nextTick, onScopeDispose, reactive, ref, shallowRef } from 'vue'
import type { ChoiceValue, FormError, StepOption } from '@getcortexlabs/mavis-core'
import { useFormController, useFormField } from '@getcortexlabs/mavis-core/vue'
import RegistrationPanel from '../workflows/RegistrationPanel.vue'
import type { RegistrationDraft } from '../workflows/registration'
const props = withDefaults(defineProps<{ lang?: 'en' | 'pt' }>(), { lang: 'pt' })
const pt = computed(() => props.lang === 'pt')
const step = ref('details')
let transition = 0
onScopeDispose(() => {
  transition++
})
const completed = ref(false)
const draft = reactive<RegistrationDraft>({
  name: '',
  date: null,
  dateValid: true,
  place: null,
  query: '',
  selected: null,
})
const form = useFormController()
const state = shallowRef(form.state)
onScopeDispose(
  form.subscribe((value) => {
    state.value = value
  }),
)
const panel = ref<InstanceType<typeof RegistrationPanel>>()
for (const [field, section, en, ptLabel] of [
  ['name', 'details', 'Gathering name', 'Nome do encontro'],
  ['date', 'details', 'Gathering date', 'Data do encontro'],
  ['place', 'place', 'City', 'Cidade'],
]) {
  useFormField(form, {
    name: field!,
    label: pt.value ? ptLabel! : en!,
    target: () => panel.value?.getField(field!),
    reveal: async () => {
      transition++
      step.value = section!
      await nextTick()
    },
  })
}
const steps = computed<StepOption[]>(() => [
  {
    value: 'details',
    label: pt.value ? 'Encontro' : 'Gathering',
    status: state.value.errors.some((e) => ['name', 'date'].includes(e.field))
      ? 'error'
      : draft.name.trim() && draft.date && draft.dateValid
        ? 'complete'
        : 'pending',
  },
  {
    value: 'place',
    label: pt.value ? 'Lugar' : 'Place',
    status: state.value.errors.some((e) => e.field === 'place')
      ? 'error'
      : draft.place
        ? 'complete'
        : 'pending',
  },
  {
    value: 'review',
    label: pt.value ? 'Revisão' : 'Review',
    status: completed.value ? 'complete' : 'pending',
  },
])
const errors = (section?: string): FormError[] => {
  const result: FormError[] = []
  if (!section || section === 'details') {
    if (!draft.name.trim())
      result.push({
        field: 'name',
        message: pt.value ? 'Dê um nome ao encontro.' : 'Give your gathering a name.',
      })
    if (!draft.date || !draft.dateValid)
      result.push({
        field: 'date',
        message: pt.value ? 'Informe uma data válida.' : 'Enter a valid date.',
      })
  }
  if ((!section || section === 'place') && !draft.place)
    result.push({ field: 'place', message: pt.value ? 'Escolha uma cidade.' : 'Choose a city.' })
  return result
}
async function changeStep(next: ChoiceValue) {
  if (state.value.validating) return
  const order = ['details', 'place', 'review']
  if (order.indexOf(String(next)) > order.indexOf(step.value)) {
    const current = errors(step.value)
    form.setErrors(current)
    if (current.length) {
      await form.focusFirstError()
      return
    }
  }
  const request = ++transition
  step.value = String(next)
  await nextTick()
  if (request === transition)
    panel.value
      ?.getField(
        step.value === 'details' ? 'name' : step.value === 'place' ? 'place' : 'attachments',
      )
      ?.focus()
}
function edit() {
  completed.value = false
  form.invalidate()
}
async function submit() {
  const result = await form.validate(
    (context) =>
      new Promise((resolve) => {
        const timer = setTimeout(() => resolve(errors()), 450)
        context.onCancel(() => {
          clearTimeout(timer)
          resolve([])
        })
      }),
  )
  if (result === 'invalid') await form.focusFirstError()
  else if (result === 'valid') completed.value = true
}
</script>
<template>
  <m-column gap="lg" id="registration-demo">
    <m-steps
      :modelValue="step"
      :steps="steps"
      :label="pt ? 'Etapas do encontro' : 'Gathering steps'"
      :loading="state.validating"
      :currentLabel="pt ? 'Atual' : 'Current'"
      :completeLabel="pt ? 'Completo' : 'Complete'"
      :errorLabel="pt ? 'Revisar' : 'Needs attention'"
      @update:modelValue="changeStep"
    />
    <m-form-errors
      :form="form"
      :title="pt ? 'Vamos revisar estes detalhes' : 'Review these details'"
    />
    <KeepAlive>
      <RegistrationPanel
        :key="step"
        ref="panel"
        :step="step"
        :draft="draft"
        :errors="state.errors"
        :lang="lang"
        @edit="edit"
      />
    </KeepAlive>
    <m-alert
      v-if="completed"
      tone="success"
      :title="pt ? 'Encontro preparado' : 'Gathering prepared'"
      :description="
        pt
          ? 'A demonstração foi concluída. Nenhum cadastro foi enviado.'
          : 'The demonstration is complete. No registration was sent.'
      "
    />
    <m-row gap="sm" wrap>
      <m-button
        v-if="step !== 'details'"
        variant="secondary"
        :disabled="state.validating"
        @click="changeStep(step === 'review' ? 'place' : 'details')"
        >{{ pt ? 'Voltar' : 'Back' }}</m-button
      >
      <m-button
        v-if="step !== 'review'"
        :disabled="state.validating"
        @click="changeStep(step === 'details' ? 'place' : 'review')"
        >{{ pt ? 'Continuar' : 'Continue' }}</m-button
      >
      <m-button
        :loading="state.validating"
        :variant="step === 'review' ? 'primary' : 'ghost'"
        @click="submit"
        >{{ pt ? 'Concluir demonstração' : 'Finish demonstration' }}</m-button
      >
    </m-row>
  </m-column>
</template>
