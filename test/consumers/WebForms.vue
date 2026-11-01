<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { MInput, MButton, MColumn } from '@getcortexlabs/mavis-web'

const email = ref('')
const bio = ref('Initial bio')
const password = ref('installed-password')
const passwordVisible = ref(false)
const code = ref('outside')
const emailRef = ref<InstanceType<typeof MInput>>()
const bioRef = useTemplateRef('bioRef')
const inputDisabled = ref(false)
const disabled = ref(false)
const loading = ref(false)
const legacy = ref(false)
const cancelEnter = ref(false)
const managedReset = ref(true)
const changedAttrs = ref(false)
const message = ref('Email help')
const error = ref('')
const submits = ref(0)
const actions = ref(0)
const edits = ref(0)
const changes = ref(0)
const invalid = ref(0)
const resets = ref(0)
const keys = ref(0)
const lastKeyTarget = ref('')
const data = ref<Record<string, FormDataEntryValue>>({})
const submitter = ref('')
const externalData = ref<Record<string, FormDataEntryValue>>({})

function writeModels() {
  email.value = 'external@example.com'
  bio.value = 'External bio'
}

function submit(event: SubmitEvent) {
  submits.value++
  data.value = Object.fromEntries(new FormData(event.target as HTMLFormElement, event.submitter))
  submitter.value = event.submitter?.id ?? ''
}
function keydown(event: KeyboardEvent) {
  keys.value++
  lastKeyTarget.value = (event.target as HTMLElement).tagName
  if (cancelEnter.value && event.key === 'Enter') event.preventDefault()
}
function reset(event: Event) {
  resets.value++
  if (managedReset.value) {
    event.preventDefault()
    email.value = ''
    bio.value = 'Initial bio'
  }
}
function externalSubmit(event: SubmitEvent) {
  externalData.value = Object.fromEntries(new FormData(event.target as HTMLFormElement))
}
</script>

<template>
  <MColumn gap="md" padding="lg">
    <form id="account-form" @submit.prevent="submit" @reset="reset">
      <MInput
        id="form-email"
        ref="emailRef"
        v-model="email"
        label="Form email"
        type="email"
        :name="changedAttrs ? 'contact' : 'email'"
        :autocomplete="changedAttrs ? 'username' : 'email'"
        :inputmode="changedAttrs ? 'text' : 'email'"
        :required="!changedAttrs"
        :disabled="inputDisabled"
        :helperText="message"
        :error="error"
        aria-controls="email-suggestions"
        aria-describedby="email-policy email-policy"
        class="consumer-field"
        :style="{ marginBottom: '12px' }"
        :onSubmit="legacy ? () => actions++ : undefined"
        @input="edits++"
        @change="changes++"
        @invalid="invalid++"
        @keydown="keydown"
      />
      <p id="email-policy">Only used for this form test.</p>
      <div id="email-suggestions" />
      <m-input
        ref="bioRef"
        v-model="bio"
        name="bio"
        label="Form bio"
        multiline
        autocomplete="off"
        inputmode="text"
        aria-describedby="bio-policy"
        helperText="Bio help"
      />
      <p id="bio-policy">A short description.</p>
      <MInput
        v-model="password"
        label="Form password"
        name="password"
        :type="passwordVisible ? 'text' : 'password'"
        autocapitalize="none"
        :autocorrect="false"
        :trailingAction="{
          icon: passwordVisible ? 'eye-off' : 'eye',
          label: passwordVisible ? 'Hide form password' : 'Show form password',
        }"
        @action="passwordVisible = !passwordVisible"
      />
      <MButton
        id="form-save"
        type="submit"
        name="intent"
        value="save"
        :disabled="disabled"
        :loading="loading"
        >Submit form</MButton
      >
      <MButton id="form-reset" type="reset" :loading="loading">Reset form</MButton>
      <MButton id="plain-action">Ordinary action</MButton>
    </form>
    <form id="external-form" @submit.prevent="externalSubmit" />
    <MInput
      v-model="code"
      label="External code"
      name="code"
      :form="changedAttrs ? 'account-form' : 'external-form'"
      required
    />
    <MButton type="submit" form="external-form">Submit external</MButton>
    <MButton @click="loading = !loading">Toggle form loading</MButton>
    <MButton @click="disabled = !disabled">Toggle submit disabled</MButton>
    <MButton @click="inputDisabled = !inputDisabled">Toggle editor disabled</MButton>
    <MButton @click="legacy = !legacy">Toggle component submit</MButton>
    <MButton @click="cancelEnter = !cancelEnter">Toggle Enter cancellation</MButton>
    <MButton @click="managedReset = !managedReset">Toggle reset ownership</MButton>
    <MButton @click="changedAttrs = !changedAttrs">Change editor attributes</MButton>
    <MButton @click="error = error ? '' : 'Review email'">Toggle field error</MButton>
    <MButton @click="message = ''">Remove field help</MButton>
    <MButton @click="writeModels">Write form models</MButton>
    <MButton @click="emailRef?.focus()">Focus form email</MButton>
    <MButton @click="emailRef?.blur()">Blur form email</MButton>
    <MButton @click="bioRef?.focus()">Focus form bio</MButton>
    <output id="form-state">{{
      JSON.stringify({
        email,
        bio,
        submits,
        actions,
        edits,
        changes,
        invalid,
        resets,
        keys,
        lastKeyTarget,
        data,
        submitter,
        externalData,
      })
    }}</output>
  </MColumn>
</template>
