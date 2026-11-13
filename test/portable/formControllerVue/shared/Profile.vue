<script setup lang="ts">
import { ref } from 'vue'
import type { InputHandle } from '@getcortexlabs/mavis-core/vue'
import { useFormController, useFormField } from '@getcortexlabs/mavis-core/vue'
const emailField = ref<InputHandle | null>(null)
const form = useFormController()
useFormField(form, { name: 'email', label: 'Email', target: () => emailField.value })
const value = ref('')
const focused = ref('')
function check() {
  form.setErrors([{ field: 'email', message: 'Enter an address' }])
}
function clear() {
  form.setErrors([])
}
function first() {
  form.focusFirstError()
}
</script>
<template>
  <MColumn gap="md" padding="lg">
    <MFormGroup label="Profile" description="Your contact information">
      <MInput ref="emailField" label="Email" v-model="value" />
    </MFormGroup>
    <MFormErrors
      :form="form"
      @focus="
        (field, found) => {
          focused = found ? field : 'unavailable'
        }
      "
    />
    <MButton text="Check" @click="check" />
    <MButton text="First error" @click="first" />
    <MButton text="Clear errors" @click="clear" />
    <MText>Focused {{ focused }}</MText>
  </MColumn>
</template>
