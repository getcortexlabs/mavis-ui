<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormError } from './types'
import { useFormController, useFormField } from '@getcortexlabs/mavis-core/vue'
import { watch } from 'vue'

const emailField = ref<{ focus(): void; blur(): void }>()
const state = reactive({
  formErrors: [] as FormError[],
  value: '' as string,
  focused: '' as string,
  check(): void {
    state.formErrors = [{ field: 'email', message: 'Enter an address' }]
  },
  clear(): void {
    state.formErrors = []
  },
  first(): void {
    if (state.formErrors.find((error) => ['email'].includes(error.field))?.field === 'email') {
      emailField.value?.focus()
    }
  },
})
const mavisForm1 = useFormController()
useFormField(mavisForm1, { name: 'email', label: 'Email', target: () => emailField.value })
watch(
  () => state.formErrors,
  (errors) => mavisForm1.setErrors(errors),
  { immediate: true, deep: true },
)
</script>

<template>
  <MColumn gap="md" padding="lg">
    <MFormGroup label="Profile" description="Your contact information">
      <MInput
        ref="emailField"
        label="Email"
        :modelValue="state.value"
        @update:modelValue="(value) => (state.value = value)"
      />
    </MFormGroup>
    <MFormErrors
      :form="mavisForm1"
      @focus="(field, found) => (state.focused = found ? field : 'unavailable')"
    />
    <MButton text="Check" @click="() => state.check()" />
    <MButton text="First error" @click="() => state.first()" />
    <MButton text="Clear errors" @click="() => state.clear()" />
    <MText>{{ `Focused ${state.focused}` }}</MText>
  </MColumn>
</template>
